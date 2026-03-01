"""Rate limiting: Upstash Redis in production, in-memory fallback for dev."""

import time
from collections import defaultdict
from fastapi import HTTPException, Request, Depends
from app.config import get_settings, Settings

_memory_store: dict[str, list[float]] = defaultdict(list)
_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    s = get_settings()
    if s.upstash_redis_url:
        import redis

        _redis_client = redis.from_url(
            s.upstash_redis_url,
            password=s.upstash_redis_token or None,
            decode_responses=True,
        )
        return _redis_client
    return None


def _check_memory(key: str, limit: int, window: int) -> bool:
    now = time.time()
    timestamps = _memory_store[key]
    _memory_store[key] = [t for t in timestamps if now - t < window]
    if len(_memory_store[key]) >= limit:
        return False
    _memory_store[key].append(now)
    return True


def _check_redis(r, key: str, limit: int, window: int) -> bool:
    pipe = r.pipeline()
    now = time.time()
    pipe.zadd(key, {str(now): now})
    pipe.zremrangebyscore(key, 0, now - window)
    pipe.zcard(key)
    pipe.expire(key, window)
    results = pipe.execute()
    count = results[2]
    return count <= limit


class RateLimiter:
    def __init__(self, limit: int = 10, window: int = 60):
        self.limit = limit
        self.window = window

    async def __call__(self, request: Request):
        user_id = request.state.__dict__.get("user_id", request.client.host if request.client else "anon")
        key = f"rl:{request.url.path}:{user_id}"

        r = _get_redis()
        if r:
            allowed = _check_redis(r, key, self.limit, self.window)
        else:
            allowed = _check_memory(key, self.limit, self.window)

        if not allowed:
            raise HTTPException(
                status_code=429, detail="Rate limit exceeded. Please wait."
            )


ai_rate_limit = RateLimiter(limit=10, window=60)

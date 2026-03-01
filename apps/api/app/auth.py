"""JWT verification and role-based access control using Supabase tokens."""

from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt
from pydantic import BaseModel
from app.config import get_settings, Settings


class AuthUser(BaseModel):
    id: str
    role: str  # 'child' or 'supervisor'
    email: str | None = None


def _extract_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return auth[7:]


async def get_current_user(
    request: Request, settings: Settings = Depends(get_settings)
) -> AuthUser:
    token = _extract_token(request)
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    role = payload.get("user_metadata", {}).get("role")
    if not role:
        role = payload.get("app_metadata", {}).get("role")
    if not role:
        from app.db import get_profile_role
        role = await get_profile_role(user_id)

    if role not in ("child", "supervisor"):
        raise HTTPException(status_code=403, detail="Unknown role")

    return AuthUser(
        id=user_id,
        role=role,
        email=payload.get("email"),
    )


def require_supervisor(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Supervisor access required")
    return user


def require_child(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if user.role != "child":
        raise HTTPException(status_code=403, detail="Child access required")
    return user

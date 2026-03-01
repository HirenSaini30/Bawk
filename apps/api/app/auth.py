"""Token verification and role-based access control using Supabase auth."""

from fastapi import Depends, HTTPException, Request
from pydantic import BaseModel
from app.db import get_profile_role, get_supabase


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
    request: Request,
) -> AuthUser:
    token = _extract_token(request)

    try:
        user_response = get_supabase().auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    auth_user = getattr(user_response, "user", None)
    user_id = getattr(auth_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user_metadata = getattr(auth_user, "user_metadata", {}) or {}
    app_metadata = getattr(auth_user, "app_metadata", {}) or {}

    role = user_metadata.get("role")
    if not role:
        role = app_metadata.get("role")
    if not role:
        role = await get_profile_role(user_id)

    if role not in ("child", "supervisor"):
        raise HTTPException(status_code=403, detail="Unknown role")

    request.state.user_id = user_id

    return AuthUser(
        id=user_id,
        role=role,
        email=getattr(auth_user, "email", None),
    )


def require_supervisor(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Supervisor access required")
    return user


def require_child(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if user.role != "child":
        raise HTTPException(status_code=403, detail="Child access required")
    return user


import os
from typing import Optional
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine, text
import structlog
from dotenv import load_dotenv

# Load environment variables (including DATABASE_URL)
load_dotenv(".env.local")
load_dotenv(".env")

logger = structlog.get_logger(__name__)

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.warning("DATABASE_URL not found. Authentication will fail.")

engine = create_engine(DATABASE_URL) if DATABASE_URL else None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/management/login")

def verify_session_token(token: str) -> Optional[dict]:
    """
    Verify the better-auth session token against the database.
    Returns the user dict if valid, None otherwise.
    """
    if not engine:
        return None
    
    try:
        with engine.connect() as conn:
            # Query the session table to find the user_id
            # better-auth table names usually follow a pattern. Assuming 'session' and 'user'.
            # Adjust table names if creating a new schema, but standard is 'session' and 'user'.
            query = text("""
                SELECT u.id, u.name, u.email, u.role, s.expires_at
                FROM session s
                JOIN "user" u ON s.user_id = u.id
                WHERE s.token = :token
            """)
            result = conn.execute(query, {"token": token}).fetchone()
            
            if not result:
                return None
            
            # Check expiration
            expires_at = result.expires_at
            if expires_at < datetime.now():
                return None
                
            return {
                "id": result.id,
                "name": result.name,
                "email": result.email,
                "role": result.role
            }
    except Exception as e:
        logger.error("Database error verifying session", error=str(e))
        return None

async def get_current_admin(token: str = Depends(oauth2_scheme)):
    """
    FastAPI dependency to validate the session token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user = verify_session_token(token)
    if not user:
        raise credentials_exception
        
    # Optional: Check for admin permission if roles exist
    # if user.get("role") not in ["admin", "owner"]:
    #    raise HTTPException(status_code=403, detail="Insufficient permissions")
        
    return user

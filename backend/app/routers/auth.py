from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token, RefreshTokenRequest
from app.auth.password import hash_password, verify_password
from app.auth.jwt import create_access_token, create_refresh_token, verify_token

from app.auth.dependencies import get_current_active_user
from app.worker import send_email_task
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.responses import RedirectResponse
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth = OAuth()

# Check and register Google OAuth
if settings.GOOGLE_CLIENT_ID:
    oauth.register(
        name='google',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )

# Check and register GitHub OAuth
if settings.GITHUB_CLIENT_ID:
    oauth.register(
        name='github',
        client_id=settings.GITHUB_CLIENT_ID,
        client_secret=settings.GITHUB_CLIENT_SECRET,
        access_token_url='https://github.com/login/oauth/access_token',
        access_token_params=None,
        authorize_url='https://github.com/login/oauth/authorize',
        authorize_params=None,
        api_base_url='https://api.github.com/',
        client_kwargs={'scope': 'user:email'},
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.
    
    - **email**: Unique email address
    - **username**: Unique username (3-100 characters)
    - **password**: Password (min 8 characters)
    - **full_name**: Optional full name
    """
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Send welcome email asynchronously
    send_email_task.delay(new_user.email, "Welcome to Lumen Blog", f"Hi {new_user.username}, welcome aboard!")

    return new_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 compatible login endpoint.
    
    Returns access token and refresh token.
    """
    # Find user by email (username field in OAuth2 form)
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    payload = verify_token(token_request.refresh_token, token_type="refresh")
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user information.
    """
    return current_user


@router.get("/login/{provider}")
async def login_oauth(provider: str, request: Request):
    """
    Initiate OAuth2 login for a specific provider (google, github).
    """
    if provider not in ["google", "github"]:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Verify if provider is configured
    client = oauth.create_client(provider)
    if not client:
         raise HTTPException(status_code=501, detail=f"{provider} login not configured")

    redirect_uri = request.url_for('auth_callback', provider=provider)
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/callback/{provider}")
async def auth_callback(
    provider: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Callback endpoint for OAuth2 providers.
    """
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    try:
        token = await client.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail="OAuth connection failed")

    email = None
    name = None
    oauth_id = None
    
    if provider == 'google':
        user_info = token.get('userinfo')
        if not user_info:
             # Manually fetch if not in token
             resp = await client.get('https://www.googleapis.com/oauth2/v3/userinfo')
             user_info = resp.json()
        
        email = user_info.get('email')
        name = user_info.get('name')
        oauth_id = user_info.get('sub')
             
    elif provider == 'github':
        resp = await client.get('user')
        profile = resp.json()
        name = profile.get('name')
        oauth_id = str(profile.get('id'))
        
        # Github email might be private, fetch it explicitly
        resp_emails = await client.get('user/emails')
        if resp_emails.status_code == 200:
            emails = resp_emails.json()
            for e in emails:
                if e['primary']:
                    email = e['email']
                    break
        else:
             email = profile.get('email')
                
    if not email:
        raise HTTPException(status_code=400, detail="Could not validate email from provider")

    # Check if user exists
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user:
        # Update oauth info if missing
        if not user.oauth_provider:
             user.oauth_provider = provider
             user.oauth_id = oauth_id
             user.is_verified = True # Trusted provider
             await db.commit()
    else:
        # Create new user
        # We need a random password or null password (if schema allows)
        # User model allows null hashed_password
        
        # Determine username from email or name
        base_username = email.split('@')[0]
        username = base_username
        
        # Unique username check
        counter = 1
        while True:
            res = await db.execute(select(User).where(User.username == username))
            if not res.scalar_one_or_none():
                break
            username = f"{base_username}{counter}"
            counter += 1
            
        user = User(
            email=email,
            username=username,
            full_name=name,
            oauth_provider=provider,
            oauth_id=oauth_id,
            is_active=True,
            is_verified=True,
            hashed_password=None # OAuth users don't have a password initially
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    # Create valid Access/Refresh Tokens for our app
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Redirect to frontend with tokens
    # TODO: In production, do not send tokens in URL fragments or query params if possible.
    # Safe way: Set HTTPOnly cookies and redirect.
    # For MVP/Dev: We can redirect to a frontend page that reads the query params.
    
    # Assuming frontend is on port 3000
    frontend_url = "http://localhost:3000/auth/oauth-callback" 
    response = RedirectResponse(url=f"{frontend_url}?access_token={access_token}&refresh_token={refresh_token}")
    
    # Also set cookies just in case
    # response.set_cookie(key="access_token", value=access_token, httponly=True)
    
    return response

from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
import os
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta

load_dotenv()

router = APIRouter()

# OAuth 2.0 configuration
SCOPES = ['https://www.googleapis.com/auth/calendar']
CLIENT_SECRETS_FILE = None  # We'll use environment variables instead

# In-memory storage for demo purposes (use proper session management in production)
user_credentials = {}

def create_flow():
    """Create OAuth flow with environment variables"""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/auth/callback")
    
    # Debug: Print configuration (remove in production)
    print(f"Client ID: {client_id}")
    print(f"Redirect URI: '{redirect_uri}'")
    
    return Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri.strip()]  # Remove any trailing whitespace
            }
        },
        scopes=SCOPES
    )

@router.get("/login")
async def login():
    """Initiate Google OAuth flow"""
    try:
        flow = create_flow()
        flow.redirect_uri = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/auth/callback")
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        return RedirectResponse(url=authorization_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth setup failed: {str(e)}")

@router.get("/login-url")
async def get_login_url():
    """Get the Google OAuth URL without redirecting (for testing)"""
    try:
        flow = create_flow()
        flow.redirect_uri = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/auth/callback")
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        return {"login_url": authorization_url, "state": state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth setup failed: {str(e)}")

@router.get("/callback")
async def auth_callback(code: str, state: str = None):
    """Handle OAuth callback and exchange code for tokens"""
    try:
        flow = create_flow()
        flow.redirect_uri = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/auth/callback")
        flow.fetch_token(code=code)
        
        # Store credentials (in production, use secure session management)
        credentials = flow.credentials
        user_credentials['default_user'] = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        
        return {"message": "Authentication successful! You can now use the calendar API endpoints."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

def get_credentials():
    """Dependency to get user credentials"""
    if 'default_user' not in user_credentials:
        raise HTTPException(status_code=401, detail="Not authenticated. Please visit /login first.")
    
    creds_data = user_credentials['default_user']
    credentials = Credentials(
        token=creds_data['token'],
        refresh_token=creds_data['refresh_token'],
        token_uri=creds_data['token_uri'],
        client_id=creds_data['client_id'],
        client_secret=creds_data['client_secret'],
        scopes=creds_data['scopes']
    )
    
    # Refresh token if expired
    if credentials.expired and credentials.refresh_token:
        credentials.refresh(GoogleRequest())
        # Update stored credentials
        user_credentials['default_user'].update({
            'token': credentials.token,
            'refresh_token': credentials.refresh_token
        })
    
    return credentials 
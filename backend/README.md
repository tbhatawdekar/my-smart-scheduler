# Smart Scheduler Backend

A FastAPI backend that integrates with Google Calendar to provide smart scheduling capabilities with wellbeing prioritization.

## Features

- Google OAuth 2.0 authentication
- Read today's calendar events
- Insert demo break events
- RESTful API with automatic documentation

## Quick Start

### 1. Set up Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate     # On Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your actual credentials
# TODO: Add your Google Cloud Console credentials
```

### 4. Run the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `GET /auth/login` - Initiate Google OAuth flow
- `GET /auth/callback` - OAuth callback handler

### Calendar Operations
- `GET /api/day` - Get today's calendar events
- `POST /api/insert` - Insert a 15-minute break at noon (demo)

### Utility
- `GET /` - API information
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)

## Google Cloud Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API

### 2. Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in app information
4. Add scopes: `https://www.googleapis.com/auth/calendar`

### 3. Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URI: `http://localhost:8000/auth/callback`
5. Copy Client ID and Client Secret

### 4. Update Environment Variables
Edit your `.env` file:
```env
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
OPENAI_API_KEY=your_openai_api_key_here
```

## Testing the API

1. Start the server: `uvicorn app.main:app --reload`
2. Visit `http://localhost:8000/login` to authenticate with Google
3. After authentication, test the endpoints:
   - `GET http://localhost:8000/api/day` - View today's events
   - `POST http://localhost:8000/api/insert` - Insert a break event

## Development

### Project Structure
```
backend/
├── app/
│   ├── main.py          # FastAPI application setup
│   ├── auth.py          # Google OAuth authentication
│   └── calendar.py      # Calendar operations
├── requirements.txt     # Python dependencies
├── env.example         # Environment variables template
└── README.md           # This file
```

### Adding New Features
- Add new routes in appropriate modules
- Use the `get_credentials()` dependency for authenticated endpoints
- Follow FastAPI best practices for request/response models

## Security Notes

⚠️ **Important**: This is a demo implementation with in-memory credential storage. For production:

- Use secure session management (Redis, database)
- Implement proper user authentication
- Add rate limiting
- Use HTTPS in production
- Store credentials securely

## Documentation Links

- [Google Calendar Python Quickstart](https://developers.google.com/calendar/api/quickstart/python)
- [google-auth-oauthlib Documentation](https://google-auth-oauthlib.readthedocs.io/)
- [FastAPI Depends Documentation](https://fastapi.tiangolo.com/tutorial/dependencies/) 
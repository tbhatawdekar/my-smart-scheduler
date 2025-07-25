from fastapi import APIRouter, Depends, HTTPException, Body
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import pytz
import openai
import os
import json as pyjson
import re

from .auth import get_credentials

router = APIRouter()

@router.get("/day")
async def get_today_events(credentials: Credentials = Depends(get_credentials)):
    """Get today's calendar events from primary calendar"""
    try:
        service = build('calendar', 'v3', credentials=credentials)
        
        # Get today's date in user's timezone (using UTC for demo)
        now = datetime.utcnow()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        # Format for Google Calendar API
        time_min = start_of_day.isoformat() + 'Z'
        time_max = end_of_day.isoformat() + 'Z'
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        # Format events for response
        formatted_events = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            
            formatted_events.append({
                'id': event['id'],
                'summary': event.get('summary', 'No title'),
                'start': start,
                'end': end,
                'description': event.get('description', ''),
                'location': event.get('location', '')
            })
        
        return {
            "date": start_of_day.strftime("%Y-%m-%d"),
            "events": formatted_events,
            "count": len(formatted_events)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch calendar events: {str(e)}")

@router.post("/insert")
async def insert_break_event(credentials: Credentials = Depends(get_credentials)):
    """Insert a 15-minute break event at noon today (demo)"""
    try:
        service = build('calendar', 'v3', credentials=credentials)
        
        # Create a 15-minute break at noon today
        now = datetime.utcnow()
        noon_today = now.replace(hour=12, minute=0, second=0, microsecond=0)
        break_end = noon_today + timedelta(minutes=15)
        
        event = {
            'summary': 'Break',
            'description': '15-minute break inserted by Smart Scheduler',
            'start': {
                'dateTime': noon_today.isoformat() + 'Z',
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': break_end.isoformat() + 'Z',
                'timeZone': 'UTC',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 5},
                ],
            },
        }
        
        event = service.events().insert(
            calendarId='primary',
            body=event
        ).execute()
        
        return {
            "message": "Break event inserted successfully",
            "event_id": event['id'],
            "summary": event['summary'],
            "start": event['start']['dateTime'],
            "end": event['end']['dateTime']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert event: {str(e)}") 

@router.post("/schedule-llm")
async def schedule_with_llm(
    mood: str = Body(..., embed=True),
    credentials: Credentials = Depends(get_credentials)
):
    """Schedule a wellbeing activity based on user's mood using LLM"""
    try:
        openai.api_key = os.getenv("OPENAI_API_KEY")
        if not openai.api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not set.")

        # Prompt for the LLM
        prompt = f"""
        You are a wellbeing assistant. The user is feeling: '{mood}'.
        Choose one of these activities: read, play a video game, go out for a walk.
        Suggest the best time for a 30-minute session today, based on the mood and typical daily routine (morning, afternoon, or evening).
        Respond in JSON with fields: activity, hour (24h, e.g. 10, 15, 19), and a short encouraging message.
        """
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
        )
        # Extract JSON from LLM response
        llm_text = response.choices[0].message.content
        match = re.search(r'\{.*\}', llm_text, re.DOTALL)
        if not match:
            raise HTTPException(status_code=500, detail="LLM did not return valid JSON.")
        llm_json = pyjson.loads(match.group(0))
        activity = llm_json.get("activity", "read")
        hour = int(llm_json.get("hour", 18))
        message = llm_json.get("message", "Enjoy your activity!")

        # Schedule the event in Google Calendar
        now = datetime.utcnow()
        start_time = now.replace(hour=hour, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(minutes=30)
        event = {
            'summary': activity.capitalize(),
            'description': f"Scheduled by Smart Scheduler LLM. Mood: {mood}. {message}",
            'start': {
                'dateTime': start_time.isoformat() + 'Z',
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time.isoformat() + 'Z',
                'timeZone': 'UTC',
            },
        }
        service = build('calendar', 'v3', credentials=credentials)
        event = service.events().insert(calendarId='primary', body=event).execute()
        return {
            "message": message,
            "activity": activity,
            "start": event['start']['dateTime'],
            "end": event['end']['dateTime'],
            "event_id": event['id']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule with LLM: {str(e)}") 
'use client';

import { useState, useEffect } from 'react';
import { apiService, CalendarEvent } from '@/lib/api';
import { formatTime, formatDate } from '@/lib/utils';

export default function HomePage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<string>('');
  const [addingBreak, setAddingBreak] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mood, setMood] = useState('');
  const [llmMessage, setLlmMessage] = useState<string | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);

  useEffect(() => {
    checkAuthAndLoadEvents();
  }, []);

  const checkAuthAndLoadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTodayEvents();
      setEvents(response.events);
      setToday(response.date);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Error loading events:', err);
      if (err.response?.status === 401) {
        // Not authenticated, redirect to login
        window.location.href = '/login';
        return;
      }
      setError('Failed to load calendar events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBreak = async () => {
    try {
      setAddingBreak(true);
      await apiService.insertBreakEvent();
      // Reload events to show the new break
      await loadTodayEvents();
    } catch (err) {
      console.error('Error adding break:', err);
      setError('Failed to add break event. Please try again.');
    } finally {
      setAddingBreak(false);
    }
  };

  const loadTodayEvents = async () => {
    try {
      setError(null);
      const response = await apiService.getTodayEvents();
      setEvents(response.events);
      setToday(response.date);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load calendar events. Please try again.');
    }
  };

  const handleLogout = () => {
    // For now, just redirect to login
    window.location.href = '/login';
  };

  const handleLLMSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood.trim()) return;
    try {
      setLlmLoading(true);
      setLlmMessage(null);
      const result = await apiService.scheduleWithLLM(mood);
      setLlmMessage(result.message + ` (Scheduled: ${result.activity} at ${formatTime(result.start)})`);
      setMood('');
      await loadTodayEvents();
    } catch (err) {
      setLlmMessage('Failed to schedule with LLM.');
    } finally {
      setLlmLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Scheduler</h1>
              <p className="text-gray-600 mt-1">
                {today && `Today's Schedule - ${formatDate(today)}`}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleAddBreak}
                disabled={addingBreak}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
              >
                {addingBreak ? 'Adding...' : 'Add Break'}
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Today's Events ({events.length})
            </h2>
          </div>
          
          {events.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events today</h3>
              <p className="mt-1 text-sm text-gray-500">
                You have a free day! Consider adding a break to maintain your wellbeing.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleAddBreak}
                  disabled={addingBreak}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                >
                  {addingBreak ? 'Adding...' : 'Add a Break'}
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {events.map((event) => (
                <li key={event.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{event.summary}</h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </div>
                      {event.location && (
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location}
                        </div>
                      )}
                      {event.description && (
                        <p className="mt-2 text-sm text-gray-600">{event.description}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadTodayEvents}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
          >
            Refresh Schedule
          </button>
        </div>

        {/* LLM Mood Scheduler */}
        <form onSubmit={handleLLMSchedule} className="mt-10 max-w-xl mx-auto flex flex-col items-center gap-4">
          <label htmlFor="mood" className="block text-sm font-medium text-gray-700">
            How are you feeling today?
          </label>
          <div className="flex w-full gap-2">
            <input
              id="mood"
              type="text"
              value={mood}
              onChange={e => setMood(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g. tired, bored, energetic..."
              disabled={llmLoading}
            />
            <button
              type="submit"
              disabled={llmLoading || !mood.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {llmLoading ? 'Scheduling...' : 'Suggest Activity'}
            </button>
          </div>
          {llmMessage && <div className="text-green-700 text-sm mt-2">{llmMessage}</div>}
        </form>
      </main>
    </div>
  );
}

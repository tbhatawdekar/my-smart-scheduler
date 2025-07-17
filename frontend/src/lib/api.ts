import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description: string;
  location: string;
}

export interface TodayEventsResponse {
  date: string;
  events: CalendarEvent[];
  count: number;
}

export interface InsertEventResponse {
  message: string;
  event_id: string;
  summary: string;
  start: string;
  end: string;
}

export const apiService = {
  // Authentication
  login: () => {
    window.location.href = `${API_BASE_URL}/auth/login`;
  },

  // Calendar operations
  getTodayEvents: async (): Promise<TodayEventsResponse> => {
    const response = await api.get('/api/day');
    return response.data;
  },

  insertBreakEvent: async (): Promise<InsertEventResponse> => {
    const response = await api.post('/api/insert');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
}; 
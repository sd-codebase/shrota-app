import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const AUTH_TOKEN_KEY = '@shrota_auth_token';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: object;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.name = 'ApiError';
  }
}

class ApiClient {
  private authLogoutCallback: (() => void) | null = null;

  /**
   * Set the callback to be called when a 401 response is received.
   * This should clear auth state and redirect to login.
   */
  setAuthLogoutCallback(callback: () => void) {
    this.authLogoutCallback = callback;
  }

  /**
   * Make an authenticated API request.
   * Automatically handles:
   * - Adding Bearer token from AsyncStorage
   * - 401 responses (triggers logout callback)
   * - Error responses with detail messages
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, requireAuth = true } = options;

    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add auth token if required
    if (requireAuth) {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Build request config
    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    // Make request
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    const response = await fetch(url, config);

    // Handle 401 - trigger logout
    if (response.status === 401) {
      // Clear stored auth data
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem('@shrota_auth_user');

      // Trigger logout callback if set
      if (this.authLogoutCallback) {
        this.authLogoutCallback();
      }

      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    // Handle error responses
    if (!response.ok) {
      let detail = 'An error occurred';
      try {
        const errorData = await response.json();
        detail = errorData.detail || detail;
      } catch {
        // Ignore JSON parse errors
      }
      throw new ApiError(response.status, detail);
    }

    // Handle empty responses
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse and return JSON
    return response.json();
  }

  /**
   * Convenience method for GET requests
   */
  async get<T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Convenience method for POST requests
   */
  async post<T>(endpoint: string, body?: object, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * Convenience method for PUT requests
   */
  async put<T>(endpoint: string, body?: object, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

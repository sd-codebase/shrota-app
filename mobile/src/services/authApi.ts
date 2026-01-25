import { API_URL } from '../config';
import {
  User,
  RegisterPayload,
  SendOTPPayload,
  VerifyOTPPayload,
  AuthTokenResponse,
  SendOTPResponse,
} from '../types';

const AUTH_BASE_URL = `${API_URL}/v1/auth`;

/**
 * Register a new user
 */
export async function registerUser(payload: RegisterPayload): Promise<User> {
  const response = await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

/**
 * Send OTP to user's email or WhatsApp
 */
export async function sendOTP(payload: SendOTPPayload): Promise<SendOTPResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send OTP');
  }

  return response.json();
}

/**
 * Verify OTP and get authentication token
 */
export async function verifyOTP(payload: VerifyOTPPayload): Promise<AuthTokenResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'OTP verification failed');
  }

  return response.json();
}

/**
 * Get current user info using token
 */
export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${AUTH_BASE_URL}/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get user info');
  }

  return response.json();
}

import { API_URL } from '../config';
import {
  User,
  RegisterPayload,
  SendOTPPayload,
  VerifyOTPPayload,
  AuthTokenResponse,
  SendOTPResponse,
  UpdateProfilePayload,
  WhatsAppStatusResponse,
  VerifyWhatsAppOTPPayload,
  SendChangeWhatsAppOTPPayload,
  VerifyChangeWhatsAppPayload,
} from '../types';

const AUTH_BASE_URL = `${API_URL}/v1/auth`;

async function parseErrorResponse(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const error = await response.json();
      return error.detail || error.message || `Request failed (${response.status})`;
    } catch {
      return `Request failed (${response.status})`;
    }
  }
  const text = await response.text();
  return text || `Request failed (${response.status})`;
}

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
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
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
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
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
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
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
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Deactivate the current user's account
 */
export async function deactivateAccount(token: string): Promise<void> {
  const response = await fetch(`${API_URL}/v1/users/me/deactivate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }
}

/**
 * Update the current user's profile
 */
export async function updateProfile(token: string, data: UpdateProfilePayload): Promise<User> {
  const response = await fetch(`${API_URL}/v1/users/me`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get WhatsApp verification status
 */
export async function getWhatsAppStatus(token: string): Promise<WhatsAppStatusResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/whatsapp-status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Verify WhatsApp OTP (legacy admin flow)
 */
export async function verifyWhatsAppOTP(token: string, payload: VerifyWhatsAppOTPPayload): Promise<User> {
  const response = await fetch(`${AUTH_BASE_URL}/verify-whatsapp-otp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Send OTP to a new WhatsApp number (for changing/verifying)
 */
export async function sendChangeWhatsAppOTP(token: string, payload: SendChangeWhatsAppOTPPayload): Promise<SendOTPResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/send-change-whatsapp-otp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Verify OTP and change WhatsApp number
 */
export async function verifyChangeWhatsApp(token: string, payload: VerifyChangeWhatsAppPayload): Promise<User> {
  const response = await fetch(`${AUTH_BASE_URL}/verify-change-whatsapp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

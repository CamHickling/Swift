// Strava OAuth and Upload Service

// You'll need to set these after creating a Strava API application
// at https://www.strava.com/settings/api
const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID || '';
const STRAVA_REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI || `${window.location.origin}/#/strava/callback`;
const TOKEN_EXCHANGE_URL = import.meta.env.VITE_TOKEN_EXCHANGE_URL || '';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_UPLOAD_URL = 'https://www.strava.com/api/v3/uploads';

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
  athleteName: string;
}

export interface StravaUploadResponse {
  id: number;
  status: string;
  activity_id?: number;
  error?: string;
}

/**
 * Initiate Strava OAuth flow
 */
export function initiateStravaAuth(): void {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: 'code',
    scope: 'activity:write,activity:read',
  });

  window.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens via serverless function
 */
export async function exchangeCodeForTokens(code: string): Promise<StravaTokens> {
  if (!TOKEN_EXCHANGE_URL) {
    throw new Error('Token exchange URL not configured. Set VITE_TOKEN_EXCHANGE_URL in .env');
  }

  const response = await fetch(TOKEN_EXCHANGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athleteId: data.athlete.id,
    athleteName: `${data.athlete.firstname} ${data.athlete.lastname}`,
  };
}

/**
 * Refresh expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<StravaTokens> {
  if (!TOKEN_EXCHANGE_URL) {
    throw new Error('Token exchange URL not configured');
  }

  const response = await fetch(TOKEN_EXCHANGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athleteId: data.athlete?.id ?? 0,
    athleteName: data.athlete ? `${data.athlete.firstname} ${data.athlete.lastname}` : '',
  };
}

/**
 * Upload TCX file to Strava
 */
export async function uploadToStrava(
  accessToken: string,
  tcxData: string,
  name: string,
  description?: string
): Promise<StravaUploadResponse> {
  const formData = new FormData();
  const blob = new Blob([tcxData], { type: 'application/xml' });
  formData.append('file', blob, `${name}.tcx`);
  formData.append('name', name);
  formData.append('data_type', 'tcx');
  formData.append('sport_type', 'VirtualRide');
  if (description) {
    formData.append('description', description);
  }

  const response = await fetch(STRAVA_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}

/**
 * Check upload status (uploads are processed asynchronously)
 */
export async function checkUploadStatus(
  accessToken: string,
  uploadId: number
): Promise<StravaUploadResponse> {
  const response = await fetch(`${STRAVA_UPLOAD_URL}/${uploadId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check upload status');
  }

  return response.json();
}

/**
 * Check if Strava is configured
 */
export function isStravaConfigured(): boolean {
  return Boolean(STRAVA_CLIENT_ID && TOKEN_EXCHANGE_URL);
}

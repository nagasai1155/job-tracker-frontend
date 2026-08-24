// Google OAuth Client ID from .env
export const GOOGLE_CLIENT_ID: string =
  (process.env.REACT_APP_GOOGLE_CLIENT_ID ?? '').trim() ||
  'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

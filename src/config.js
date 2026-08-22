// Google OAuth Client ID - Read from .env file
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim() || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

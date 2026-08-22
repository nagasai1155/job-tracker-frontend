import { state } from './state.js';
import { GOOGLE_CLIENT_ID } from './config.js';
import { render } from './main.js';
import { setAuthToken } from './api.js';

function decodeJwt(credential) {
  const payload = JSON.parse(atob(credential.split('.')[1]));
  return {
    name: payload.name,
    picture: payload.picture,
    email: payload.email,
  };
}

export function handleCredentialResponse(response) {
  if (response.mock) {
    state.user = { name: 'Mock User', picture: '', email: 'mock@example.com' };
    setAuthToken('mock-token');
    localStorage.setItem('authToken', 'mock-token');
    localStorage.setItem('authUser', JSON.stringify(state.user));
  } else {
    try {
      state.user = decodeJwt(response.credential);
    } catch {
      console.error('Failed to decode Google JWT token.');
      state.user = { name: 'Google User', picture: '', email: '' };
    }
    setAuthToken(response.credential);
    localStorage.setItem('authToken', response.credential);
    localStorage.setItem('authUser', JSON.stringify(state.user));
  }
  render();
}

// Restore session on page load, if a token was saved previously
export function restoreSession() {
  const token = localStorage.getItem('authToken');
  const userJson = localStorage.getItem('authUser');

  if (token && userJson) {
    try {
      state.user = JSON.parse(userJson);
      setAuthToken(token);
      return true;
    } catch {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
  }
  return false;
}

export function initGoogleAuth() {
  if (window.google) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
    });
    google.accounts.id.renderButton(
      document.getElementById('googleSignInBtn'),
      { theme: 'outline', size: 'large', type: 'standard' }
    );
  } else {
    document.getElementById('googleSignInBtn').innerHTML = `
      <button class="btn" id="mockLoginBtn">Login with Google (Mock)</button>
    `;
    document.getElementById('mockLoginBtn').addEventListener('click', () => {
      handleCredentialResponse({ mock: true });
    });
  }
}

export function logout() {
  state.user = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  render();
}
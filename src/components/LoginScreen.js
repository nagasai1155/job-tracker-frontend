import { initGoogleAuth } from '../auth.js';

/**
 * Renders the login screen with white + blue branding.
 */
export function renderLoginScreen(container) {
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-logo">
          <div class="login-logo-icon">💼</div>
          <h1>Job Tracker Pro</h1>
        </div>
        <p>Track your applications, land your dream job.</p>
        <div class="divider">Sign in to continue</div>
        <div id="googleSignInBtn"></div>
      </div>
    </div>
  `;

  initGoogleAuth();
}

import './style.css';
import { state } from './state.js';
import { renderLoginScreen } from './components/LoginScreen.js';
import { renderDashboard } from './components/Dashboard.js';
import { restoreSession } from './auth.js';

const app = document.querySelector('#app');

export function render() {
  if (state.user) {
    renderDashboard(app);
  } else {
    renderLoginScreen(app);
  }
}

// Try to restore a previous session before deciding what to render
restoreSession();
render();
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User, AuthContextValue } from '../types';
import { GOOGLE_CLIENT_ID } from '../config';
import { setAuthToken } from '../api';

// ─── Google Identity Services type (loaded via CDN script tag) ───────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme?: string; size?: string; type?: string }
          ) => void;
        };
      };
    };
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// ─── JWT Decoder ──────────────────────────────────────────────────────────────
function decodeJwt(credential: string): User {
  try {
    const payload = JSON.parse(atob(credential.split('.')[1]));
    return {
      name: payload.name ?? 'Google User',
      email: payload.email ?? '',
      picture: payload.picture,
    };
  } catch {
    return { name: 'Google User', email: '' };
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
interface AuthProviderProps { children: ReactNode; }

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  // Restore session on page load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userJson = localStorage.getItem('authUser');
    if (token && userJson) {
      try {
        setUser(JSON.parse(userJson) as User);
        setAuthToken(token);
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  const login = useCallback((credential: string) => {
    const loggedInUser = decodeJwt(credential);
    setAuthToken(credential);
    localStorage.setItem('authToken', credential);
    localStorage.setItem('authUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAuthToken('');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Google Auth Hook ─────────────────────────────────────────────────────────
export function useGoogleAuth(
  buttonRef: React.RefObject<HTMLDivElement | null>,
  onLogin: (credential: string) => void
) {
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => onLogin(res.credential),
        auto_select: false,
      });
      window.google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

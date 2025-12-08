import { createContext, useContext, useState, useEffect } from 'react';
import { getUser as getUserProfile } from '../services/user';
import { signOut } from '../services/supabaseAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('recover_token'));
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    async function load() {
      setLoading(true);
      const t = token;
      console.debug('[Auth] useEffect token:', t);
      if (!t) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      // Retry loop: try a few times before giving up (handles transient failures)
      const maxAttempts = 3;
      let attempt = 0;
      let lastError = null;
      for (; attempt < maxAttempts; attempt++) {
        try {
          const u = await getUserProfile(t);
          console.debug('[Auth] loaded user:', u, 'attempt:', attempt + 1);
          // If user is null, it means not authenticated (not an error)
          if (u === null) {
            setUser(null);
            setIsAdmin(false);
            break;
          }
          setUser(u);
          if (u && (u.email === 'admin@email.com' || u.role === 'admin')) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          console.debug('[Auth] load user attempt failed', attempt + 1, e);
          // backoff
          await new Promise(res => setTimeout(res, 200 * (attempt + 1)));
        }
      }
      if (lastError) {
        console.debug('[Auth] failed to load user after attempts', lastError);
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  // Accepts optional token and user to avoid race conditions when logging in
  const login = async (incomingToken = null, incomingUser = null) => {
    let t = incomingToken;
    if (!t) {
      t = localStorage.getItem('recover_token');
    } else {
      // if token provided explicitly, persist it
      try {
        localStorage.setItem('recover_token', t);
      } catch (e) {
        console.debug('[Auth] could not persist token to localStorage', e);
      }
    }
    console.debug('[Auth] login, new token:', t);
    setToken(t);
    if (incomingUser) {
      console.debug('[Auth] setting incoming user immediately');
      setUser(incomingUser);
      return;
    }

    // If we received a token but no user object, try to load profile from backend immediately
    if (t) {
      try {
        console.debug('[Auth] fetching profile with token immediately');
        const u = await getUserProfile(t);
        console.debug('[Auth] fetched profile on login:', u);
        setUser(u);
        if (u && (u.email === 'admin@email.com' || u.role === 'admin')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        console.debug('[Auth] immediate profile fetch failed', e);
        // leave user null; the effect watching `token` will still attempt to load
      }
    }
  };

  const logout = async () => {
    // Remove token locally first so UI updates immediately
    localStorage.removeItem('recover_token');
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    console.debug('[Auth] logout performed, token removed and user cleared');
    // Sign out from supabase in background (don't block UI)
    try {
      await signOut();
    } catch (e) {
      console.debug('[Auth] signOut failed', e);
    }
  };

  const reloadProfile = async () => {
    const t = localStorage.getItem('recover_token');
    if (!t) return;
    try {
      const u = await getUserProfile(t);
      console.debug('[Auth] reloaded profile:', u);
      setUser(u);
      if (u && (u.email === 'admin@email.com' || u.role === 'admin')) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      console.debug('[Auth] reload profile failed', e);
    }
  };

  const value = { user, isAdmin, login, logout, loading, reloadProfile };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth must be used within an AuthProvider');
    // Return a default context to prevent crashes
    return { 
      user: null, 
      isAdmin: false, 
      loading: true, 
      login: async () => {}, 
      logout: async () => {}, 
      reloadProfile: async () => {} 
    };
  }
  return context;
}

import React, { createContext, useState, useContext, useEffect } from 'react';

const PasscodeAuthContext = createContext(null);

const STORAGE_KEY = 'jc_apex_passcode_auth';

export const ROLE_PASSCODES = {
  demo: 'DEMO@55',
  pit: 'PEGATSA@55',
  driver: 'DGATSA@55',
  director: 'RDGATSA@55',
};

export const PASSCODE_ROLE_MAP = {
  'DEMO@55': {
    role: 'demo',
    userRole: 'demo',
    route: '/pit',
    isDemoMode: true,
    label: 'DEMO OPERATOR',
  },
  'PEGATSA@55': {
    role: 'pit',
    userRole: 'pit',
    route: '/pit',
    isDemoMode: false,
    label: 'PIT ENGINEER',
  },
  'DGATSA@55': {
    role: 'driver',
    userRole: 'driver',
    route: '/driver',
    isDemoMode: false,
    label: 'DRIVER',
  },
  'RDGATSA@55': {
    role: 'director',
    userRole: 'director',
    route: '/pit', // RDGATSA@55 routes to /pit with elevated director controls
    isDemoMode: false,
    label: 'RACE DIRECTOR',
  },
};

// Legacy fallback passcodes for backwards compatibility in test environments
export const VALID_PASSCODE = '2026';

export const ROLE_DASHBOARDS = {
  demo: '/pit',
  pit: '/pit',
  driver: '/driver',
  director: '/pit', // Race Director default dashboard is /pit with elevated controls
};

export const PasscodeAuthProvider = ({ children }) => {
  // Synchronous restoration on mount to prevent any auth redirect race condition
  const initial = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      const roleSaved = localStorage.getItem('jc_apex_user_role') || sessionStorage.getItem('jc_apex_user_role');
      const sessionIdSaved = localStorage.getItem('jc_apex_session_id') || sessionStorage.getItem('jc_apex_session_id');

      if (saved && saved.isAuthed) {
        const effectiveRole = saved.userRole || saved.role || roleSaved || 'pit';
        return {
          isAuthed: true,
          role: effectiveRole,
          userRole: effectiveRole,
          isDemoMode: Boolean(saved.isDemoMode),
          sessionId: saved.sessionId || sessionIdSaved || 'race-session-48v',
        };
      }
      if (roleSaved) {
        return {
          isAuthed: true,
          role: roleSaved,
          userRole: roleSaved,
          isDemoMode: roleSaved === 'demo',
          sessionId: sessionIdSaved || 'race-session-48v',
        };
      }
    } catch (err) {
      console.warn('[PasscodeAuth] Failed reading saved session:', err);
    }
    return {
      isAuthed: false,
      role: null,
      userRole: null,
      isDemoMode: false,
      sessionId: 'race-session-48v',
    };
  })();

  const [role, setRole] = useState(initial.role);
  const [userRole, setUserRole] = useState(initial.userRole);
  const [sessionId, setSessionId] = useState(initial.sessionId);
  const [isDemoMode, setIsDemoMode] = useState(initial.isDemoMode);
  const [isAuthed, setIsAuthed] = useState(initial.isAuthed);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      const roleSaved = localStorage.getItem('jc_apex_user_role') || sessionStorage.getItem('jc_apex_user_role');
      const sessionIdSaved = localStorage.getItem('jc_apex_session_id') || sessionStorage.getItem('jc_apex_session_id');

      if (saved && saved.isAuthed) {
        const effectiveRole = saved.userRole || saved.role || roleSaved || 'pit';
        setRole(effectiveRole);
        setUserRole(effectiveRole);
        setIsDemoMode(Boolean(saved.isDemoMode));
        setSessionId(saved.sessionId || sessionIdSaved || 'race-session-48v');
        setIsAuthed(true);
        console.log('[PasscodeAuth] Session restored from storage:', { effectiveRole, sessionId: saved.sessionId });
      }
    } catch {
      // ignore malformed storage
    }
    setLoading(false);
  }, []);

  /**
   * Universal Login supporting both:
   * login(passcode)
   * login(selectedRole, passcode)
   */
  const login = (roleOrPasscode, maybePasscode) => {
    let passcode = '';
    let selectedRole = null;

    if (maybePasscode !== undefined && maybePasscode !== null) {
      passcode = String(maybePasscode).trim();
      selectedRole = roleOrPasscode;
    } else {
      passcode = String(roleOrPasscode || '').trim();
    }

    // 1. Direct Passcode Map Check (Primary authentication)
    let match = PASSCODE_ROLE_MAP[passcode];

    // 2. Selected role fallback check
    if (!match && selectedRole && ROLE_PASSCODES[selectedRole] === passcode) {
      match = PASSCODE_ROLE_MAP[ROLE_PASSCODES[selectedRole]];
    }

    // 3. Fallback for legacy test passcodes
    if (!match && (passcode === VALID_PASSCODE || passcode === '2025')) {
      const fallbackRole = selectedRole || 'demo';
      match = {
        role: fallbackRole,
        userRole: fallbackRole,
        route: ROLE_DASHBOARDS[fallbackRole] || '/pit',
        isDemoMode: true,
        label: 'DEMO MODE',
      };
    }

    if (match) {
      const activeSessionId = sessionId || 'race-session-48v';
      setRole(match.role);
      setUserRole(match.userRole);
      setIsDemoMode(match.isDemoMode);
      setIsAuthed(true);

      const sessionPayload = {
        isAuthed: true,
        role: match.role,
        userRole: match.userRole,
        isDemoMode: match.isDemoMode,
        route: match.route,
        sessionId: activeSessionId,
        timestamp: Date.now(),
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionPayload));
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionPayload));
        localStorage.setItem('jc_apex_user_role', match.userRole);
        sessionStorage.setItem('jc_apex_user_role', match.userRole);
        localStorage.setItem('jc_apex_session_id', activeSessionId);
        sessionStorage.setItem('jc_apex_session_id', activeSessionId);
      } catch (err) {
        console.warn('[PasscodeAuth] Storage write warning:', err);
      }

      return {
        success: true,
        role: match.role,
        userRole: match.userRole,
        route: match.route,
        isDemoMode: match.isDemoMode,
        sessionId: activeSessionId,
      };
    }

    return { success: false, error: 'Invalid access passcode' };
  };

  const logout = () => {
    setRole(null);
    setUserRole(null);
    setIsDemoMode(false);
    setIsAuthed(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('jc_apex_user_role');
      sessionStorage.removeItem('jc_apex_user_role');
      localStorage.removeItem('jc_apex_session_id');
      sessionStorage.removeItem('jc_apex_session_id');
    } catch {}
  };

  return (
    <PasscodeAuthContext.Provider
      value={{
        role,
        userRole: userRole || role,
        sessionId,
        setSessionId,
        isDemoMode,
        setIsDemoMode,
        isAuthed,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </PasscodeAuthContext.Provider>
  );
};

export const usePasscodeAuth = () => {
  const ctx = useContext(PasscodeAuthContext);
  if (!ctx) {
    throw new Error('usePasscodeAuth must be used within PasscodeAuthProvider');
  }
  return ctx;
};
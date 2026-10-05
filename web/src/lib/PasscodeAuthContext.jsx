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
  const [role, setRole] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety fallback: Force disable loading screen after 1.5 seconds
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1500);

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.isAuthed) {
        const effectiveRole = saved.userRole || saved.role || 'pit';
        setRole(effectiveRole);
        setUserRole(effectiveRole);
        setIsDemoMode(Boolean(saved.isDemoMode));
        setIsAuthed(true);
      }
    } catch {
      // ignore malformed storage
    }

    if (isMounted) {
      setLoading(false);
      clearTimeout(timer);
    }

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
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
      setRole(match.role);
      setUserRole(match.userRole);
      setIsDemoMode(match.isDemoMode);
      setIsAuthed(true);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isAuthed: true,
        role: match.role,
        userRole: match.userRole,
        isDemoMode: match.isDemoMode,
        route: match.route,
      }));

      return {
        success: true,
        role: match.role,
        userRole: match.userRole,
        route: match.route,
        isDemoMode: match.isDemoMode,
      };
    }

    return { success: false, error: 'Invalid access passcode' };
  };

  const logout = () => {
    setRole(null);
    setUserRole(null);
    setIsDemoMode(false);
    setIsAuthed(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <PasscodeAuthContext.Provider
      value={{
        role,
        userRole: userRole || role,
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
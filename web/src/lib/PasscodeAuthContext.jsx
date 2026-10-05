import React, { createContext, useState, useContext, useEffect } from 'react';

const PasscodeAuthContext = createContext(null);

const STORAGE_KEY = 'jc_apex_passcode_auth';
export const VALID_PASSCODE = '2026';

export const ROLE_DASHBOARDS = {
  pit: '/pit',
  driver: '/driver',
  director: '/director',
};

export const PasscodeAuthProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety fallback: Force disable loading screen after 2 seconds
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2000);

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.isAuthed && saved.role && ROLE_DASHBOARDS[saved.role]) {
        setRole(saved.role);
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

  const login = (selectedRole, passcode) => {
    if (passcode === VALID_PASSCODE && ROLE_DASHBOARDS[selectedRole]) {
      setRole(selectedRole);
      setIsAuthed(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isAuthed: true, role: selectedRole }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setRole(null);
    setIsAuthed(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <PasscodeAuthContext.Provider
      value={{ role, isAuthed, loading, login, logout }}
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
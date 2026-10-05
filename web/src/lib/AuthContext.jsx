import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(true);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Safety fallback: Force disable loading screen after 2 seconds no matter what
    const timer = setTimeout(() => {
      if (isMounted) {
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
        setAuthChecked(true);
      }
    }, 2000);

    try {
      if (supabase?.auth?.getSession) {
        supabase.auth.getSession().then(({ data }) => {
          if (isMounted) {
            const session = data?.session;
            if (session?.user) {
              setUser(session.user);
              setIsAuthenticated(true);
            }
            setIsLoadingAuth(false);
            setIsLoadingPublicSettings(false);
            setAuthChecked(true);
            clearTimeout(timer);
          }
        }).catch((err) => {
          console.warn('Supabase auth session check failed, bypassing to demo mode:', err);
          if (isMounted) {
            setIsLoadingAuth(false);
            setIsLoadingPublicSettings(false);
            setAuthChecked(true);
          }
        });
      } else {
        if (isMounted) {
          setIsLoadingAuth(false);
          setIsLoadingPublicSettings(false);
          setAuthChecked(true);
          clearTimeout(timer);
        }
      }
    } catch (err) {
      console.warn('Auth check error, falling back:', err);
      if (isMounted) {
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
        setAuthChecked(true);
        clearTimeout(timer);
      }
    }

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const checkAppState = async () => {
    // Skip Base44 auth check
    return;
  };

  const checkUserAuth = async () => {
    // Skip Base44 auth check
    return;
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
import React, { createContext, useState, useContext, useEffect } from 'react';
// import { base44 } from '@/api/base44Client';
// import { appParams } from '@/lib/app-params';
// import axios from 'axios';

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
    // Skip Base44 auth check - using passcode auth instead
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setAuthChecked(true);
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
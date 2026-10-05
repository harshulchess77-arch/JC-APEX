import React from 'react';
import {
  PasscodeAuthProvider,
  usePasscodeAuth,
  PASSCODE_ROLE_MAP,
  ROLE_PASSCODES,
  ROLE_DASHBOARDS,
  VALID_PASSCODE
} from '@/lib/PasscodeAuthContext';

/**
 * Universal Role-Based Auth Context
 * Exposes userRole, isDemoMode, isAuthed, login, and logout.
 */
export {
  PasscodeAuthProvider as AuthProvider,
  usePasscodeAuth as useAuth,
  PasscodeAuthProvider,
  usePasscodeAuth,
  PASSCODE_ROLE_MAP,
  ROLE_PASSCODES,
  ROLE_DASHBOARDS,
  VALID_PASSCODE
};

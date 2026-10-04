import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Legacy redirect — CommandCenter is now PitCenter
export default function CommandCenter() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/pit', { replace: true }); }, []);
  return null;
}
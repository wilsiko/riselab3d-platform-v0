import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const from = `${location.pathname}${location.search}${location.hash}`;
    navigate('/login', { state: { from } });
  }, [location.hash, location.pathname, location.search, navigate]);
}

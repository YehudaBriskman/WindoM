import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/** Signs out, exposing `signingOut` while the logout request is in flight. */
export function useSignOut() {
  const { logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
  }

  return { signingOut, signOut };
}

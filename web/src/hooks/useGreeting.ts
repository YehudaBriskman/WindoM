import { useState, useEffect } from 'react';
import { getGreeting } from '../utils/time';

export function useGreeting() {
  const [greeting, setGreeting] = useState(getGreeting);

  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  return greeting;
}

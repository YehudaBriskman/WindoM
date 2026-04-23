import { useState, useEffect } from 'react';
import { getGreeting } from '../utils/time';
import { GREETING_UPDATE_INTERVAL_MS } from '../lib/timing-constants';

export function useGreeting() {
  const [greeting, setGreeting] = useState(getGreeting);

  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), GREETING_UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return greeting;
}

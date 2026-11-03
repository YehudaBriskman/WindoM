import { useRef, useState } from 'react';
import { disconnectIntegration, runOAuthFlow, type OAuthProvider } from '../lib/oauth-connection';

export interface OAuthConnectionConfig<A> {
  provider: OAuthProvider<A>;
  /** Runs after the backend reports the account linked (settings, local storage). */
  onConnected: (args: A) => Promise<unknown> | void;
  /** Runs after the backend unlinked the account. */
  onDisconnected: () => Promise<unknown> | void;
  /** Turns a connect failure into the text shown under the card. */
  mapConnectError: (err: unknown) => string;
  /** Shown when the DELETE /integrations/<id> call is not 2xx. */
  disconnectFailedMessage: string;
}

export interface OAuthConnection<A> {
  busy: boolean;
  error: string;
  setError: (error: string) => void;
  connect: (args: A) => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Busy/error state around connecting and disconnecting one OAuth integration.
 * A second connect or disconnect while one is in flight is ignored.
 */
export function useOAuthConnection<A = void>(config: OAuthConnectionConfig<A>): OAuthConnection<A> {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // A ref, not `busy`: two clicks in one frame both see busy === false.
  const inFlight = useRef(false);

  async function run(work: () => Promise<void>, mapError: (err: unknown) => string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (err) {
      setError(mapError(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const connect = (args: A) =>
    run(async () => {
      await runOAuthFlow(config.provider, args);
      await config.onConnected(args);
    }, config.mapConnectError);

  const disconnect = () =>
    run(
      async () => {
        await disconnectIntegration(config.provider.id, config.disconnectFailedMessage);
        await config.onDisconnected();
      },
      (err) => (err instanceof Error ? err.message : 'Disconnect failed'),
    );

  return { busy, error, setError, connect, disconnect };
}

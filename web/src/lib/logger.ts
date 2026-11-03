/**
 * The extension's one logger.
 *
 * `debug` and `info` are diagnostic trace (auth handshakes, refresh polling,
 * init steps). They print only when DEBUG is on, so a shipped build stays
 * quiet in the user's new-tab console.
 *
 * `warn` and `error` always print. They are reserved for things a user or a
 * bug report needs to see: a failed refresh, a backend sync that fell back to
 * local, an unexpected exception.
 *
 * DEBUG is on in `vite dev` and in tests, and can be forced in any build with
 * `VITE_DEBUG=true`.
 */

export const DEBUG: boolean = import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/** A logger whose lines are prefixed with `[scope]`, e.g. `[auth:refresh]`. */
export function createLogger(scope: string, debugEnabled: boolean = DEBUG): Logger {
  const prefix = `[${scope}]`;
  return {
    debug: (...args) => {
      if (debugEnabled) console.debug(prefix, ...args);
    },
    info: (...args) => {
      if (debugEnabled) console.info(prefix, ...args);
    },
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
  };
}

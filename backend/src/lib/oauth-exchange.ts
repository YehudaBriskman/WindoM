import type { FastifyReply } from 'fastify';

interface ExchangeFailure {
  ok: false;
  error: string;
}

const STATUS_MAP: Record<string, number> = {
  USERINFO_FAILED: 500,
};

const MESSAGE_MAP: Record<string, string> = {
  TOKEN_EXCHANGE_FAILED: 'Failed to link account. Please try again.',
  USERINFO_FAILED: 'Could not retrieve your profile. Please try again.',
};

/**
 * Sends a standardised error response for a failed OAuth token exchange and
 * returns `true` so the caller can `return` immediately after calling this.
 */
export function replyOAuthExchangeError(
  reply: FastifyReply,
  result: ExchangeFailure,
  providerMessages?: Record<string, string>,
): true {
  const status = STATUS_MAP[result.error] ?? 400;
  const messages = { ...MESSAGE_MAP, ...providerMessages };
  void reply.status(status).send({
    error: result.error,
    message: messages[result.error] ?? result.error,
  });
  return true;
}

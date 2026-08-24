/**
 * Returns an abort signal's reason, creating an AbortError when no reason
 * was supplied.
 */
export function abortReason(signal?: AbortSignal): unknown {
  const { reason } = signal || {};

  if (
    reason === undefined ||
    (reason instanceof DOMException && reason.name === 'AbortError')
  ) {
    const error = new Error('The operation was aborted.');
    error.name = 'AbortError';

    return error;
  }

  return reason;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes

const codes = new Map();

export default {
  /// Store a session under a caller-provided key (the nonce from the native app).
  store(key, session) {
    codes.set(key, {
      session,
      expiresAt: Date.now() + TTL_MS,
    });
  },

  /// Consume a stored session. Returns the session data or null.
  /// Single-use: the entry is deleted on successful exchange.
  exchange(code) {
    const entry = codes.get(code);
    if (!entry) {
      return null;
    }
    codes.delete(code);
    if (Date.now() > entry.expiresAt) {
      return null;
    }
    return entry.session;
  },
};

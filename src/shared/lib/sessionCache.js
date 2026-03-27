const isBrowser = typeof window !== "undefined";

export const readSessionCacheWithMeta = (key, ttlMs) => {
  if (!isBrowser || !key) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    const savedAt = Number(parsed?.savedAt) || 0;
    const isExpired = !savedAt || Date.now() - savedAt > ttlMs;

    return {
      payload: parsed?.payload ?? null,
      savedAt,
      isExpired,
    };
  } catch {
    return null;
  }
};

export const readSessionCache = (key, ttlMs) => {
  const cacheEntry = readSessionCacheWithMeta(key, ttlMs);
  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.isExpired) {
    if (isBrowser) {
      window.sessionStorage.removeItem(key);
    }
    return null;
  }

  return cacheEntry.payload;
};

export const writeSessionCache = (key, payload) => {
  if (!isBrowser || !key) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        payload,
      }),
    );
  } catch {
    // Ignoramos errores de storage para no afectar UX.
  }
};

export const clearSessionCache = (key) => {
  if (!isBrowser || !key) {
    return;
  }

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // No-op
  }
};

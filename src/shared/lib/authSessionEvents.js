const noop = () => undefined;

const AUTH_SESSION_CHANNEL_NAME = "cielp-auth-session-events";
const AUTH_SESSION_STORAGE_KEY = "cielp_auth_session_event";
const TAB_ID =
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

let channel;

const handlers = {
  onSessionExpired: noop,
  onTokenRefreshed: noop,
};

const getBroadcastChannel = () => {
  if (
    typeof window === "undefined" ||
    typeof BroadcastChannel === "undefined"
  ) {
    return null;
  }

  if (!channel) {
    channel = new BroadcastChannel(AUTH_SESSION_CHANNEL_NAME);
  }

  return channel;
};

const emitStorageEvent = (eventPayload) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify(eventPayload),
    );
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Ignoramos errores de storage para no romper el flujo de autenticacion.
  }
};

const publishAuthEvent = (type, payload = {}) => {
  const eventPayload = {
    type,
    source: TAB_ID,
    at: Date.now(),
    ...payload,
  };

  const authChannel = getBroadcastChannel();

  if (authChannel) {
    try {
      authChannel.postMessage(eventPayload);
    } catch {
      emitStorageEvent(eventPayload);
    }

    return;
  }

  emitStorageEvent(eventPayload);
};

const processIncomingEvent = (eventPayload) => {
  if (!eventPayload || eventPayload.source === TAB_ID) {
    return;
  }

  if (eventPayload.type === "session-expired") {
    handlers.onSessionExpired();
    return;
  }

  if (eventPayload.type === "token-refreshed") {
    handlers.onTokenRefreshed(eventPayload.token || null);
  }
};

export const setAuthSessionHandlers = ({
  onSessionExpired,
  onTokenRefreshed,
}) => {
  handlers.onSessionExpired = onSessionExpired || noop;
  handlers.onTokenRefreshed = onTokenRefreshed || noop;
};

export const notifySessionExpired = ({ broadcast = true } = {}) => {
  handlers.onSessionExpired();

  if (broadcast) {
    publishAuthEvent("session-expired");
  }
};

export const notifyTokenRefreshed = (token) => {
  handlers.onTokenRefreshed(token);
  publishAuthEvent("token-refreshed", { token });
};

export const subscribeAuthSessionEvents = () => {
  if (typeof window === "undefined") {
    return noop;
  }

  const authChannel = getBroadcastChannel();

  const handleBroadcastMessage = (event) => {
    processIncomingEvent(event?.data);
  };

  const handleStorageMessage = (event) => {
    if (event.key !== AUTH_SESSION_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      processIncomingEvent(JSON.parse(event.newValue));
    } catch {
      // Ignoramos payloads invalidos.
    }
  };

  if (authChannel) {
    authChannel.addEventListener("message", handleBroadcastMessage);
  }

  window.addEventListener("storage", handleStorageMessage);

  return () => {
    if (authChannel) {
      authChannel.removeEventListener("message", handleBroadcastMessage);
    }

    window.removeEventListener("storage", handleStorageMessage);
  };
};

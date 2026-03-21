const noop = () => undefined;

const handlers = {
  onSessionExpired: noop,
  onTokenRefreshed: noop,
};

export const setAuthSessionHandlers = ({
  onSessionExpired,
  onTokenRefreshed,
}) => {
  handlers.onSessionExpired = onSessionExpired || noop;
  handlers.onTokenRefreshed = onTokenRefreshed || noop;
};

export const notifySessionExpired = () => {
  handlers.onSessionExpired();
};

export const notifyTokenRefreshed = (token) => {
  handlers.onTokenRefreshed(token);
};

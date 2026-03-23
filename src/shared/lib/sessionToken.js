const SESSION_TOKEN_KEY = "cielp_access_token";
const SESSION_AUTH_STATUS_KEY = "cielp_is_authenticated";

const readStoredAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.sessionStorage.getItem(SESSION_TOKEN_KEY);
    return storedValue || null;
  } catch {
    return null;
  }
};

let accessToken = readStoredAccessToken();

const readStoredAuthStatus = () => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(SESSION_AUTH_STATUS_KEY) === "true";
  } catch {
    return false;
  }
};

let isAuthenticated = readStoredAuthStatus();

export const getAccessToken = () => accessToken;

export const getStoredAuthStatus = () => isAuthenticated;

export const setStoredAuthStatus = (value) => {
  isAuthenticated = Boolean(value);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      SESSION_AUTH_STATUS_KEY,
      isAuthenticated ? "true" : "false",
    );
  } catch {
    // Ignoramos errores de storage para no romper el flujo de autenticacion.
  }
};

export const setAccessToken = (token) => {
  accessToken = token || null;

  if (typeof window === "undefined") {
    return;
  }

  try {
    if (accessToken) {
      window.sessionStorage.setItem(SESSION_TOKEN_KEY, accessToken);
      return;
    }

    window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // Ignoramos errores de storage para no romper el flujo de autenticacion.
  }
};

export const clearAccessToken = () => {
  accessToken = null;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // Ignoramos errores de storage para no romper el flujo de autenticacion.
  }
};

export const clearStoredAuthStatus = () => {
  isAuthenticated = false;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(SESSION_AUTH_STATUS_KEY);
  } catch {
    // Ignoramos errores de storage para no romper el flujo de autenticacion.
  }
};

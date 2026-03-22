const SESSION_TOKEN_KEY = "cielp_access_token";

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

export const getAccessToken = () => accessToken;

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

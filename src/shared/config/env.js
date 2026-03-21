const DEFAULT_API_URL = "http://localhost:3001/api/cielp/v1";

const removeTrailingSlash = (value) => value.replace(/\/+$/, "");

const envApiUrl = import.meta.env.VITE_API_URL;

if (import.meta.env.PROD && !envApiUrl) {
  throw new Error(
    "Falta VITE_API_URL en produccion. Configura la URL del backend para continuar.",
  );
}

export const API_BASE_URL = removeTrailingSlash(envApiUrl || DEFAULT_API_URL);

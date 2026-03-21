export const decodeVerificationPayload = (payload) => {
  if (!payload) {
    return null;
  }

  try {
    const normalized = decodeURIComponent(payload)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);

    return JSON.parse(json);
  } catch {
    return null;
  }
};

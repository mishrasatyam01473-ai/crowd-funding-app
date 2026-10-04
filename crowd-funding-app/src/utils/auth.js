// Session-based authentication helper
// User credentials are stored in sessionStorage so each new browser visit requires re-authentication.

const AUTH_KEY = "user";

export function getAuthUser() {
  try {
    // Purge any legacy credentials from localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(AUTH_KEY);
    }

    if (typeof window === "undefined" || !window.sessionStorage) {
      return null;
    }

    const raw = window.sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && (parsed.id || parsed.mailid) ? parsed : null;
  } catch (err) {
    console.error("Failed to read session user:", err);
    return null;
  }
}

export function setAuthUser(user) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage?.removeItem(AUTH_KEY);

      if (window.sessionStorage) {
        if (user) {
          window.sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
        } else {
          window.sessionStorage.removeItem(AUTH_KEY);
        }
      }
      window.dispatchEvent(new Event("authChange"));
    }
  } catch (err) {
    console.error("Failed to set session user:", err);
  }
}

export function clearAuthUser() {
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage?.removeItem(AUTH_KEY);
      window.localStorage?.removeItem(AUTH_KEY);
      window.dispatchEvent(new Event("authChange"));
    }
  } catch (err) {
    console.error("Failed to clear auth user:", err);
  }
}

// Initial cleanup of localStorage on module load
if (typeof window !== "undefined" && window.localStorage) {
  try {
    window.localStorage.removeItem(AUTH_KEY);
  } catch {
    // Ignore cleanup errors
  }
}

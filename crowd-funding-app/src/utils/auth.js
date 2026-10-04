// ========================================================================
// AUTHENTICATION UTILITY
// User credentials are NOT persisted in localStorage across visits.
// Each time a user opens/visits the website, they must enter their userid & password.
// ========================================================================

const AUTH_KEY = "user";

/**
 * Retrieve the current session user.
 * Ensures localStorage is purged and never used to bypass login.
 */
export function getAuthUser() {
  try {
    // Explicitly purge any legacy or stored credentials from localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(AUTH_KEY);
    }

    if (typeof window === "undefined" || !window.sessionStorage) {
      return null;
    }

    const raw = window.sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && (parsed.id || parsed.mailid)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error("Failed to read session user:", err);
    return null;
  }
}

/**
 * Save user into active sessionStorage ONLY (never in localStorage).
 */
export function setAuthUser(user) {
  try {
    if (typeof window !== "undefined") {
      // Ensure localStorage has no auth data
      window.localStorage.removeItem(AUTH_KEY);

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

/**
 * Clear user from all storages on logout.
 */
export function clearAuthUser() {
  try {
    if (typeof window !== "undefined") {
      if (window.sessionStorage) {
        window.sessionStorage.removeItem(AUTH_KEY);
      }
      if (window.localStorage) {
        window.localStorage.removeItem(AUTH_KEY);
      }
      window.dispatchEvent(new Event("authChange"));
    }
  } catch (err) {
    console.error("Failed to clear auth user:", err);
  }
}

// Immediately purge any stale user entry in localStorage when this module loads
if (typeof window !== "undefined" && window.localStorage) {
  try {
    window.localStorage.removeItem(AUTH_KEY);
  } catch {
    // Ignore errors during initial purge
  }
}

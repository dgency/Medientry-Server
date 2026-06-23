const STORAGE_KEY = 'medientry-admin-token';

let currentToken: string | null = null;

const getPersistedToken = () => window.localStorage.getItem(STORAGE_KEY);
const getSessionToken = () => window.sessionStorage.getItem(STORAGE_KEY);

export const authStorage = {
  getToken() {
    return currentToken;
  },
  setToken(token: string, rememberMe = false) {
    currentToken = token;
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);

    if (rememberMe) {
      window.localStorage.setItem(STORAGE_KEY, token);
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, token);
  },
  restoreToken() {
    currentToken = getPersistedToken() ?? getSessionToken();
    return currentToken;
  },
  clearToken() {
    currentToken = null;
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
  },
};

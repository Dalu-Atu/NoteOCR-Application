// services/api.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@noteocr_auth_token";

type Listener = () => void;

let listener: Listener | null = null;

export async function getAuthToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export function onForceLogout(callback: Listener) {
  listener = callback;
}

export function triggerForceLogout() {
  if (listener) {
    listener();
  }
}

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Endpoints where a 401 means "you failed a password re-check for this
// specific action" (wrong current password), not "your session token is
// invalid." These should surface as an inline form error, never a global
// logout. Match by path suffix so it's resilient to baseURL differences.
const REAUTH_CHECK_PATHS = [
  "/users/update-password",
  "/users/update-name",
  "/users/update-email",
];

function isReauthCheck(url?: string) {
  if (!url) return false;
  return REAUTH_CHECK_PATHS.some((path) => url.includes(path));
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isReauthCheck(error.config?.url)) {
      triggerForceLogout();
    }
    return Promise.reject(error);
  },
);

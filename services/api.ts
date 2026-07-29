// services/api.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@noteocr_auth_token";

type Listener = () => void;

let listener: Listener | null = null;

// add near the top, after TOKEN_KEY is defined
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

// Attach the token automatically to every outgoing request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      triggerForceLogout();
    }
    return Promise.reject(error);
  },
);

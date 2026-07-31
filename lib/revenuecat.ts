// lib/revenuecat.ts
import Purchases from "react-native-purchases";
import { Platform } from "react-native";

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
  android: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
});

export async function initRevenueCat(userId?: string) {
  if (!API_KEY) return console.warn("RevenueCat API key not set");
  await Purchases.configure({ apiKey: API_KEY, appUserID: userId ?? null });
}

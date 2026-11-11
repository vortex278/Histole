import { Platform } from "react-native";

const normalizeApiUrl = (url: string) => url.replace(/\/$/, "");

export const API_BASE_URL = normalizeApiUrl(
  Platform.select({
    web: process.env.EXPO_PUBLIC_WEB_API_URL ?? "http://localhost:8000/api",
    android:
      process.env.EXPO_PUBLIC_ANDROID_API_URL ??
      process.env.EXPO_PUBLIC_API_URL ??
      "http://10.0.2.2:8000/api",
    default: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api",
  }) ?? "http://localhost:8000/api",
);

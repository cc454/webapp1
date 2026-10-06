import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { AppSettings, EventDetails, Workout } from "./types";

const KEY = "stride-ai-state";
export async function loadState(): Promise<{ workouts?: Workout[]; settings?: AppSettings; event?: EventDetails }> {
  const value = await AsyncStorage.getItem(KEY);
  return value ? JSON.parse(value) : {};
}
export async function saveState(state: { workouts: Workout[]; settings: AppSettings; event: EventDetails }) {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}
export const saveApiKey = (key: string) => SecureStore.setItemAsync("llm-api-key", key);
export const getApiKey = () => SecureStore.getItemAsync("llm-api-key");
export const saveGarminPassword = (password: string) => SecureStore.setItemAsync("garmin-password", password);
export const getGarminPassword = () => SecureStore.getItemAsync("garmin-password");
export const saveGarminSession = (session: string) => SecureStore.setItemAsync("garmin-session", session);
export const getGarminSession = () => SecureStore.getItemAsync("garmin-session");
export const clearGarminSession = () => SecureStore.deleteItemAsync("garmin-session");

jest.mock("@react-native-async-storage/async-storage", () => ({ __esModule: true, default: { getItem: jest.fn(), setItem: jest.fn() } }));
jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { clearGarminSession, getApiKey, getGarminPassword, getGarminSession, loadState, saveApiKey, saveGarminPassword, saveGarminSession, saveState } from "../src/storage";

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("storage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads empty or serialized application state", async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(null).mockResolvedValueOnce('{"workouts":[]}');
    await expect(loadState()).resolves.toEqual({});
    await expect(loadState()).resolves.toEqual({ workouts: [] });
  });

  it("serializes application state", async () => {
    const state = { workouts: [], settings: { provider: "gemini" as const, research: "r", constraints: "c", garminEmail: "e" }, event: { name: "n", date: "d", distance: "x", targetTime: "t", elevation: "e", pace: "p" } };
    await saveState(state);
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("stride-ai-state", JSON.stringify(state));
  });

  it("uses secure store for all secrets", async () => {
    await saveApiKey("api"); await saveGarminPassword("password"); await saveGarminSession("session");
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("llm-api-key", "api");
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("garmin-password", "password");
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("garmin-session", "session");
    mockSecureStore.getItemAsync.mockResolvedValue("value");
    await expect(getApiKey()).resolves.toBe("value");
    await expect(getGarminPassword()).resolves.toBe("value");
    await expect(getGarminSession()).resolves.toBe("value");
    await clearGarminSession();
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith("garmin-session");
  });
});

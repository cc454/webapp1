jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({ readAsStringAsync: jest.fn(), EncodingType: { UTF8: "utf8" } }));
jest.mock("expo-asset", () => ({ Asset: { fromModule: jest.fn() } }));

import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { loadBundledMarkdown, pickMarkdownFile } from "../src/markdown";

const mockPicker = DocumentPicker as jest.Mocked<typeof DocumentPicker>;
const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
const mockAsset = Asset as jest.Mocked<typeof Asset>;

describe("Markdown files", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null when a picker is cancelled", async () => {
    mockPicker.getDocumentAsync.mockResolvedValue({ canceled: true } as any);
    await expect(pickMarkdownFile()).resolves.toBeNull();
  });

  it("reads Markdown and plain-text files", async () => {
    mockPicker.getDocumentAsync.mockResolvedValue({ canceled: false, assets: [{ name: "goal.md", uri: "file://goal", mimeType: "text/markdown" }] });
    mockFileSystem.readAsStringAsync.mockResolvedValue("content");
    await expect(pickMarkdownFile()).resolves.toBe("content");
    expect(mockFileSystem.readAsStringAsync).toHaveBeenCalledWith("file://goal", { encoding: "utf8" });
  });

  it("rejects unsupported files", async () => {
    mockPicker.getDocumentAsync.mockResolvedValue({ canceled: false, assets: [{ name: "goal.pdf", uri: "file://goal", mimeType: "application/pdf" }] });
    await expect(pickMarkdownFile()).rejects.toThrow("Choose a Markdown");
  });

  it("downloads and reads bundled Markdown", async () => {
    const bundled = { downloadAsync: jest.fn(), localUri: "file://bundle" };
    mockAsset.fromModule.mockReturnValue(bundled as any);
    mockFileSystem.readAsStringAsync.mockResolvedValue("bundled text");
    await expect(loadBundledMarkdown("goal")).resolves.toBe("bundled text");
    expect(bundled.downloadAsync).toHaveBeenCalled();
  });
});

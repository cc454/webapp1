import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";

const bundled = {
  goal: require("../assets/training/goal.md"),
  research: require("../assets/training/research.md"),
  constraints: require("../assets/training/constraints.md"),
};

export async function pickMarkdownFile() {
  const result = await DocumentPicker.getDocumentAsync({ type: ["text/markdown", "text/plain"], copyToCacheDirectory: true, multiple: false });
  if (result.canceled || !result.assets?.[0]) return null;
  const file = result.assets[0];
  if (!file.name.toLowerCase().endsWith(".md") && file.mimeType !== "text/markdown" && file.mimeType !== "text/plain") throw new Error("Choose a Markdown (.md) or plain-text file.");
  return FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
}

export async function loadBundledMarkdown(kind: keyof typeof bundled) {
  const asset = Asset.fromModule(bundled[kind]);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error("The bundled Markdown file could not be read.");
  return FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.UTF8 });
}

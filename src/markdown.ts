import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
const bundled = { goal: require('../training/goal.md'), research: require('../training/research.md'), constraints: require('../training/constraints.md') };
export async function pickTextFile(kind: 'guidance' | 'backup' = 'guidance') {
  const result = await DocumentPicker.getDocumentAsync({ type: kind === 'backup' ? ['application/json', 'text/plain', '*/*'] : ['text/markdown', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const file = result.assets[0];
  if (!file) return null;
  if (file.size && file.size > 10 * 1024 * 1024) throw new Error('Choose a file smaller than 10 MB.');
  if (!(kind === 'backup' ? /\.(json)$/i : /\.(md|txt)$/i).test(file.name)) throw new Error(kind === 'backup' ? 'Choose a JSON backup.' : 'Choose a Markdown (.md) or plain-text (.txt) file.');
  return FileSystem.readAsStringAsync(file.uri);
}
export const pickMarkdownFile = () => pickTextFile();
export async function loadBundledMarkdown(kind: keyof typeof bundled) {
  const asset = Asset.fromModule(bundled[kind]);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('The bundled file could not be loaded.');
  return FileSystem.readAsStringAsync(asset.localUri);
}

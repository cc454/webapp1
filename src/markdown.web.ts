import { Asset } from 'expo-asset';
const bundled = { goal: require('../training/goal.md'), research: require('../training/research.md'), constraints: require('../training/constraints.md') };
export async function pickTextFile(kind: 'guidance' | 'backup' = 'guidance'): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = kind === 'backup' ? '.json' : '.md,.txt';
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      if (file.size > 10 * 1024 * 1024) return reject(new Error('Choose a file smaller than 10 MB.'));
      try { resolve(await file.text()); } catch { reject(new Error('Could not read the file.')); }
    };
    input.click();
  });
}
export const pickMarkdownFile = () => pickTextFile();
export async function loadBundledMarkdown(kind: keyof typeof bundled) {
  const response = await fetch(Asset.fromModule(bundled[kind]).uri);
  if (!response.ok) throw new Error('The bundled file could not be loaded.');
  return response.text();
}

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system/legacy', () => ({ readAsStringAsync: jest.fn() }));
jest.mock('expo-asset', () => ({ Asset: { fromModule: jest.fn() } }));
import * as Picker from 'expo-document-picker';
import * as FS from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { loadBundledMarkdown, pickTextFile } from '../src/markdown';
describe('AT-17–18: file loading', () => {
  it('preserves cancelled imports', async () => { (Picker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: true }); await expect(pickTextFile()).resolves.toBeNull(); expect(FS.readAsStringAsync).not.toHaveBeenCalled(); });
  it('reads text and rejects unsupported/oversized files', async () => {
    (Picker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ name: 'goal.txt', uri: 'file://goal' }] }); (FS.readAsStringAsync as jest.Mock).mockResolvedValue('content');
    await expect(pickTextFile()).resolves.toBe('content');
    (Picker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ name: 'file.pdf' }] }); await expect(pickTextFile()).rejects.toThrow('Markdown');
    (Picker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ name: 'file.md', size: 20000000 }] }); await expect(pickTextFile()).rejects.toThrow('10 MB');
  });
  it('loads every bundled guidance kind and reports missing assets', async () => {
    (Asset.fromModule as jest.Mock).mockReturnValue({ downloadAsync: jest.fn(), localUri: 'file://bundle' }); (FS.readAsStringAsync as jest.Mock).mockResolvedValue('bundled');
    for (const kind of ['goal', 'research', 'constraints'] as const) await expect(loadBundledMarkdown(kind)).resolves.toBe('bundled');
    (Asset.fromModule as jest.Mock).mockReturnValue({ downloadAsync: jest.fn() }); await expect(loadBundledMarkdown('goal')).rejects.toThrow('loaded');
  });
});

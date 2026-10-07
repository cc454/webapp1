export async function withGenerationBackground<T>(task: () => Promise<T>, _onCancel?: () => void): Promise<T> { return task(); }
export function generationProgress(_text: string) { }
export function subscribeGeneration(_listener: (progress: string) => void) { return () => {}; }
export function cancelBackgroundGeneration() { }

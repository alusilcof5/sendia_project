const appPrefixes = ['sendia-', 'miradas-'];

export function clearSendiaLocalData(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => key !== null);
      for (const key of keys) if (appPrefixes.some((prefix) => key.startsWith(prefix))) storage.removeItem(key);
    }
  } catch { throw new Error('El navegador no permitió borrar los datos locales.'); }
}

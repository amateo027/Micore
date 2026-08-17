import { useState, useEffect } from 'preact/hooks';
import { unlockVault, lockVault, checkVaultStatus, touchActivity } from './api/vault';
import { Sidebar, ModuleRoute } from './components/Sidebar';
import { ContactsModule } from './modules/contacts/ContactsModule';

export function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [currentRoute, setCurrentRoute] = useState<ModuleRoute>('contacts');
  const [passphrase, setPassphrase] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const handleUserActivity = () => {
      if (isUnlocked) touchActivity().catch(() => {});
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    const interval = setInterval(async () => {
      try {
        const unlocked = await checkVaultStatus();
        setIsUnlocked(unlocked);
      } catch {
        setIsUnlocked(false);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      clearInterval(interval);
    };
  }, [isUnlocked]);

  const handleUnlock = async (e: Event) => {
    e.preventDefault();
    if (!passphrase) return;

    setLoading(true);
    setError('');

    try {
      await unlockVault(passphrase);
      setIsUnlocked(true);
      setPassphrase('');
    } catch {
      setError('Invalid passphrase or vault key failure');
    } fontinally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    await lockVault();
    setIsUnlocked(false);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 text-zinc-200 select-none overflow-hidden">
      <header className="drag-region flex h-9 w-full items-center justify-between border-b border-zinc-800/60 bg-zinc-900/50 px-3 text-xs text-zinc-400">
        <span className="font-mono font-medium tracking-wide text-zinc-300">MICORE</span>
        <div className="no-drag flex items-center gap-2">
          <span className={h-2 w-2 rounded-full }></span>
          <span className="text-[10px] text-zinc-500">{isUnlocked ? 'UNLOCKED' : 'LOCKED'}</span>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {!isUnlocked ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <form onSubmit={handleUnlock} className="w-full max-w-sm rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-2xl backdrop-blur-sm">
              <h2 className="text-lg font-bold text-zinc-100 mb-1">Unlock Vault</h2>
              <p className="text-xs text-zinc-400 mb-4">Enter master passphrase to derive decryption key.</p>

              {error && (
                <div className="mb-3 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2 text-xs text-rose-400">
                  {error}
                </div>
              )}

              <input
                type="password"
                value={passphrase}
                onInput={(e) => setPassphrase((e.target as HTMLInputElement).value)}
                placeholder="Master Passphrase"
                className="w-full rounded-lg border border-zinc-700/60 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none mb-4"
                autoFocus
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all"
              >
                {loading ? 'Deriving Argon2id Key...' : 'Unlock Session'}
              </button>
            </form>
          </div>
        ) : (
          <>
            <Sidebar
              currentRoute={currentRoute}
              onRouteChange={(route) => setCurrentRoute(route)}
              onLock={handleLock}
            />

            <section className="flex-1 overflow-hidden">
              {currentRoute === 'contacts' && <ContactsModule />}
              {currentRoute === 'bookmarks' && (
                <div className="p-6 text-xs text-zinc-500">Bookmark Manager Module (Pending)</div>
              )}
              {currentRoute === 'snippets' && (
                <div className="p-6 text-xs text-zinc-500">Code Snippets & Vault Module (Pending)</div>
              )}
              {currentRoute === 'knowledge' && (
                <div className="p-6 text-xs text-zinc-500">Knowledge Base Module (Pending)</div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

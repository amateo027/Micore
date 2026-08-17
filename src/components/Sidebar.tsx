export type ModuleRoute = 'contacts' | 'bookmarks' | 'snippets' | 'knowledge';

interface SidebarProps {
  currentRoute: ModuleRoute;
  onRouteChange: (route: ModuleRoute) => void;
  onLock: () => void;
}

export function Sidebar({ currentRoute, onRouteChange, onLock }: SidebarProps) {
  const navItems: { id: ModuleRoute; label: string }[] = [
    { id: 'contacts', label: 'Contacts & Profiles' },
    { id: 'bookmarks', label: 'Bookmark Manager' },
    { id: 'snippets', label: 'Code & Vault' },
    { id: 'knowledge', label: 'Knowledge Base' },
  ];

  return (
    <aside className="w-56 border-r border-zinc-800/60 bg-zinc-900/30 flex flex-col justify-between p-3">
      <div>
        <div className="mb-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2">
          Modules
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onRouteChange(item.id)}
              className={w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-all }
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <button
        onClick={onLock}
        className="w-full px-2.5 py-1.5 rounded-md text-xs font-medium bg-zinc-900 border border-zinc-800 text-rose-400 hover:bg-rose-500/10 transition-all text-center"
      >
        Lock Vault
      </button>
    </aside>
  );
}

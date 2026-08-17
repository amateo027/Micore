import { useState, useEffect } from 'preact/hooks';
import { fetchContacts, saveContact, ContactItem, ContactPayload } from '../../api/contacts';
import styles from './contacts.module.css';

export function ContactsModule() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [identities, setIdentities] = useState<{ platform: string; handle: string }[]>([
    { platform: 'Telegram', handle: '' },
  ]);

  const loadContacts = async () => {
    try {
      const data = await fetchContacts();
      setContacts(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load contacts', e);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleCreate = async (e: Event) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: ContactPayload = {
      notes,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      identities: identities.filter((i) => i.handle.trim() !== ''),
    };

    await saveContact(name, payload);
    setName('');
    setNotes('');
    setTags('');
    setIdentities([{ platform: 'Telegram', handle: '' }]);
    setIsCreating(false);
    await loadContacts();
  };

  const selectedContact = contacts.find((c) => c.id === selectedId);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className="flex items-center justify-between p-3 border-b border-zinc-800/60">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contacts</span>
          <button
            onClick={() => setIsCreating(true)}
            className="px-2 py-1 text-[11px] bg-indigo-600 hover:bg-indigo-500 font-medium rounded text-white transition-all"
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => {
                setSelectedId(contact.id);
                setIsCreating(false);
              }}
              className={p-2.5 rounded-lg cursor-pointer transition-all }
            >
              <div className="text-sm">{contact.title}</div>
              <div className="text-[10px] text-zinc-500 truncate">
                {contact.payload.identities.map((i) => ${i.platform}: ).join(' • ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.detailArea}>
        {isCreating ? (
          <form onSubmit={handleCreate} className="max-w-xl space-y-4">
            <h2 className="text-base font-bold text-zinc-100">Create Identity Profile</h2>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Full Name / Alias</label>
              <input
                type="text"
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Alice Vance"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Identities & Handles</label>
              {identities.map((id, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={id.platform}
                    onInput={(e) => {
                      const updated = [...identities];
                      updated[index].platform = (e.target as HTMLInputElement).value;
                      setIdentities(updated);
                    }}
                    placeholder="Platform"
                    className="w-1/3 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs"
                  />
                  <input
                    type="text"
                    value={id.handle}
                    onInput={(e) => {
                      const updated = [...identities];
                      updated[index].handle = (e.target as HTMLInputElement).value;
                      setIdentities(updated);
                    }}
                    placeholder="@handle or email"
                    className="w-2/3 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setIdentities([...identities, { platform: 'GitHub', handle: '' }])}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                + Add Handle
              </button>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onInput={(e) => setTags((e.target as HTMLInputElement).value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="dev, sec, ops"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Encrypted Notes</label>
              <textarea
                value={notes}
                onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Private context or notes..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-all"
              >
                Save Contact
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : selectedContact ? (
          <div className="max-w-xl space-y-6">
            <div>
              <h1 className="text-xl font-bold text-zinc-100">{selectedContact.title}</h1>
              <div className="flex gap-1.5 mt-2">
                {selectedContact.payload.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-[10px] bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Identities</h3>
              <div className="flex flex-wrap gap-2">
                {selectedContact.payload.identities.map((id, idx) => (
                  <div key={idx} className={styles.identityBadge}>
                    <span className="text-zinc-400 font-mono text-[10px]">{id.platform}:</span>
                    <span className="text-zinc-200 font-medium">{id.handle}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Notes</h3>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-sm text-zinc-300 whitespace-pre-wrap">
                {selectedContact.payload.notes || 'No private notes attached.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs">
            Select a contact or create a new profile.
          </div>
        )}
      </div>
    </div>
  );
}

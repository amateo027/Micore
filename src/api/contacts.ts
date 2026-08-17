import { createEncryptedEntity, readEncryptedEntity, Entity } from './vault';
import { invoke } from '@tauri-apps/api/core';

export interface ContactIdentity {
  handle: string;
  platform: string;
}

export interface ContactPayload {
  notes: string;
  identities: ContactIdentity[];
  tags: string[];
}

export interface ContactItem {
  id: string;
  title: string;
  payload: ContactPayload;
  created_at: number;
  updated_at: number;
}

export async function fetchContacts(): Promise<ContactItem[]> {
  const entities = await invoke<Entity[]>('get_entities');
  const contactEntities = entities.filter((e) => e.kind === 'contact');

  const contacts: ContactItem[] = [];
  for (const entity of contactEntities) {
    try {
      const decryptedText = await readEncryptedEntity(entity.id);
      const payload: ContactPayload = JSON.parse(decryptedText);
      contacts.push({
        id: entity.id,
        title: entity.title,
        payload,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
      });
    } catch {
      // Ignore failure to parse or decrypt
    }
  }
  return contacts;
}

export async function saveContact(title: string, payload: ContactPayload): Promise<Entity> {
  const jsonString = JSON.stringify(payload);
  return await createEncryptedEntity('contact', title, jsonString);
}

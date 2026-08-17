import { invoke } from '@tauri-apps/api/core';

export interface Entity {
  id: string;
  kind: string;
  title: string;
  content?: string;
  metadata?: string;
  created_at: number;
  updated_at: number;
}

export async function unlockVault(passphrase: string, storedSalt?: number[]): Promise<number[]> {
  return await invoke<number[]>('unlock_vault', { passphrase, storedSalt });
}

export async function lockVault(): Promise<void> {
  await invoke('lock_vault');
}

export async function checkVaultStatus(): Promise<boolean> {
  return await invoke<boolean>('is_vault_unlocked');
}

export async function touchActivity(): Promise<void> {
  await invoke('touch_activity');
}

export async function createEncryptedEntity(
  kind: string,
  title: string,
  secretContent: string
): Promise<Entity> {
  return await invoke<Entity>('create_encrypted_entity', {
    kind,
    title,
    secretContent,
  });
}

export async function readEncryptedEntity(entityId: string): Promise<string> {
  return await invoke<string>('read_encrypted_entity', { entityId });
}
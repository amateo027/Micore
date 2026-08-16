use crate::crypto::{CryptoEngine, SecretKey};
use parking_lot::RwLock;

pub struct VaultManager {
    master_key: RwLock<Option<SecretKey>>,
    salt: RwLock<Option<Vec<u8>>>,
}

impl VaultManager {
    pub fn new() -> Self {
        Self {
            master_key: RwLock::new(None),
            salt: RwLock::new(None),
        }
    }

    pub fn unlock(&self, passphrase: &[u8], stored_salt: Option<&[u8]>) -> Result<Vec<u8>, String> {
        let (key, salt) = CryptoEngine::derive_key(passphrase, stored_salt)
            .map_err(|e| e.to_string())?;

        *self.master_key.write() = Some(key);
        *self.salt.write() = Some(salt.clone());
        Ok(salt)
    }

    pub fn lock(&self) {
        *self.master_key.write() = None;
    }

    pub fn is_unlocked(&self) -> bool {
        self.master_key.read().is_some()
    }

    pub fn encrypt_text(&self, plaintext: &str) -> Result<(Vec<u8>, Vec<u8>), String> {
        let key_guard = self.master_key.read();
        let key = key_guard.as_ref().ok_or("Vault is locked")?;
        CryptoEngine::encrypt(plaintext.as_bytes(), key).map_err(|e| e.to_string())
    }

    pub fn decrypt_text(&self, ciphertext: &[u8], nonce: &[u8]) -> Result<String, String> {
        let key_guard = self.master_key.read();
        let key = key_guard.as_ref().ok_or("Vault is locked")?;
        let bytes = CryptoEngine::decrypt(ciphertext, nonce, key).map_err(|e| e.to_string())?;
        String::from_utf8(bytes).map_err(|e| e.to_string())
    }
}
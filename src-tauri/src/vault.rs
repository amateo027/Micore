use crate::crypto::{CryptoEngine, SecretKey};
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use std::sync::atomic::{AtomicI64, Ordering};
use zeroize::Zeroize;

pub struct VaultManager {
    master_key: RwLock<Option<SecretKey>>,
    salt: RwLock<Option<Vec<u8>>>,
    last_activity: AtomicI64,
    timeout_seconds: AtomicI64,
}

impl VaultManager {
    pub fn new() -> Self {
        Self {
            master_key: RwLock::new(None),
            salt: RwLock::new(None),
            last_activity: AtomicI64::new(Utc::now().timestamp()),
            timeout_seconds: AtomicI64::new(300), // 5min by default
        }
    }

    pub fn unlock(&self, mut passphrase: String, stored_salt: Option<&[u8]>) -> Result<Vec<u8>, String> {
        let (key, salt) = CryptoEngine::derive_key(passphrase.as_bytes(), stored_salt)
            .map_err(|e| e.to_string())?;

        passphrase.zeroize();

        *self.master_key.write() = Some(key);
        *self.salt.write() = Some(salt.clone());
        self.touch();
        Ok(salt)
    }

    pub fn lock(&self) {
        *self.master_key.write() = None;
    }

    pub fn touch(&self) {
        self.last_activity.store(Utc::now().timestamp(), Ordering::Relaxed);
    }

    pub fn set_timeout(&self, seconds: i64) {
        self.timeout_seconds.store(seconds, Ordering::Relaxed);
    }

    pub fn check_idle_and_lock(&self) -> bool {
        if !self.is_unlocked() {
            return false;
        }

        let now = Utc::now().timestamp();
        let last = self.last_activity.load(Ordering::Relaxed);
        let timeout = self.timeout_seconds.load(Ordering::Relaxed);

        if now - last >= timeout {
            self.lock();
            true
        } else {
            false
        }
    }

    pub fn is_unlocked(&self) -> bool {
        self.master_key.read().is_some()
    }

    pub fn encrypt_text(&self, plaintext: &str) -> Result<(Vec<u8>, Vec<u8>), String> {
        if self.check_idle_and_lock() {
            return Err("Vault auto-locked due to inactivity".to_string());
        }
        let key_guard = self.master_key.read();
        let key = key_guard.as_ref().ok_or("Vault is locked")?;
        self.touch();
        CryptoEngine::encrypt(plaintext.as_bytes(), key).map_err(|e| e.to_string())
    }

    pub fn decrypt_text(&self, ciphertext: &[u8], nonce: &[u8]) -> Result<String, String> {
        if self.check_idle_and_lock() {
            return Err("Vault auto-locked due to inactivity".to_string());
        }
        let key_guard = self.master_key.read();
        let key = key_guard.as_ref().ok_or("Vault is locked")?;
        self.touch();
        let bytes = CryptoEngine::decrypt(ciphertext, nonce, key).map_err(|e| e.to_string())?;
        String::from_utf8(bytes).map_err(|e| e.to_string())
    }
}
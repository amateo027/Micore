use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2, Params,
};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Encryption failed")]
    EncryptionError,
    #[error("Decryption failed (invalid key or tampered payload)")]
    DecryptionError,
    #[error("Key derivation failed")]
    KdfError,
}

#[derive(Zeroize, ZeroizeOnDrop)]
pub struct SecretKey {
    pub bytes: [u8; 32],
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EncryptedPayload {
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
    pub salt: Vec<u8>,
}

pub struct CryptoEngine;

impl CryptoEngine {
    pub fn derive_key(passphrase: &[u8], salt_bytes: Option<&[u8]>) -> Result<(SecretKey, Vec<u8>), CryptoError> {
        let salt = match salt_bytes {
            Some(s) => s.to_vec(),
            None => {
                let mut fresh_salt = [0u8; 16];
                OsRng.fill_bytes(&mut fresh_salt);
                fresh_salt.to_vec()
            }
        };

        let params = Params::new(19 * 1024, 2, 1, Some(32)).map_err(|_| CryptoError::KdfError)?;
        let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);

        let mut key_bytes = [0u8; 32];
        argon2
            .hash_password_into(passphrase, &salt, &mut key_bytes)
            .map_err(|_| CryptoError::KdfError)?;

        Ok((SecretKey { bytes: key_bytes }, salt))
    }

    pub fn encrypt(plaintext: &[u8], key: &SecretKey) -> Result<(Vec<u8>, Vec<u8>), CryptoError> {
        let cipher_key = Key::<Aes256Gcm>::from_slice(&key.bytes);
        let cipher = Aes256Gcm::new(cipher_key);

        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, plaintext)
            .map_err(|_| CryptoError::EncryptionError)?;

        Ok((ciphertext, nonce_bytes.to_vec()))
    }

    /// Decrypts AES-256-GCM ciphertext
    pub fn decrypt(ciphertext: &[u8], nonce_bytes: &[u8], key: &SecretKey) -> Result<Vec<u8>, CryptoError> {
        if nonce_bytes.len() != 12 {
            return Err(CryptoError::DecryptionError);
        }

        let cipher_key = Key::<Aes256Gcm>::from_slice(&key.bytes);
        let cipher = Aes256Gcm::new(cipher_key);
        let nonce = Nonce::from_slice(nonce_bytes);

        cipher
            .decrypt(nonce, ciphertext)
            .map_err(|_| CryptoError::DecryptionError)
    }
}
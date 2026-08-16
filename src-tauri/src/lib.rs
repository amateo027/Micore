mod crypto;
mod db;
mod vault;

use db::{DbState, Entity};
use vault::VaultManager;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

#[tauri::command]
fn unlock_vault(
    passphrase: String,
    stored_salt: Option<Vec<u8>>,
    vault: State<VaultManager>,
) -> Result<Vec<u8>, String> {
    vault.unlock(passphrase.as_bytes(), stored_salt.as_deref())
}

#[tauri::command]
fn lock_vault(vault: State<VaultManager>) {
    vault.lock();
}

#[tauri::command]
fn is_vault_unlocked(vault: State<VaultManager>) -> bool {
    vault.is_unlocked()
}

#[tauri::command]
fn create_encrypted_entity(
    kind: String,
    title: String,
    secret_content: String,
    db: State<DbState>,
    vault: State<VaultManager>,
) -> Result<Entity, String> {
    let (ciphertext, nonce) = vault.encrypt_text(&secret_content)?;
    
    let payload = serde_json::json!({
        "ciphertext": ciphertext,
        "nonce": nonce,
    }).to_string();

    let now = Utc::now().timestamp();
    let entity = Entity {
        id: Uuid::new_v4().to_string(),
        kind,
        title,
        content: Some(payload),
        metadata: None,
        created_at: now,
        updated_at: now,
    };

    db.insert_entity(&entity).map_err(|e| e.to_string())?;
    Ok(entity)
}

#[tauri::command]
fn read_encrypted_entity(
    entity_id: String,
    db: State<DbState>,
    vault: State<VaultManager>,
) -> Result<String, String> {
    let entities = db.fetch_all_entities().map_err(|e| e.to_string())?;
    let target = entities.into_iter().find(|e| e.id == entity_id).ok_or("Entity not found")?;
    
    let content_json = target.content.ok_or("Entity has no encrypted payload")?;
    let parsed: serde_json::Value = serde_json::from_str(&content_json).map_err(|e| e.to_string())?;
    
    let ciphertext: Vec<u8> = serde_json::from_value(parsed["ciphertext"].clone()).map_err(|e| e.to_string())?;
    let nonce: Vec<u8> = serde_json::from_value(parsed["nonce"].clone()).map_err(|e| e.to_string())?;

    vault.decrypt_text(&ciphertext, &nonce)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_dir).ok();
            
            let db_path = app_dir.join("micore_vault.db");
            let db_state = DbState::new(db_path).expect("Failed to initialize SQLite database");
            
            app.manage(db_state);
            app.manage(VaultManager::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            unlock_vault,
            lock_vault,
            is_vault_unlocked,
            create_encrypted_entity,
            read_encrypted_entity
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
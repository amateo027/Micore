mod db;
mod crypto;

use db::{DbState, Entity, EntityLink};
use tauri::Manager;
use uuid::Uuid;
use chrono::Utc;

#[tauri::command]
fn get_entities(state: tauri::State<DbState>) -> Result<Vec<Entity>, String> {
    state.fetch_all_entities().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_entity(
    state: tauri::State<DbState>,
    kind: String,
    title: String,
    content: Option<String>,
    metadata: Option<String>,
) -> Result<Entity, String> {
    let now = Utc::now().timestamp();
    let entity = Entity {
        id: Uuid::new_v4().to_string(),
        kind,
        title,
        content,
        metadata,
        created_at: now,
        updated_at: now,
    };

    state.insert_entity(&entity).map_err(|e| e.to_string())?;
    Ok(entity)
}

#[tauri::command]
fn link_entities(
    state: tauri::State<DbState>,
    source_id: String,
    target_id: String,
    relation_type: String,
) -> Result<(), String> {
    let link = EntityLink {
        source_id,
        target_id,
        relation_type,
        created_at: Utc::now().timestamp(),
    };

    state.link_entities(&link).map_err(|e| e.to_string())
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
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_entities,
            create_entity,
            link_entities
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
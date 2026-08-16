use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct Entity {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub content: Option<String>,
    pub metadata: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EntityLink {
    pub source_id: String,
    pub target_id: String,
    pub relation_type: String,
    pub created_at: i64,
}

pub struct DbState {
    pub conn: parking_lot::Mutex<Connection>,
}

impl DbState {
    pub fn new<P: AsRef<Path>>(db_path: P) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        
        // Performance & integrity pragmas
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;

        let schema = include_str!("schema.sql");
        conn.execute_batch(schema)?;

        Ok(Self {
            conn: parking_lot::Mutex::new(conn),
        })
    }

    pub fn insert_entity(&self, entity: &Entity) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO entities (id, kind, title, content, metadata, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                entity.id,
                entity.kind,
                entity.title,
                entity.content,
                entity.metadata,
                entity.created_at,
                entity.updated_at
            ],
        )?;
        Ok(())
    }

    pub fn link_entities(&self, link: &EntityLink) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR IGNORE INTO entity_links (source_id, target_id, relation_type, created_at)
             VALUES (?1, ?2, ?3, ?4)",
            params![
                link.source_id,
                link.target_id,
                link.relation_type,
                link.created_at
            ],
        )?;
        Ok(())
    }

    pub fn fetch_all_entities(&self) -> Result<Vec<Entity>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, kind, title, content, metadata, created_at, updated_at 
             FROM entities ORDER BY updated_at DESC",
        )?;
        
        let rows = stmt.query_map([], |row| {
            Ok(Entity {
                id: row.get(0)?,
                kind: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                metadata: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        let mut entities = Vec::new();
        for entity in rows {
            entities.push(entity?);
        }
        Ok(entities)
    }
}
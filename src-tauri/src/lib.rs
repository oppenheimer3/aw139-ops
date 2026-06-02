use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to AW139 Ops.", name)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:aw139.db", crate::migrations::get())
                .build(),
        )
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

mod migrations {
    use tauri_plugin_sql::{Migration, MigrationKind};

    pub fn get() -> Vec<Migration> {
        vec![
            Migration {
                version: 1,
                description: "create initial tables",
                sql: r#"
                    CREATE TABLE IF NOT EXISTS users (
                        username TEXT PRIMARY KEY,
                        password TEXT NOT NULL,
                        role TEXT NOT NULL DEFAULT 'pilot'
                    );

                    INSERT OR IGNORE INTO users (username, password, role) VALUES
                        ('pilot', 'pilot', 'pilot'),
                        ('tech', 'tech', 'tech'),
                        ('ops', 'ops', 'ops');

                    CREATE TABLE IF NOT EXISTS maint_records (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        registration TEXT NOT NULL,
                        date TEXT NOT NULL,
                        action TEXT NOT NULL,
                        denomination TEXT NOT NULL,
                        weight_change_kg REAL DEFAULT 0,
                        sta_cg_mm REAL DEFAULT 0,
                        long_moment_kgmm REAL DEFAULT 0,
                        bl_cg_mm REAL DEFAULT 0,
                        lat_moment_kgmm REAL DEFAULT 0,
                        total_weight_kg REAL DEFAULT 0,
                        total_long_moment_kgmm REAL DEFAULT 0,
                        total_sta_cg_mm REAL DEFAULT 0,
                        total_lat_moment_kgmm REAL DEFAULT 0,
                        total_bl_cg_mm REAL DEFAULT 0,
                        signature TEXT DEFAULT ''
                    );

                    CREATE TABLE IF NOT EXISTS heli_config (
                        registration TEXT PRIMARY KEY,
                        seats TEXT NOT NULL DEFAULT '[]',
                        baggage TEXT NOT NULL DEFAULT '[]',
                        equipment TEXT NOT NULL DEFAULT '[]'
                    );

                    CREATE TABLE IF NOT EXISTS maint_status (
                        registration TEXT PRIMARY KEY,
                        status TEXT NOT NULL DEFAULT 'ready'
                    );

                    CREATE TABLE IF NOT EXISTS saved_calcs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        registration TEXT NOT NULL,
                        data TEXT NOT NULL,
                        created_at TEXT DEFAULT (datetime('now'))
                    );
                "#,
                kind: MigrationKind::Up,
            },
        ]
    }
}

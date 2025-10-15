#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use rusqlite::{params, Connection, Result};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri::AppHandle;

#[derive(Serialize)]
struct Transaction {
    id: i32,
    description: String,
    amount: f64,
    date: String,
}

fn get_connection(app: &AppHandle) -> Result<Connection> {
    // Works in tauri 2.7
    let base_dir = app
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");

    fs::create_dir_all(&base_dir).expect("failed to create data dir");

    let db_path = base_dir.join("finance.db");
    println!("Using DB path: {:?}", db_path);

    let conn = Connection::open(db_path)?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL
        )",
        [],
    )?;
    Ok(conn)
}

#[tauri::command]
fn add_transaction(app: AppHandle, description: String, amount: f64, date: String) -> Result<(), String> {
    let conn = get_connection(&app).map_err(|e| e.to_string())?;
    println!("Inserting: description={}, amount={}, date={}", description, amount, date);
    conn.execute(
        "INSERT INTO transactions (description, amount, date) VALUES (?1, ?2, ?3)",
        params![description, amount, date],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_transactions(app: AppHandle) -> Result<Vec<Transaction>, String> {
    let conn = get_connection(&app).map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, description, amount, date FROM transactions")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                description: row.get(1)?,
                amount: row.get(2)?,
                date: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut transactions = Vec::new();
    for tx in iter {
        transactions.push(tx.map_err(|e| e.to_string())?);
    }
    Ok(transactions)
}

#[tauri::command]
fn delete_transaction(app: AppHandle, id: i32) -> Result<(), String> {
    let conn = get_connection(&app).map_err(|e| e.to_string())?;
    println!("Deleting: id={}", id);
    conn.execute("DELETE FROM transactions WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            add_transaction,
            get_transactions,
            delete_transaction
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

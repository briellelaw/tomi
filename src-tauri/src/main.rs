#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;
use rusqlite::{params, Connection, Result};

// Initialize or get DB connection
fn get_connection() -> Result<Connection> {
    let conn = Connection::open("finance.db")?;
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

// Command to add a transaction
#[tauri::command]
fn add_transaction(description: String, amount: f64, date: String) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO transactions (description, amount, date) VALUES (?1, ?2, ?3)",
        params![description, amount, date],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// Command to fetch all transactions
#[tauri::command]
fn get_transactions() -> Result<Vec<(i32, String, f64, String)>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, description, amount, date FROM transactions")
        .map_err(|e| e.to_string())?;
    let trans_iter = stmt
        .query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut transactions = Vec::new();
    for transaction in trans_iter {
        transactions.push(transaction.map_err(|e| e.to_string())?);
    }
    Ok(transactions)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![add_transaction, get_transactions])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


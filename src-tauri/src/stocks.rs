use rusqlite::{params, Connection, Result};
use serde::Serialize;
use std::fs;
use tauri::{AppHandle, Manager};
use reqwest::blocking::Client;
use reqwest::header::{USER_AGENT, ACCEPT, ACCEPT_ENCODING};

#[derive(Serialize)]
pub struct Stock {
    pub id: i32,
    pub symbol: String,
}

fn get_connection(app: &AppHandle) -> Result<Connection> {
    let base_dir = app
        .path() // ✅ correct API for Tauri 2.7
        .app_data_dir()
        .expect("failed to resolve app data dir");
    fs::create_dir_all(&base_dir).expect("failed to create data dir");

    let db_path = base_dir.join("finance.db");
    let conn = Connection::open(db_path)?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS stocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL UNIQUE
        )",
        [],
    )?;
    Ok(conn)
}

#[tauri::command]
pub fn add_stock(app: AppHandle, symbol: String) -> Result<(), String> {
    let conn = get_connection(&app).map_err(|e| e.to_string())?;
    println!("Inserting: symbol={}", symbol);
    conn.execute(
        "INSERT OR IGNORE INTO stocks (symbol) VALUES (?1)",
        params![symbol.to_uppercase()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_stocks(app: AppHandle) -> Result<Vec<Stock>, String> {
    let conn = get_connection(&app).map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, symbol FROM stocks ORDER BY symbol ASC")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Stock {
                id: row.get(0)?,
                symbol: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut stocks = Vec::new();
    for stock in iter {
        stocks.push(stock.map_err(|e| e.to_string())?);
    }
    Ok(stocks)
}

#[tauri::command]
pub fn delete_stock(app: AppHandle, id: i32) -> Result<(), String> {
    let conn = get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM stocks WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize)]
pub struct StockQuote {
    pub symbol: String,
    pub name: String,
    pub price: f64,
    pub change: f64,
}

#[tauri::command]
pub fn fetch_stock_data(_app: tauri::AppHandle, symbols: Vec<String>) -> Result<Vec<StockQuote>, String> {
    let api_key = "d3nltupr01qo7511kjrgd3nltupr01qo7511kjs0"; // Replace with your own key
    let client = reqwest::blocking::Client::new();
    let mut quotes = Vec::new();

    println!("Fetching symbols: {:?}", symbols);
    for symbol in symbols {
        let url = format!("https://finnhub.io/api/v1/quote?symbol={}&token={}", symbol, api_key);
        let resp = client
            .get(&url)
            .send()
            .map_err(|e| format!("Request failed for {}: {}", symbol, e))?;
        let json: serde_json::Value = resp
            .json()
            .map_err(|e| format!("Invalid response for {}: {}", symbol, e))?;

        let price = json["c"].as_f64().unwrap_or(0.0);
        let prev_close = json["pc"].as_f64().unwrap_or(0.0);
        let change = if prev_close != 0.0 {
            ((price - prev_close) / prev_close) * 100.0
        } else {
            0.0
        };

        quotes.push(StockQuote {
            symbol: symbol.clone(),
            name: symbol.clone(),
            price,
            change,
        });
    }

    Ok(quotes)
}


#[derive(Serialize)]
pub struct PortfolioEntry {
    pub id: i32,
    pub symbol: String,
    pub shares: f64,
    pub cost_basis: f64,
    pub purchase_date: String,
}

fn ensure_portfolio_table(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS portfolio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            shares REAL NOT NULL,
            cost_basis REAL NOT NULL,
            purchase_date TEXT NOT NULL
        )",
        [],
    )?;
    Ok(())
}


#[tauri::command]
pub fn add_portfolio_entry(
    app: AppHandle,
    symbol: String,
    shares: f64,
    cost_basis: f64,
    purchase_date: String, 
) -> Result<(), String> {
    println!("🟢 add_portfolio_entry reached backend!");

    let conn = get_connection(&app).map_err(|e| e.to_string())?;
    ensure_portfolio_table(&conn).map_err(|e| e.to_string())?;
    
    println!("Inserting portfolio entry: symbol={}, shares={}, cost_basis={}, purchase_date={}", symbol, shares, cost_basis, purchase_date);

    conn.execute(
        "INSERT INTO portfolio (symbol, shares, cost_basis, purchase_date) VALUES (?1, ?2, ?3, ?4)",
        params![symbol.to_uppercase(), shares, cost_basis, purchase_date],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_portfolio(app: AppHandle) -> Result<Vec<PortfolioEntry>, String> {
    let conn = get_connection(&app).map_err(|e| e.to_string())?;
    ensure_portfolio_table(&conn).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, symbol, shares, cost_basis, purchase_date FROM portfolio ORDER BY symbol ASC, purchase_date ASC")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(PortfolioEntry {
                id: row.get(0)?,
                symbol: row.get(1)?,
                shares: row.get(2)?,
                cost_basis: row.get(3)?,
                purchase_date: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut portfolio = Vec::new();
    for entry in iter {
        portfolio.push(entry.map_err(|e| e.to_string())?);
    }
    Ok(portfolio)
}


#[tauri::command]
pub fn delete_portfolio_entry(app: AppHandle, id: i32) -> Result<(), String> {
    let conn = get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM portfolio WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
// services/DatabaseService.ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('expiry_checker.db');
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS expiry_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      days_left INTEGER NOT NULL,
      image_uri TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
}

export async function insertItem(name: string, expiryDate: string, imageUri?: string) {
  const database = await initDatabase();
  const today = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  await database.runAsync(
    `INSERT INTO expiry_items (item_name, expiry_date, days_left, image_uri) VALUES (?, ?, ?, ?)`,
    [name, expiryDate, daysLeft, imageUri || null]
  );
}

export async function getAllItemsSorted() {
  const database = await initDatabase();
  const result = await database.getAllAsync(`SELECT * FROM expiry_items ORDER BY days_left ASC`);
  return result;
}

export async function deleteItem(id: number) {
  const database = await initDatabase();
  await database.runAsync(`DELETE FROM expiry_items WHERE id = ?`, [id]);
}

export async function updateItem(id: number, name: string, expiryDate: string, imageUri?: string) {
  const database = await initDatabase();
  const today = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (imageUri) {
    await database.runAsync(
      `UPDATE expiry_items SET item_name = ?, expiry_date = ?, days_left = ?, image_uri = ? WHERE id = ?`,
      [name, expiryDate, daysLeft, imageUri, id]
    );
  } else {
    await database.runAsync(
      `UPDATE expiry_items SET item_name = ?, expiry_date = ?, days_left = ? WHERE id = ?`,
      [name, expiryDate, daysLeft, id]
    );
  }
}
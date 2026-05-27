import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3');

let db;

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export async function initDb({ userDataPath }) {
  if (db) return db;

  fs.mkdirSync(userDataPath, { recursive: true });
  const dbPath = path.join(userDataPath, 'store.db');

  db = new sqlite3.Database(dbPath);

  await run('PRAGMA journal_mode = WAL');
  await run('PRAGMA foreign_keys = ON');

  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}


export async function closeDb() {
  if (!db) return;
  await new Promise((resolve, reject) => {
    db.close((err) => (err ? reject(err) : resolve()));
  });
  db = undefined;
}

export async function listNotes() {
  if (!db) throw new Error('DB not initialized');
  return all('SELECT id, text, created_at as createdAt FROM notes ORDER BY id DESC');
}

export async function addNote(id, name, designation, quantity,date) {
  if (!db) throw new Error('DB not initialized');
  const trimmed = String(text ?? '').trim();
  if (!trimmed) throw new Error('Text is required');

  const { lastID } = await run('INSERT INTO notes (text) VALUES (?)', [trimmed]);
  return get('SELECT id, text, created_at as createdAt FROM notes WHERE id = ?', [lastID]);
}

export async function deleteNote(id) {
  if (!db) throw new Error('DB not initialized');
  const noteId = Number(id);
  if (!Number.isInteger(noteId)) throw new Error('Invalid id');

  const result = await run('DELETE FROM notes WHERE id = ?', [noteId]);
  return { deleted: result.changes > 0 };
}
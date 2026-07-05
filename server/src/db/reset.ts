import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'sup-time.db');

// Удаляем существующую базу данных
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('✅ Старая база данных удалена');
}

// Импортируем инициализацию
import { getDb } from './database';
getDb();

console.log('✅ Новая база данных создана');
console.log('📁 Путь:', DB_PATH);

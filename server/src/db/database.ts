import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'sup-time.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDatabase();
  }
  return db;
}

function initDatabase() {
  db.exec(`
    -- Каталог SUP досок
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      type TEXT NOT NULL CHECK(type IN ('all_around', 'touring', 'race', 'inflatable', 'hardboard', 'kids', 'fishing', 'yoga')),
      length_cm INTEGER,
      width_cm INTEGER,
      volume_liters INTEGER,
      max_weight_kg INTEGER,
      purchase_price REAL,
      sale_price REAL,
      rental_price_daily REAL,
      rental_price_hourly REAL,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'rented', 'maintenance', 'sold', 'reserved')),
      image_url TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Клиенты
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      first_name TEXT NOT NULL,
      last_name TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      birth_date TEXT,
      notes TEXT,
      total_purchases INTEGER DEFAULT 0,
      total_rentals INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      loyalty_level TEXT DEFAULT 'basic' CHECK(loyalty_level IN ('basic', 'silver', 'gold', 'vip')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Бронирования (аренда)
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      client_id TEXT NOT NULL,
      board_id TEXT NOT NULL,
      booking_type TEXT NOT NULL CHECK(booking_type IN ('daily', 'hourly')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'overdue')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      actual_return_date TEXT,
      total_price REAL NOT NULL,
      deposit_amount REAL DEFAULT 0,
      deposit_returned INTEGER DEFAULT 0,
      late_fee REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    );

    -- Продажи
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      client_id TEXT,
      board_id TEXT NOT NULL,
      sale_price REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cash' CHECK(payment_method IN ('cash', 'card', 'transfer', 'mixed')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    );

    -- Уведомления
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      booking_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('reminder_return', 'overdue', 'booking_confirmed', 'payment_received', 'maintenance_due', 'custom')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      scheduled_for TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );

    -- Настройки магазина
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Индексы для производительности
    CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_board ON bookings(board_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id);
    CREATE INDEX IF NOT EXISTS idx_sales_board ON sales(board_id);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);
  `);

  // Вставка настроек по умолчанию
  const defaultSettings = [
    ['shop_name', 'SUP-TIME'],
    ['shop_phone', '+7 (999) 123-45-67'],
    ['shop_address', ''],
    ['working_hours', '09:00-21:00'],
    ['currency', 'RUB'],
    ['deposit_percent', '30'],
    ['late_fee_hourly', '500'],
    ['late_fee_daily', '1000'],
    ['notification_advance_hours', '2'],
  ];

  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  );

  for (const [key, value] of defaultSettings) {
    insertSetting.run(key, value);
  }
}

export default getDb;

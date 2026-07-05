import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { Setting } from '../types';

const router = Router();

// Получить все настройки
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM settings').all() as Setting[];
  
  // Преобразуем в объект
  const settingsObj: Record<string, string> = {};
  for (const setting of settings) {
    settingsObj[setting.key] = setting.value;
  }

  res.json(settingsObj);
});

// Получить конкретную настройку
router.get('/:key', (req: Request, res: Response) => {
  const db = getDb();
  const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key) as Setting | undefined;

  if (!setting) {
    return res.status(404).json({ error: 'Настройка не найдена' });
  }

  res.json(setting);
});

// Обновить настройки
router.put('/', (req: Request, res: Response) => {
  const db = getDb();
  const settings = req.body as Record<string, string>;

  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
  `);

  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(key, value, value);
    }
  });

  transaction();

  // Возвращаем обновленные настройки
  const allSettings = db.prepare('SELECT * FROM settings').all() as Setting[];
  const settingsObj: Record<string, string> = {};
  for (const setting of allSettings) {
    settingsObj[setting.key] = setting.value;
  }

  res.json(settingsObj);
});

// Обновить одну настройку
router.put('/:key', (req: Request, res: Response) => {
  const db = getDb();
  const { value } = req.body;

  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
  `);

  stmt.run(req.params.key, value, value);

  const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key) as Setting;
  res.json(setting);
});

export default router;

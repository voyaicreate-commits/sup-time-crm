import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { Notification } from '../types';

const router = Router();

// Получить все уведомления
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { unread_only, page = '1', limit = '50' } = req.query as { unread_only?: string; page?: string; limit?: string };

  let query = 'SELECT * FROM notifications WHERE 1=1';
  const params: any[] = [];

  if (unread_only === 'true') {
    query += ' AND is_read = 0';
  }

  // Подсчет непрочитанных
  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get() as { count: number };

  // Пагинация
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const notifications = db.prepare(query).all(...params) as Notification[];

  res.json({
    data: notifications,
    unread_count: unreadCount.count
  });
});

// Отметить уведомление как прочитанное
router.put('/:id/read', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Уведомление не найдено' });
  }

  res.json({ success: true });
});

// Отметить все уведомления как прочитанные
router.put('/read-all', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0').run();
  res.json({ success: true });
});

// Удалить уведомление
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Уведомление не найдено' });
  }

  res.json({ success: true });
});

// Создать уведомление вручную
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { type, title, message, scheduled_for } = req.body;

  const notifId = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO notifications (id, type, title, message, scheduled_for)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(notifId, type, title, message, scheduled_for);
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId) as Notification;
  res.status(201).json(notification);
});

// Получить уведомления по бронированию
router.get('/booking/:bookingId', (req: Request, res: Response) => {
  const db = getDb();
  const notifications = db.prepare(`
    SELECT * FROM notifications 
    WHERE booking_id = ?
    ORDER BY created_at DESC
  `).all(req.params.bookingId) as Notification[];

  res.json(notifications);
});

export default router;

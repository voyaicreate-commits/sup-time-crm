import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { Sale, CreateSaleRequest, PaginatedResponse } from '../types';

const router = Router();

// Получить все продажи с пагинацией
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { page = '1', limit = '20', date_from, date_to } = req.query as { page?: string; limit?: string; date_from?: string; date_to?: string };

  let query = `
    SELECT s.*, 
           c.first_name || ' ' || COALESCE(c.last_name, '') as client_name,
           b.name as board_name
    FROM sales s
    LEFT JOIN clients c ON s.client_id = c.id
    JOIN boards b ON s.board_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (date_from) {
    query += ' AND s.created_at >= ?';
    params.push(date_from);
  }

  if (date_to) {
    query += ' AND s.created_at <= ?';
    params.push(date_to);
  }

  // Подсчет общего количества
  const countQuery = query.replace(/SELECT s\.\*.*?FROM/s, 'SELECT COUNT(*) as count FROM');
  const total = db.prepare(countQuery).get(...params) as { count: number };

  // Пагинация
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const sales = db.prepare(query).all(...params) as Sale[];

  const response: PaginatedResponse<Sale> = {
    data: sales,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total.count / parseInt(limit))
  };

  res.json(response);
});

// Получить продажу по ID
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const sale = db.prepare(`
    SELECT s.*, 
           c.first_name || ' ' || COALESCE(c.last_name, '') as client_name,
           c.phone as client_phone,
           b.name as board_name,
           b.type as board_type
    FROM sales s
    LEFT JOIN clients c ON s.client_id = c.id
    JOIN boards b ON s.board_id = b.id
    WHERE s.id = ?
  `).get(req.params.id) as Sale | undefined;

  if (!sale) {
    return res.status(404).json({ error: 'Продажа не найдена' });
  }

  res.json(sale);
});

// Создать продажу
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const data: CreateSaleRequest = req.body;

  // Проверяем существование доски
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(data.board_id) as any;
  if (!board) {
    return res.status(400).json({ error: 'Доска не найдена' });
  }

  if (board.status === 'sold' || board.status === 'rented') {
    return res.status(400).json({ error: 'Доска недоступна для продажи' });
  }

  // Если указан клиент - проверяем существование
  if (data.client_id) {
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(data.client_id);
    if (!client) {
      return res.status(400).json({ error: 'Клиент не найден' });
    }
  }

  const saleId = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO sales (id, client_id, board_id, sale_price, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(saleId, data.client_id, data.board_id, data.sale_price, data.payment_method, data.notes);

  // Обновляем статус доски
  db.prepare('UPDATE boards SET status = ? WHERE id = ?').run('sold', data.board_id);

  // Обновляем статистику клиента
  if (data.client_id) {
    db.prepare('UPDATE clients SET total_purchases = total_purchases + 1, total_spent = total_spent + ? WHERE id = ?')
      .run(data.sale_price, data.client_id);
  }

  // Создаем уведомление
  if (data.client_id) {
    db.prepare(`
      INSERT INTO notifications (type, title, message)
      VALUES ('payment_received', 'Получена оплата', ?)
    `).run(`Продажа доски "${board.name}" на сумму ${data.sale_price} ₽`);
  }

  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId) as Sale;
  res.status(201).json(sale);
});

// Удалить продажу (возвращаем доску)
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id) as Sale | undefined;

  if (!sale) {
    return res.status(404).json({ error: 'Продажа не найдена' });
  }

  // Возвращаем доску в доступные
  db.prepare('UPDATE boards SET status = ? WHERE id = ?').run('available', sale.board_id);

  // Обновляем статистику клиента
  if (sale.client_id) {
    db.prepare('UPDATE clients SET total_purchases = total_purchases - 1, total_spent = total_spent - ? WHERE id = ?')
      .run(sale.sale_price, sale.client_id);
  }

  db.prepare('DELETE FROM sales WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Получить статистику продаж
router.get('/stats/summary', (req: Request, res: Response) => {
  const db = getDb();
  const { date_from, date_to } = req.query as { date_from?: string; date_to?: string };

  let query = 'SELECT COUNT(*) as count, SUM(sale_price) as total FROM sales WHERE 1=1';
  const params: any[] = [];

  if (date_from) {
    query += ' AND created_at >= ?';
    params.push(date_from);
  }

  if (date_to) {
    query += ' AND created_at <= ?';
    params.push(date_to);
  }

  const stats = db.prepare(query).get(...params) as { count: number; total: number };
  res.json(stats);
});

export default router;

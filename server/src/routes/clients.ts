import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { Client, CreateClientRequest, ClientFilters, PaginatedResponse } from '../types';

const router = Router();

// Получить всех клиентов с фильтрацией и пагинацией
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { search, loyalty_level, page = '1', limit = '20' } = req.query as ClientFilters & { page?: string; limit?: string };

  let query = 'SELECT * FROM clients WHERE 1=1';
  const params: any[] = [];

  if (search) {
    query += ' AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (loyalty_level) {
    query += ' AND loyalty_level = ?';
    params.push(loyalty_level);
  }

  // Подсчет общего количества
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = db.prepare(countQuery).get(...params) as { count: number };

  // Пагинация
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const clients = db.prepare(query).all(...params) as Client[];

  const response: PaginatedResponse<Client> = {
    data: clients,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total.count / parseInt(limit))
  };

  res.json(response);
});

// Получить клиента по ID
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id) as Client | undefined;

  if (!client) {
    return res.status(404).json({ error: 'Клиент не найден' });
  }

  res.json(client);
});

// Создать клиента
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const data: CreateClientRequest = req.body;

  // Проверка на дубликат по телефону
  const existing = db.prepare('SELECT id FROM clients WHERE phone = ?').get(data.phone);
  if (existing) {
    return res.status(400).json({ error: 'Клиент с таким телефоном уже существует' });
  }

  const clientId = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO clients (id, first_name, last_name, phone, email, birth_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(clientId, data.first_name, data.last_name, data.phone, data.email, data.birth_date, data.notes);
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) as Client;
  res.status(201).json(client);
});

// Обновить клиента
router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const data: Partial<CreateClientRequest> = req.body;

  const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id) as Client | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Клиент не найден' });
  }

  // Проверка на дубликат по телефону (если телефон изменяется)
  if (data.phone && data.phone !== existing.phone) {
    const duplicate = db.prepare('SELECT id FROM clients WHERE phone = ? AND id != ?').get(data.phone, req.params.id);
    if (duplicate) {
      return res.status(400).json({ error: 'Клиент с таким телефоном уже существует' });
    }
  }

  const stmt = db.prepare(`
    UPDATE clients SET 
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      birth_date = COALESCE(?, birth_date),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(data.first_name, data.last_name, data.phone, data.email, data.birth_date, data.notes, req.params.id);

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id) as Client;
  res.json(client);
});

// Удалить клиента
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Клиент не найден' });
  }

  res.json({ success: true });
});

// Получить историю клиента
router.get('/:id/history', (req: Request, res: Response) => {
  const db = getDb();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id) as Client | undefined;

  if (!client) {
    return res.status(404).json({ error: 'Клиент не найден' });
  }

  // Бронирования клиента
  const bookings = db.prepare(`
    SELECT b.*, br.name as board_name, br.type as board_type
    FROM bookings b
    JOIN boards br ON b.board_id = br.id
    WHERE b.client_id = ?
    ORDER BY b.created_at DESC
  `).all(req.params.id);

  // Продажи клиента
  const sales = db.prepare(`
    SELECT s.*, br.name as board_name
    FROM sales s
    JOIN boards br ON s.board_id = br.id
    WHERE s.client_id = ?
    ORDER BY s.created_at DESC
  `).all(req.params.id);

  res.json({
    client,
    bookings,
    sales,
    stats: {
      totalBookings: client.total_rentals,
      totalPurchases: client.total_purchases,
      totalSpent: client.total_spent
    }
  });
});

// Поиск клиента по телефону
router.get('/search/phone/:phone', (req: Request, res: Response) => {
  const db = getDb();
  const client = db.prepare('SELECT * FROM clients WHERE phone = ?').get(req.params.phone) as Client | undefined;

  if (!client) {
    return res.status(404).json({ error: 'Клиент не найден' });
  }

  res.json(client);
});

export default router;

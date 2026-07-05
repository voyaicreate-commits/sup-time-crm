import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { Board, CreateBoardRequest, BoardFilters, PaginatedResponse } from '../types';

const router = Router();

// Получить все доски с фильтрацией и пагинацией
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { type, status, search, page = '1', limit = '20' } = req.query as BoardFilters & { page?: string; limit?: string };

  let query = 'SELECT * FROM boards WHERE 1=1';
  const params: any[] = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (name LIKE ? OR brand LIKE ? OR model LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Подсчет общего количества
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = db.prepare(countQuery).get(...params) as { count: number };

  // Пагинация
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const boards = db.prepare(query).all(...params) as Board[];

  const response: PaginatedResponse<Board> = {
    data: boards,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total.count / parseInt(limit))
  };

  res.json(response);
});

// Получить доску по ID
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id) as Board | undefined;

  if (!board) {
    return res.status(404).json({ error: 'Доска не найдена' });
  }

  res.json(board);
});

// Создать доску
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const data: CreateBoardRequest = req.body;

  const boardId = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO boards (id, name, brand, model, type, length_cm, width_cm, volume_liters,
                        max_weight_kg, purchase_price, sale_price, rental_price_daily,
                        rental_price_hourly, image_url, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    boardId, data.name, data.brand, data.model, data.type,
    data.length_cm, data.width_cm, data.volume_liters,
    data.max_weight_kg, data.purchase_price, data.sale_price,
    data.rental_price_daily, data.rental_price_hourly,
    data.image_url, data.notes
  );

  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId) as Board;
  res.status(201).json(board);
});

// Обновить доску
router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const data: Partial<CreateBoardRequest> = req.body;

  const existing = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id) as Board | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Доска не найдена' });
  }

  const stmt = db.prepare(`
    UPDATE boards SET 
      name = COALESCE(?, name),
      brand = COALESCE(?, brand),
      model = COALESCE(?, model),
      type = COALESCE(?, type),
      length_cm = COALESCE(?, length_cm),
      width_cm = COALESCE(?, width_cm),
      volume_liters = COALESCE(?, volume_liters),
      max_weight_kg = COALESCE(?, max_weight_kg),
      purchase_price = COALESCE(?, purchase_price),
      sale_price = COALESCE(?, sale_price),
      rental_price_daily = COALESCE(?, rental_price_daily),
      rental_price_hourly = COALESCE(?, rental_price_hourly),
      status = COALESCE(?, status),
      image_url = COALESCE(?, image_url),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(
    data.name, data.brand, data.model, data.type,
    data.length_cm, data.width_cm, data.volume_liters,
    data.max_weight_kg, data.purchase_price, data.sale_price,
    data.rental_price_daily, data.rental_price_hourly,
    data.status || existing.status, data.image_url, data.notes,
    req.params.id
  );

  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id) as Board;
  res.json(board);
});

// Удалить доску
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM boards WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Доска не найдена' });
  }

  res.json({ success: true });
});

// Получить доступные доски на даты
router.get('/available/:date', (req: Request, res: Response) => {
  const db = getDb();
  const { date } = req.params;
  const { booking_type = 'daily' } = req.query;

  let query = `
    SELECT b.* FROM boards b
    WHERE b.status = 'available'
    AND b.id NOT IN (
      SELECT bk.board_id FROM bookings bk
      WHERE bk.status IN ('confirmed', 'active')
      AND bk.start_date <= ?
      AND bk.end_date >= ?
    )
    ORDER BY b.name
  `;

  const boards = db.prepare(query).all(date, date) as Board[];
  res.json(boards);
});

export default router;

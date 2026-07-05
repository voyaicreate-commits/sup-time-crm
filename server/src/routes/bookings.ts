import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { Booking, CreateBookingRequest, UpdateBookingRequest, BookingFilters, PaginatedResponse } from '../types';

const router = Router();

// Получить все бронирования с фильтрацией и пагинацией
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { status, booking_type, client_id, board_id, date_from, date_to, page = '1', limit = '20' } = 
    req.query as BookingFilters & { page?: string; limit?: string };

  let query = `
    SELECT b.*, 
           c.first_name || ' ' || COALESCE(c.last_name, '') as client_name,
           c.phone as client_phone,
           br.name as board_name,
           br.type as board_type
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    JOIN boards br ON b.board_id = br.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }

  if (booking_type) {
    query += ' AND b.booking_type = ?';
    params.push(booking_type);
  }

  if (client_id) {
    query += ' AND b.client_id = ?';
    params.push(client_id);
  }

  if (board_id) {
    query += ' AND b.board_id = ?';
    params.push(board_id);
  }

  if (date_from) {
    query += ' AND b.start_date >= ?';
    params.push(date_from);
  }

  if (date_to) {
    query += ' AND b.end_date <= ?';
    params.push(date_to);
  }

  // Подсчет общего количества
  const countQuery = query.replace(/SELECT b\.\*.*?FROM/s, 'SELECT COUNT(*) as count FROM');
  const total = db.prepare(countQuery).get(...params) as { count: number };

  // Пагинация
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ' ORDER BY b.start_date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const bookings = db.prepare(query).all(...params) as Booking[];

  const response: PaginatedResponse<Booking> = {
    data: bookings,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total.count / parseInt(limit))
  };

  res.json(response);
});

// Получить бронирование по ID
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare(`
    SELECT b.*, 
           c.first_name || ' ' || COALESCE(c.last_name, '') as client_name,
           c.phone as client_phone,
           c.email as client_email,
           br.name as board_name,
           br.type as board_type,
           br.rental_price_daily,
           br.rental_price_hourly
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    JOIN boards br ON b.board_id = br.id
    WHERE b.id = ?
  `).get(req.params.id) as Booking | undefined;

  if (!booking) {
    return res.status(404).json({ error: 'Бронирование не найдено' });
  }

  res.json(booking);
});

// Создать бронирование
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const data: CreateBookingRequest = req.body;

  // Проверяем существование клиента
  const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(data.client_id);
  if (!client) {
    return res.status(400).json({ error: 'Клиент не найден' });
  }

  // Проверяем существование доски и её доступность
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(data.board_id) as any;
  if (!board) {
    return res.status(400).json({ error: 'Доска не найдена' });
  }

  if (board.status !== 'available') {
    return res.status(400).json({ error: 'Доска недоступна для бронирования' });
  }

  // Проверяем конфликты бронирований
  const conflict = db.prepare(`
    SELECT id FROM bookings 
    WHERE board_id = ? 
    AND status IN ('confirmed', 'active')
    AND start_date <= ? 
    AND end_date >= ?
  `).get(data.board_id, data.end_date, data.start_date);

  if (conflict) {
    return res.status(400).json({ error: 'Доска уже забронирована на эти даты' });
  }

  // Рассчитываем стоимость
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  let totalPrice: number;

  if (data.booking_type === 'daily') {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    totalPrice = days * board.rental_price_daily;
  } else {
    const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    totalPrice = hours * board.rental_price_hourly;
  }

  // Рассчитываем залог
  const depositSetting = db.prepare("SELECT value FROM settings WHERE key = 'deposit_percent'").get() as { value: string } | undefined;
  const depositPercent = parseFloat(depositSetting?.value || '30');
  const depositAmount = totalPrice * (parseFloat(depositPercent) / 100);

  const bookingId = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO bookings (id, client_id, board_id, booking_type, status, start_date, end_date, total_price, deposit_amount, notes)
    VALUES (?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?)
  `);

  stmt.run(
    bookingId, data.client_id, data.board_id, data.booking_type,
    data.start_date, data.end_date, totalPrice,
    depositAmount, data.notes
  );

  // Обновляем статус доски
  db.prepare('UPDATE boards SET status = ? WHERE id = ?').run('reserved', data.board_id);

  // Обновляем статистику клиента
  db.prepare('UPDATE clients SET total_rentals = total_rentals + 1 WHERE id = ?').run(data.client_id);

  // Создаем уведомление
  db.prepare(`
    INSERT INTO notifications (booking_id, type, title, message, scheduled_for)
    VALUES (?, 'booking_confirmed', 'Бронирование подтверждено', ?, ?)
  `).run(
    bookingId,
    `Бронирование #${bookingId.slice(0, 8)} подтверждено`,
    data.start_date
  );

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as Booking;
  res.status(201).json(booking);
});

// Обновить статус бронирования
router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const data: UpdateBookingRequest = req.body;

  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as Booking | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Бронирование не найдено' });
  }

  // Если бронирование завершено - обновляем статус доски
  if (data.status === 'completed') {
    db.prepare('UPDATE boards SET status = ? WHERE id = ?').run('available', existing.board_id);
    
    // Обновляем статистику клиента
    const totalSpent = existing.total_price + (data.late_fee || 0);
    db.prepare('UPDATE clients SET total_spent = total_spent + ? WHERE id = ?').run(totalSpent, existing.client_id);
  }

  // Если бронирование активно - доска в аренде
  if (data.status === 'active') {
    db.prepare('UPDATE boards SET status = ? WHERE id = ?').run('rented', existing.board_id);
  }

  // Если отменено - доска доступна
  if (data.status === 'cancelled') {
    db.prepare('UPDATE boards SET status = ? WHERE id = ?').run('available', existing.board_id);
  }

  const stmt = db.prepare(`
    UPDATE bookings SET 
      status = COALESCE(?, status),
      actual_return_date = COALESCE(?, actual_return_date),
      late_fee = COALESCE(?, late_fee),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(data.status, data.actual_return_date, data.late_fee, data.notes, req.params.id);

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as Booking;
  res.json(booking);
});

// Удалить бронирование
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as Booking | undefined;

  if (!booking) {
    return res.status(404).json({ error: 'Бронирование не найдено' });
  }

  // Возвращаем доску в доступные
  if (booking.status !== 'completed' && booking.status !== 'cancelled') {
    db.prepare('UPDATE boards SET status = ? WHERE id = ?').run('available', booking.board_id);
  }

  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Получить бронирования на конкретную дату (для календаря)
router.get('/calendar/:date', (req: Request, res: Response) => {
  const db = getDb();
  const { date } = req.params;

  const bookings = db.prepare(`
    SELECT b.*, 
           c.first_name || ' ' || COALESCE(c.last_name, '') as client_name,
           c.phone as client_phone,
           br.name as board_name,
           br.type as board_type
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    JOIN boards br ON b.board_id = br.id
    WHERE b.start_date <= ? AND b.end_date >= ?
    AND b.status IN ('confirmed', 'active')
    ORDER BY b.start_date
  `).all(date, date) as Booking[];

  res.json(bookings);
});

// Получить бронирования на период (для календаря - месяц)
router.get('/calendar/period/:start/:end', (req: Request, res: Response) => {
  const db = getDb();
  const { start, end } = req.params;

  const bookings = db.prepare(`
    SELECT b.*, 
           c.first_name || ' ' || COALESCE(c.last_name, '') as client_name,
           c.phone as client_phone,
           br.name as board_name,
           br.type as board_type
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    JOIN boards br ON b.board_id = br.id
    WHERE b.start_date <= ? AND b.end_date >= ?
    AND b.status IN ('confirmed', 'active')
    ORDER BY b.start_date
  `).all(end, start) as Booking[];

  res.json(bookings);
});

export default router;

import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { DashboardStats, RevenueByPeriod, BoardUtilization, PopularBoard } from '../types';

const router = Router();

// Получить статистику дашборда
router.get('/dashboard', (req: Request, res: Response) => {
  const db = getDb();

  // Общая выручка за текущий месяц
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

  const currentRevenue = db.prepare(`
    SELECT COALESCE(SUM(total_price), 0) as total
    FROM bookings
    WHERE status IN ('completed', 'active')
    AND start_date LIKE ?
  `).get(`${currentMonth}%`) as { total: number };

  const lastRevenue = db.prepare(`
    SELECT COALESCE(SUM(total_price), 0) as total
    FROM bookings
    WHERE status IN ('completed', 'active')
    AND start_date LIKE ?
  `).get(`${lastMonth}%`) as { total: number };

  // Выручка от продаж
  const currentSales = db.prepare(`
    SELECT COALESCE(SUM(sale_price), 0) as total
    FROM sales
    WHERE created_at LIKE ?
  `).get(`${currentMonth}%`) as { total: number };

  const lastSales = db.prepare(`
    SELECT COALESCE(SUM(sale_price), 0) as total
    FROM sales
    WHERE created_at LIKE ?
  `).get(`${lastMonth}%`) as { total: number };

  const totalRevenue = currentRevenue.total + currentSales.total;
  const lastTotalRevenue = lastRevenue.total + lastSales.total;
  const revenueChange = lastTotalRevenue > 0 
    ? ((totalRevenue - lastTotalRevenue) / lastTotalRevenue) * 100 
    : 0;

  // Активные аренды
  const activeRentals = db.prepare(`
    SELECT COUNT(*) as count
    FROM bookings
    WHERE status = 'active'
  `).get() as { count: number };

  const lastActiveRentals = db.prepare(`
    SELECT COUNT(*) as count
    FROM bookings
    WHERE status = 'active'
    AND created_at < ?
  `).get(`${currentMonth}-01`) as { count: number };

  const rentalsChange = lastActiveRentals.count > 0
    ? ((activeRentals.count - lastActiveRentals.count) / lastActiveRentals.count) * 100
    : 0;

  // Общее количество клиентов
  const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
  const newClientsThisMonth = db.prepare(`
    SELECT COUNT(*) as count
    FROM clients
    WHERE created_at LIKE ?
  `).get(`${currentMonth}%`) as { count: number };

  const lastMonthClients = db.prepare(`
    SELECT COUNT(*) as count
    FROM clients
    WHERE created_at < ?
  `).get(`${currentMonth}-01`) as { count: number };

  const clientsChange = lastMonthClients.count > 0
    ? (newClientsThisMonth.count / lastMonthClients.count) * 100
    : 0;

  // Доски
  const boardsTotal = db.prepare('SELECT COUNT(*) as count FROM boards').get() as { count: number };
  const boardsAvailable = db.prepare(`
    SELECT COUNT(*) as count FROM boards WHERE status = 'available'
  `).get() as { count: number };

  const stats: DashboardStats = {
    totalRevenue,
    revenueChange: Math.round(revenueChange * 10) / 10,
    activeRentals: activeRentals.count,
    rentalsChange: Math.round(rentalsChange * 10) / 10,
    totalClients: totalClients.count,
    clientsChange: Math.round(clientsChange * 10) / 10,
    boardsAvailable: boardsAvailable.count,
    boardsTotal: boardsTotal.count
  };

  res.json(stats);
});

// Выручка по периодам (для графика)
router.get('/revenue', (req: Request, res: Response) => {
  const db = getDb();
  const { period = 'daily', days = '30' } = req.query as { period?: string; days?: string };

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  let groupBy: string;
  let dateFormat: string;

  switch (period) {
    case 'weekly':
      groupBy = "strftime('%Y-W%W', start_date)";
      dateFormat = '%Y-W%W';
      break;
    case 'monthly':
      groupBy = "strftime('%Y-%m', start_date)";
      dateFormat = '%Y-%m';
      break;
    default:
      groupBy = "date(start_date)";
      dateFormat = '%Y-%m-%d';
  }

  const bookingsRevenue = db.prepare(`
    SELECT ${groupBy} as period,
           SUM(total_price) as revenue,
           COUNT(*) as bookings
    FROM bookings
    WHERE status IN ('completed', 'active')
    AND start_date >= ?
    AND start_date <= ?
    GROUP BY ${groupBy}
    ORDER BY period
  `).all(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10));

  const salesRevenue = db.prepare(`
    SELECT date(created_at) as period,
           SUM(sale_price) as revenue,
           COUNT(*) as sales
    FROM sales
    WHERE created_at >= ?
    AND created_at <= ?
    GROUP BY date(created_at)
    ORDER BY period
  `).all(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10));

  // Объединяем данные
  const revenueMap = new Map<string, RevenueByPeriod>();

  for (const item of bookingsRevenue as any[]) {
    revenueMap.set(item.period, {
      date: item.period,
      revenue: item.revenue,
      bookings: item.bookings,
      sales: 0
    });
  }

  for (const item of salesRevenue as any[]) {
    const existing = revenueMap.get(item.period);
    if (existing) {
      existing.revenue += item.revenue;
      existing.sales = item.sales;
    } else {
      revenueMap.set(item.period, {
        date: item.period,
        revenue: item.revenue,
        bookings: 0,
        sales: item.sales
      });
    }
  }

  const result = Array.from(revenueMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  res.json(result);
});

// Утилизация досок
router.get('/utilization', (req: Request, res: Response) => {
  const db = getDb();
  const { days = '30' } = req.query as { days?: string };

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  const totalDays = parseInt(days);

  const boards = db.prepare('SELECT id, name FROM boards').all() as any[];
  const utilization: BoardUtilization[] = [];

  for (const board of boards) {
    const rentedDays = db.prepare(`
      SELECT COALESCE(SUM(
        JULIANDAY(MIN(end_date, ?)) - JULIANDAY(MAX(start_date, ?))
      ), 0) as days
      FROM bookings
      WHERE board_id = ?
      AND status IN ('completed', 'active')
      AND start_date <= ?
      AND end_date >= ?
    `).get(
      endDate.toISOString().slice(0, 10),
      startDate.toISOString().slice(0, 10),
      board.id,
      endDate.toISOString().slice(0, 10),
      startDate.toISOString().slice(0, 10)
    ) as { days: number };

    utilization.push({
      board_id: board.id,
      board_name: board.name,
      total_days: totalDays,
      rented_days: Math.round(rentedDays.days),
      utilization_percent: Math.round((rentedDays.days / totalDays) * 100)
    });
  }

  res.json(utilization);
});

// Популярные доски
router.get('/popular', (req: Request, res: Response) => {
  const db = getDb();
  const { limit = '10' } = req.query as { limit?: string };

  const popular = db.prepare(`
    SELECT 
      b.id as board_id,
      b.name as board_name,
      COUNT(DISTINCT bk.id) as rental_count,
      COUNT(DISTINCT s.id) as sale_count,
      COALESCE(SUM(bk.total_price), 0) + COALESCE(SUM(s.sale_price), 0) as total_revenue
    FROM boards b
    LEFT JOIN bookings bk ON b.id = bk.board_id AND bk.status IN ('completed', 'active')
    LEFT JOIN sales s ON b.id = s.board_id
    GROUP BY b.id
    ORDER BY total_revenue DESC
    LIMIT ?
  `).all(parseInt(limit)) as PopularBoard[];

  res.json(popular);
});

// Клиенты с наибольшими расходами
router.get('/top-clients', (req: Request, res: Response) => {
  const db = getDb();
  const { limit = '10' } = req.query as { limit?: string };

  const topClients = db.prepare(`
    SELECT 
      c.id,
      c.first_name || ' ' || COALESCE(c.last_name, '') as name,
      c.phone,
      c.loyalty_level,
      c.total_spent,
      c.total_rentals,
      c.total_purchases
    FROM clients c
    ORDER BY c.total_spent DESC
    LIMIT ?
  `).all(parseInt(limit));

  res.json(topClients);
});

// Загруженность по дням недели
router.get('/weekly-pattern', (req: Request, res: Response) => {
  const db = getDb();
  const { days = '90' } = req.query as { days?: string };

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const pattern = db.prepare(`
    SELECT 
      CASE CAST(strftime('%w', start_date) AS INTEGER)
        WHEN 0 THEN 'Воскресенье'
        WHEN 1 THEN 'Понедельник'
        WHEN 2 THEN 'Вторник'
        WHEN 3 THEN 'Среда'
        WHEN 4 THEN 'Четверг'
        WHEN 5 THEN 'Пятница'
        WHEN 6 THEN 'Суббота'
      END as day_name,
      strftime('%w', start_date) as day_number,
      COUNT(*) as bookings_count,
      SUM(total_price) as revenue
    FROM bookings
    WHERE status IN ('completed', 'active')
    AND start_date >= ?
    AND start_date <= ?
    GROUP BY strftime('%w', start_date)
    ORDER BY day_number
  `).all(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10));

  res.json(pattern);
});

export default router;

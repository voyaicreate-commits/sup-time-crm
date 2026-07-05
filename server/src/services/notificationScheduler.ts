import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';

export function startNotificationScheduler() {
  // Проверяем уведомления каждые 5 минут
  cron.schedule('*/5 * * * *', () => {
    checkUpcomingReturns();
    checkOverdueBookings();
  });

  console.log('🔔 Планировщик уведомлений запущен');
}

function checkUpcomingReturns() {
  const db = getDb();
  
  // Получаем настройку времени напоминания
  const setting = db.prepare("SELECT value FROM settings WHERE key = 'notification_advance_hours'").get() as { value: string } | undefined;
  const advanceHours = parseInt(setting?.value || '2');
  
  const now = new Date();
  const checkTime = new Date(now.getTime() + advanceHours * 60 * 60 * 1000);
  
  // Находим бронирования, которые скоро заканчиваются
  const upcomingReturns = db.prepare(`
    SELECT b.*, 
           c.first_name || ' ' || COALESCE(c.last_name, '') as client_name,
           c.phone as client_phone,
           br.name as board_name
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    JOIN boards br ON b.board_id = br.id
    WHERE b.status IN ('confirmed', 'active')
    AND b.end_date <= ?
    AND b.end_date > ?
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.booking_id = b.id 
      AND n.type = 'reminder_return'
      AND n.created_at > datetime('now', '-1 hour')
    )
  `).all(checkTime.toISOString(), now.toISOString()) as any[];

  for (const booking of upcomingReturns) {
    db.prepare(`
      INSERT INTO notifications (id, booking_id, type, title, message, scheduled_for)
      VALUES (?, ?, 'reminder_return', 'Напоминание о возврате', ?, ?)
    `).run(
      uuidv4(),
      booking.id,
      `Доска "${booking.board_name}" должна быть возвращена ${booking.end_date}. Клиент: ${booking.client_name}`,
      booking.end_date
    );
  }
}

function checkOverdueBookings() {
  const db = getDb();
  const now = new Date().toISOString();
  
  // Находим просроченные бронирования
  const overdueBookings = db.prepare(`
    SELECT b.*, 
           c.first_name || ' ' || COALESCE(c.last_name, '') as client_name,
           c.phone as client_phone,
           br.name as board_name
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    JOIN boards br ON b.board_id = br.id
    WHERE b.status IN ('confirmed', 'active')
    AND b.end_date < ?
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.booking_id = b.id 
      AND n.type = 'overdue'
      AND n.created_at > datetime('now', '-1 hour')
    )
  `).all(now) as any[];

  for (const booking of overdueBookings) {
    // Обновляем статус на "overdue"
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('overdue', booking.id);
    
    // Рассчитываем штраф за просрочку
    const overdueDate = new Date(booking.end_date);
    const currentDate = new Date();
    const overdueHours = Math.ceil((currentDate.getTime() - overdueDate.getTime()) / (1000 * 60 * 60));
    
    let lateFee = 0;
    if (booking.booking_type === 'hourly') {
      const hourlyFee = db.prepare("SELECT value FROM settings WHERE key = 'late_fee_hourly'").get() as { value: string };
      lateFee = overdueHours * parseInt(hourlyFee?.value || '500');
    } else {
      const overdueDays = Math.ceil(overdueHours / 24);
      const dailyFee = db.prepare("SELECT value FROM settings WHERE key = 'late_fee_daily'").get() as { value: string };
      lateFee = overdueDays * parseInt(dailyFee?.value || '1000');
    }
    
    // Обновляем штраф
    db.prepare('UPDATE bookings SET late_fee = ? WHERE id = ?').run(lateFee, booking.id);

    db.prepare(`
      INSERT INTO notifications (id, booking_id, type, title, message, scheduled_for)
      VALUES (?, ?, 'overdue', 'Просроченная аренда', ?, ?)
    `).run(
      uuidv4(),
      booking.id,
      `Просрочка возврата доски "${booking.board_name}". Клиент: ${booking.client_name}. Штраф: ${lateFee} ₽`,
      now
    );
  }
}

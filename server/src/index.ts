import express from 'express';
import cors from 'cors';
import path from 'path';
import { getDb } from './db/database';
import boardsRouter from './routes/boards';
import clientsRouter from './routes/clients';
import bookingsRouter from './routes/bookings';
import salesRouter from './routes/sales';
import notificationsRouter from './routes/notifications';
import statisticsRouter from './routes/statistics';
import settingsRouter from './routes/settings';
import { startNotificationScheduler } from './services/notificationScheduler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Инициализация базы данных
getDb();

// Маршруты API
app.use('/api/boards', boardsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/settings', settingsRouter);

// Обслуживание статических файлов клиента в продакшне
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Обработка ошибок
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Ошибка:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`\n🏄 SUP-TIME CRM сервер запущен`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`\nДоступные маршруты:`);
  console.log(`  GET    /api/boards`);
  console.log(`  GET    /api/clients`);
  console.log(`  GET    /api/bookings`);
  console.log(`  GET    /api/sales`);
  console.log(`  GET    /api/notifications`);
  console.log(`  GET    /api/statistics/dashboard`);
  console.log(`  GET    /api/settings`);
  console.log(`\nНажмите Ctrl+C для остановки\n`);
});

// Запуск планировщика уведомлений
startNotificationScheduler();

export default app;

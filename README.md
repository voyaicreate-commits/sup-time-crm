# SUP-TIME CRM

CRM система для магазина SUP досок

## Быстрый старт

### 1. Установка зависимостей

```bash
# Установить все зависимости
npm run install:all
```

### 2. Запуск в режиме разработки

```bash
# Запустить сервер и клиент одновременно
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api

### 3. Инициализация базы данных

База данных автоматически создается при первом запуске сервера.

Для сброса базы данных:
```bash
npm run db:reset
```

## Структура проекта

```
sup-time-crm/
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/              # API клиент
│   │   ├── components/       # Переиспользуемые компоненты
│   │   ├── pages/            # Страницы приложения
│   │   ├── types/            # TypeScript типы
│   │   ├── App.tsx           # Корневой компонент
│   │   └── main.tsx          # Точка входа
│   └── package.json
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── db/               # База данных
│   │   ├── routes/           # API маршруты
│   │   ├── services/         # Бизнес-логика
│   │   ├── types/            # TypeScript типы
│   │   └── index.ts          # Точка входа сервера
│   └── package.json
└── package.json               # Корневой package.json
```

## API Endpoints

### Доски
- `GET /api/boards` - Список досок
- `GET /api/boards/:id` - Доска по ID
- `POST /api/boards` - Создать доску
- `PUT /api/boards/:id` - Обновить доску
- `DELETE /api/boards/:id` - Удалить доску

### Клиенты
- `GET /api/clients` - Список клиентов
- `GET /api/clients/:id` - Клиент по ID
- `POST /api/clients` - Создать клиента
- `PUT /api/clients/:id` - Обновить клиента
- `DELETE /api/clients/:id` - Удалить клиента
- `GET /api/clients/:id/history` - История клиента

### Бронирования
- `GET /api/bookings` - Список бронирований
- `GET /api/bookings/:id` - Бронирование по ID
- `POST /api/bookings` - Создать бронирование
- `PUT /api/bookings/:id` - Обновить бронирование
- `DELETE /api/bookings/:id` - Удалить бронирование

### Продажи
- `GET /api/sales` - Список продаж
- `POST /api/sales` - Оформить продажу
- `DELETE /api/sales/:id` - Отменить продажу

### Уведомления
- `GET /api/notifications` - Список уведомлений
- `PUT /api/notifications/:id/read` - Отметить как прочитанное
- `PUT /api/notifications/read-all` - Прочитать все

### Статистика
- `GET /api/statistics/dashboard` - Данные дашборда
- `GET /api/statistics/revenue` - Выручка по периодам
- `GET /api/statistics/utilization` - Утилизация досок
- `GET /api/statistics/popular` - Популярные доски

### Настройки
- `GET /api/settings` - Все настройки
- `PUT /api/settings` - Обновить настройки

## Технологии

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **База данных**: SQLite (better-sqlite3)
- **Иконки**: Lucide React
- **Уведомления**: React Hot Toast

## Лицензия

MIT

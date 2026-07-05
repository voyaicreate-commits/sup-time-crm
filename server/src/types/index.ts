// Типы для досок
export interface Board {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  type: BoardType;
  length_cm?: number;
  width_cm?: number;
  volume_liters?: number;
  max_weight_kg?: number;
  purchase_price?: number;
  sale_price?: number;
  rental_price_daily: number;
  rental_price_hourly: number;
  status: BoardStatus;
  image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type BoardType = 'all_around' | 'touring' | 'race' | 'inflatable' | 'hardboard' | 'kids' | 'fishing' | 'yoga';
export type BoardStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'reserved';

// Типы для клиентов
export interface Client {
  id: string;
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
  birth_date?: string;
  notes?: string;
  total_purchases: number;
  total_rentals: number;
  total_spent: number;
  loyalty_level: LoyaltyLevel;
  created_at: string;
  updated_at: string;
}

export type LoyaltyLevel = 'basic' | 'silver' | 'gold' | 'vip';

// Типы для бронирований
export interface Booking {
  id: string;
  client_id: string;
  board_id: string;
  booking_type: BookingType;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  actual_return_date?: string;
  total_price: number;
  deposit_amount: number;
  deposit_returned: number;
  late_fee: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  client_name?: string;
  client_phone?: string;
  board_name?: string;
  board_type?: string;
}

export type BookingType = 'daily' | 'hourly';
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'overdue';

// Типы для продаж
export interface Sale {
  id: string;
  client_id?: string;
  board_id: string;
  sale_price: number;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  // Joined fields
  client_name?: string;
  board_name?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed';

// Типы для уведомлений
export interface Notification {
  id: string;
  booking_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: number;
  scheduled_for?: string;
  created_at: string;
}

export type NotificationType = 'reminder_return' | 'overdue' | 'booking_confirmed' | 'payment_received' | 'maintenance_due' | 'custom';

// Типы для настроек
export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// Типы для статистики
export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  activeRentals: number;
  rentalsChange: number;
  totalClients: number;
  clientsChange: number;
  boardsAvailable: number;
  boardsTotal: number;
}

export interface RevenueByPeriod {
  date: string;
  revenue: number;
  bookings: number;
  sales: number;
}

export interface BoardUtilization {
  board_id: string;
  board_name: string;
  total_days: number;
  rented_days: number;
  utilization_percent: number;
}

export interface PopularBoard {
  board_id: string;
  board_name: string;
  rental_count: number;
  sale_count: number;
  total_revenue: number;
}

// Типы для API запросов
export interface CreateBookingRequest {
  client_id: string;
  board_id: string;
  booking_type: BookingType;
  start_date: string;
  end_date: string;
  deposit_amount?: number;
  notes?: string;
}

export interface UpdateBookingRequest {
  status?: BookingStatus;
  actual_return_date?: string;
  late_fee?: number;
  notes?: string;
}

export interface CreateClientRequest {
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
  birth_date?: string;
  notes?: string;
}

export interface CreateBoardRequest {
  name: string;
  brand?: string;
  model?: string;
  type: BoardType;
  length_cm?: number;
  width_cm?: number;
  volume_liters?: number;
  max_weight_kg?: number;
  purchase_price?: number;
  sale_price?: number;
  rental_price_daily: number;
  rental_price_hourly: number;
  image_url?: string;
  notes?: string;
}

export interface CreateSaleRequest {
  client_id?: string;
  board_id: string;
  sale_price: number;
  payment_method: PaymentMethod;
  notes?: string;
}

// Типы для пагинации
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Типы для фильтров
export interface BookingFilters {
  status?: BookingStatus;
  booking_type?: BookingType;
  client_id?: string;
  board_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface ClientFilters {
  search?: string;
  loyalty_level?: LoyaltyLevel;
}

export interface BoardFilters {
  type?: BoardType;
  status?: BoardStatus;
  search?: string;
}

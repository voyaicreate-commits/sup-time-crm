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
  client_name?: string;
  client_phone?: string;
  board_name?: string;
  board_type?: string;
}

export type BookingType = 'daily' | 'hourly';
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'overdue';

export interface Sale {
  id: string;
  client_id?: string;
  board_id: string;
  sale_price: number;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  client_name?: string;
  board_name?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed';

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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Settings {
  shop_name: string;
  shop_phone: string;
  shop_address: string;
  working_hours: string;
  currency: string;
  deposit_percent: string;
  late_fee_hourly: string;
  late_fee_daily: string;
  notification_advance_hours: string;
}

import { useEffect, useState } from 'react';
import { bookingsApi } from '../api';
import { Booking, BookingStatus, BookingType, PaginatedResponse } from '../types';
import { Plus, Search, Edit2, Trash2, Eye, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import BookingModal from '../components/BookingModal';

const statusLabels: Record<BookingStatus, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  active: 'Активно',
  completed: 'Завершено',
  cancelled: 'Отменено',
  overdue: 'Просрочено',
};

const statusColors: Record<BookingStatus, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  active: 'badge-success',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'badge-danger',
  overdue: 'badge-danger',
};

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<BookingType | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadBookings();
  }, [page, statusFilter, typeFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.booking_type = typeFilter;
      
      const response = await bookingsApi.getAll(params);
      setBookings(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Ошибка загрузки бронирований');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Отменить бронирование?')) return;
    
    try {
      await bookingsApi.delete(id);
      toast.success('Бронирование отменено');
      loadBookings();
    } catch (error) {
      toast.error('Ошибка отмены');
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingBooking(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
  };

  const handleModalSave = () => {
    handleModalClose();
    loadBookings();
  };

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    try {
      await bookingsApi.update(id, { status });
      toast.success('Статус обновлен');
      loadBookings();
    } catch (error) {
      toast.error('Ошибка обновления статуса');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Бронирования</h1>
          <p className="text-gray-600">Управление арендами</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Новое бронирование
        </button>
      </div>

      {/* Фильтры */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
            className="input-field w-auto"
          >
            <option value="">Все статусы</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as BookingType | '')}
            className="input-field w-auto"
          >
            <option value="">Все типы</option>
            <option value="daily">Посуточная</option>
            <option value="hourly">Почасовая</option>
          </select>
        </div>
      </div>

      {/* Таблица */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Клиент</th>
                <th className="px-6 py-3">Доска</th>
                <th className="px-6 py-3">Дата</th>
                <th className="px-6 py-3">Тип</th>
                <th className="px-6 py-3">Сумма</th>
                <th className="px-6 py-3">Статус</th>
                <th className="px-6 py-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Загрузка...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Бронирования не найдены
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium">{booking.client_name}</p>
                        <p className="text-sm text-gray-500">{booking.client_phone}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium">{booking.board_name}</p>
                        <p className="text-sm text-gray-500">{booking.board_type}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <p>{new Date(booking.start_date).toLocaleDateString('ru-RU')}</p>
                        <p className="text-gray-500">до {new Date(booking.end_date).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {booking.booking_type === 'daily' ? (
                          <Calendar className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        <span>{booking.booking_type === 'daily' ? 'Посуточно' : 'Почасово'}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium">{booking.total_price.toLocaleString('ru-RU')} ₽</p>
                        {booking.deposit_amount > 0 && (
                          <p className="text-xs text-gray-500">Залог: {booking.deposit_amount} ₽</p>
                        )}
                        {booking.late_fee > 0 && (
                          <p className="text-xs text-red-600">Штраф: {booking.late_fee} ₽</p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id, e.target.value as BookingStatus)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${statusColors[booking.status]}`}
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(booking)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Отменить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Пагинация */}
        {total > 10 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Показано {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} из {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 10 >= total}
                className="btn-secondary disabled:opacity-50"
              >
                Далее
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <BookingModal
          booking={editingBooking}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}

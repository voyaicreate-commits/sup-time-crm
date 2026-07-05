import { useEffect, useState } from 'react';
import { clientsApi } from '../api';
import { Client, Booking, Sale } from '../types';
import { X, Phone, Mail, Calendar, Sailboat, ShoppingCart } from 'lucide-react';

interface ClientDetailsProps {
  client: Client;
  onClose: () => void;
}

export default function ClientDetails({ client, onClose }: ClientDetailsProps) {
  const [history, setHistory] = useState<{ bookings: Booking[]; sales: Sale[] }>({ bookings: [], sales: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [client.id]);

  const loadHistory = async () => {
    try {
      const response = await clientsApi.getHistory(client.id);
      setHistory({
        bookings: response.data.bookings,
        sales: response.data.sales,
      });
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    confirmed: 'Подтверждено',
    active: 'Активно',
    completed: 'Завершено',
    cancelled: 'Отменено',
    overdue: 'Просрочено',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    overdue: 'bg-red-100 text-red-800',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {client.first_name} {client.last_name}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Информация о клиенте */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{client.phone}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.birth_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>{new Date(client.birth_date).toLocaleDateString('ru-RU')}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Уровень лояльности</p>
                <p className="font-medium">{client.loyalty_level.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Общая сумма покупок</p>
                <p className="font-medium">{client.total_spent.toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </div>

          {/* История */}
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <div className="space-y-6">
              {/* Бронирования */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sailboat className="w-5 h-5" />
                  Аренды ({history.bookings.length})
                </h3>
                {history.bookings.length > 0 ? (
                  <div className="space-y-3">
                    {history.bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{booking.board_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.start_date).toLocaleDateString('ru-RU')} - {new Date(booking.end_date).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`badge ${statusColors[booking.status]}`}>
                            {statusLabels[booking.status]}
                          </span>
                          <p className="text-sm font-medium mt-1">{booking.total_price} ₽</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Нет аренд</p>
                )}
              </div>

              {/* Продажи */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Покупки ({history.sales.length})
                </h3>
                {history.sales.length > 0 ? (
                  <div className="space-y-3">
                    {history.sales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{sale.board_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(sale.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{sale.sale_price.toLocaleString('ru-RU')} ₽</p>
                          <p className="text-xs text-gray-500">
                            {sale.payment_method === 'cash' ? 'Наличные' :
                             sale.payment_method === 'card' ? 'Карта' :
                             sale.payment_method === 'transfer' ? 'Перевод' : 'Смешанный'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Нет покупок</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { bookingsApi, boardsApi, clientsApi } from '../api';
import { Booking, Board, Client, BookingType } from '../types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingModalProps {
  booking: Booking | null;
  onClose: () => void;
  onSave: () => void;
}

export default function BookingModal({ booking, onClose, onSave }: BookingModalProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    board_id: '',
    booking_type: 'daily' as BookingType,
    start_date: '',
    end_date: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (booking) {
      setFormData({
        client_id: booking.client_id,
        board_id: booking.board_id,
        booking_type: booking.booking_type,
        start_date: booking.start_date,
        end_date: booking.end_date,
        notes: booking.notes || '',
      });
    }
  }, [booking]);

  useEffect(() => {
    if (formData.board_id) {
      const board = boards.find(b => b.id === formData.board_id);
      setSelectedBoard(board || null);
    }
  }, [formData.board_id, boards]);

  const loadData = async () => {
    try {
      const [boardsRes, clientsRes] = await Promise.all([
        boardsApi.getAll({ status: 'available', limit: '100' }),
        clientsApi.getAll({ limit: '100' }),
      ]);
      setBoards(boardsRes.data.data);
      setClients(clientsRes.data.data);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    }
  };

  const calculatePrice = () => {
    if (!selectedBoard || !formData.start_date || !formData.end_date) return 0;

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);

    if (formData.booking_type === 'daily') {
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return days * selectedBoard.rental_price_daily;
    } else {
      const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      return hours * selectedBoard.rental_price_hourly;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.board_id || !formData.start_date || !formData.end_date) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      setLoading(true);
      
      if (booking) {
        await bookingsApi.update(booking.id, { notes: formData.notes });
        toast.success('Бронирование обновлено');
      } else {
        await bookingsApi.create(formData);
        toast.success('Бронирование создано');
      }
      
      onSave();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const totalPrice = calculatePrice();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {booking ? 'Редактировать бронирование' : 'Новое бронирование'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!booking && (
            <>
              <div>
                <label className="label">Клиент *</label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Выберите клиента</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} - {client.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Доска *</label>
                <select
                  name="board_id"
                  value={formData.board_id}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Выберите доску</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name} ({board.rental_price_daily} ₽/день, {board.rental_price_hourly} ₽/час)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Тип аренды *</label>
                <select
                  name="booking_type"
                  value={formData.booking_type}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="daily">Посуточная</option>
                  <option value="hourly">Почасовая</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Начало *</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Конец *</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {totalPrice > 0 && (
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-gray-600">Итого:</p>
                  <p className="text-2xl font-bold text-primary-600">{totalPrice.toLocaleString('ru-RU')} ₽</p>
                </div>
              )}
            </>
          )}

          <div>
            <label className="label">Примечание</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

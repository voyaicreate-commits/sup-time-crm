import { useState, useEffect } from 'react';
import { salesApi, boardsApi, clientsApi } from '../api';
import { Board, Client, PaymentMethod } from '../types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SaleModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function SaleModal({ onClose, onSave }: SaleModalProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    board_id: '',
    sale_price: '',
    payment_method: 'cash' as PaymentMethod,
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.board_id) {
      const board = boards.find(b => b.id === formData.board_id);
      setSelectedBoard(board || null);
      if (board?.sale_price) {
        setFormData(prev => ({ ...prev, sale_price: board.sale_price!.toString() }));
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.board_id || !formData.sale_price) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      setLoading(true);
      await salesApi.create({
        ...formData,
        sale_price: parseFloat(formData.sale_price),
        client_id: formData.client_id || undefined,
      });
      toast.success('Продажа оформлена');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Оформить продажу</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  {board.name} {board.brand ? `(${board.brand})` : ''} - {board.sale_price || 'Цена не указана'} ₽
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Клиент</label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Без привязки к клиенту</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name} - {client.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Цена продажи (₽) *</label>
            <input
              type="number"
              name="sale_price"
              value={formData.sale_price}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="label">Способ оплаты *</label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="cash">Наличные</option>
              <option value="card">Карта</option>
              <option value="transfer">Перевод</option>
              <option value="mixed">Смешанный</option>
            </select>
          </div>

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
              {loading ? 'Оформление...' : 'Оформить продажу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

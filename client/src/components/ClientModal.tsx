import { useState, useEffect } from 'react';
import { clientsApi } from '../api';
import { Client, LoyaltyLevel } from '../types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClientModalProps {
  client: Client | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ClientModal({ client, onClose, onSave }: ClientModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    birth_date: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name,
        last_name: client.last_name || '',
        phone: client.phone,
        email: client.email || '',
        birth_date: client.birth_date || '',
        notes: client.notes || '',
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.phone) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      setLoading(true);
      
      if (client) {
        await clientsApi.update(client.id, formData);
        toast.success('Клиент обновлен');
      } else {
        await clientsApi.create(formData);
        toast.success('Клиент создан');
      }
      
      onSave();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {client ? 'Редактировать клиента' : 'Добавить клиента'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Имя *</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="label">Фамилия</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Телефон *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="+7 (999) 123-45-67"
              required
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Дата рождения</label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              className="input-field"
            />
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
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

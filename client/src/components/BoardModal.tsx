import { useState, useEffect } from 'react';
import { boardsApi } from '../api';
import { Board, BoardType } from '../types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface BoardModalProps {
  board: Board | null;
  onClose: () => void;
  onSave: () => void;
}

const boardTypes: { value: BoardType; label: string }[] = [
  { value: 'all_around', label: 'Универсальная' },
  { value: 'touring', label: 'Туринг' },
  { value: 'race', label: 'Гоночная' },
  { value: 'inflatable', label: 'Надувная' },
  { value: 'hardboard', label: 'Жесткая' },
  { value: 'kids', label: 'Детская' },
  { value: 'fishing', label: 'Для рыбалки' },
  { value: 'yoga', label: 'Для йоги' },
];

export default function BoardModal({ board, onClose, onSave }: BoardModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    type: 'all_around' as BoardType,
    length_cm: '',
    width_cm: '',
    volume_liters: '',
    max_weight_kg: '',
    purchase_price: '',
    sale_price: '',
    rental_price_daily: '',
    rental_price_hourly: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (board) {
      setFormData({
        name: board.name,
        brand: board.brand || '',
        model: board.model || '',
        type: board.type,
        length_cm: board.length_cm?.toString() || '',
        width_cm: board.width_cm?.toString() || '',
        volume_liters: board.volume_liters?.toString() || '',
        max_weight_kg: board.max_weight_kg?.toString() || '',
        purchase_price: board.purchase_price?.toString() || '',
        sale_price: board.sale_price?.toString() || '',
        rental_price_daily: board.rental_price_daily.toString(),
        rental_price_hourly: board.rental_price_hourly.toString(),
        notes: board.notes || '',
      });
    }
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.rental_price_daily || !formData.rental_price_hourly) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...formData,
        length_cm: formData.length_cm ? parseInt(formData.length_cm) : undefined,
        width_cm: formData.width_cm ? parseInt(formData.width_cm) : undefined,
        volume_liters: formData.volume_liters ? parseInt(formData.volume_liters) : undefined,
        max_weight_kg: formData.max_weight_kg ? parseInt(formData.max_weight_kg) : undefined,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : undefined,
        rental_price_daily: parseFloat(formData.rental_price_daily),
        rental_price_hourly: parseFloat(formData.rental_price_hourly),
      };

      if (board) {
        await boardsApi.update(board.id, data);
        toast.success('Доска обновлена');
      } else {
        await boardsApi.create(data);
        toast.success('Доска создана');
      }
      
      onSave();
    } catch (error) {
      toast.error('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {board ? 'Редактировать доску' : 'Добавить доску'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Основная информация */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Основная информация</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Название *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Бренд</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Модель</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Тип</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input-field"
                >
                  {boardTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Характеристики */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Характеристики</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Длина (см)</label>
                <input
                  type="number"
                  name="length_cm"
                  value={formData.length_cm}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Ширина (см)</label>
                <input
                  type="number"
                  name="width_cm"
                  value={formData.width_cm}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Объем (л)</label>
                <input
                  type="number"
                  name="volume_liters"
                  value={formData.volume_liters}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Макс. вес (кг)</label>
                <input
                  type="number"
                  name="max_weight_kg"
                  value={formData.max_weight_kg}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Цены */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Цены</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Закупочная цена (₽)</label>
                <input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Цена продажи (₽)</label>
                <input
                  type="number"
                  name="sale_price"
                  value={formData.sale_price}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Аренда в день (₽) *</label>
                <input
                  type="number"
                  name="rental_price_daily"
                  value={formData.rental_price_daily}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Аренда в час (₽) *</label>
                <input
                  type="number"
                  name="rental_price_hourly"
                  value={formData.rental_price_hourly}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Примечание */}
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

          {/* Кнопки */}
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

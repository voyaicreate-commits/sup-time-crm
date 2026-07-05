import { useEffect, useState } from 'react';
import { salesApi } from '../api';
import { Sale, PaginatedResponse } from '../types';
import { Plus, Search, Trash2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import SaleModal from '../components/SaleModal';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadSales();
  }, [page]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getAll({ page, limit: 10 });
      setSales(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Ошибка загрузки продаж');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Отменить продажу? Доска будет возвращена в каталог.')) return;
    
    try {
      await salesApi.delete(id);
      toast.success('Продажа отменена');
      loadSales();
    } catch (error) {
      toast.error('Ошибка отмены');
    }
  };

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalSave = () => {
    handleModalClose();
    loadSales();
  };

  const paymentLabels: Record<string, string> = {
    cash: 'Наличные',
    card: 'Карта',
    transfer: 'Перевод',
    mixed: 'Смешанный',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Продажи</h1>
          <p className="text-gray-600">Журнал продаж досок</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Оформить продажу
        </button>
      </div>

      {/* Таблица */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Дата</th>
                <th className="px-6 py-3">Доска</th>
                <th className="px-6 py-3">Клиент</th>
                <th className="px-6 py-3">Сумма</th>
                <th className="px-6 py-3">Оплата</th>
                <th className="px-6 py-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Загрузка...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Продаж пока нет</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      {new Date(sale.created_at).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="table-cell">
                      <p className="font-medium">{sale.board_name}</p>
                    </td>
                    <td className="table-cell">
                      {sale.client_name || '—'}
                    </td>
                    <td className="table-cell">
                      <p className="font-medium text-green-600">
                        {sale.sale_price.toLocaleString('ru-RU')} ₽
                      </p>
                    </td>
                    <td className="table-cell">
                      <span className="badge bg-gray-100 text-gray-800">
                        {paymentLabels[sale.payment_method]}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Отменить продажу"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        <SaleModal
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}

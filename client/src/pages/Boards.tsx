import { useEffect, useState } from 'react';
import { boardsApi } from '../api';
import { Board, BoardType, BoardStatus, PaginatedResponse } from '../types';
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import BoardModal from '../components/BoardModal';

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

const statusLabels: Record<BoardStatus, string> = {
  available: 'Доступна',
  rented: 'В аренде',
  maintenance: 'Обслуживание',
  sold: 'Продана',
  reserved: 'Забронирована',
};

const statusColors: Record<BoardStatus, string> = {
  available: 'badge-success',
  rented: 'badge-info',
  maintenance: 'badge-warning',
  sold: 'badge-danger',
  reserved: 'badge-info',
};

export default function Boards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BoardType | ''>('');
  const [statusFilter, setStatusFilter] = useState<BoardStatus | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);

  useEffect(() => {
    loadBoards();
  }, [page, typeFilter, statusFilter]);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      
      const response = await boardsApi.getAll(params);
      setBoards(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Ошибка загрузки досок');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadBoards();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить доску?')) return;
    
    try {
      await boardsApi.delete(id);
      toast.success('Доска удалена');
      loadBoards();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingBoard(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingBoard(null);
  };

  const handleModalSave = () => {
    handleModalClose();
    loadBoards();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Доски</h1>
          <p className="text-gray-600">Каталог SUP досок</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Добавить доску
        </button>
      </div>

      {/* Фильтры */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as BoardType | '')}
            className="input-field w-auto"
          >
            <option value="">Все типы</option>
            {boardTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BoardStatus | '')}
            className="input-field w-auto"
          >
            <option value="">Все статусы</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Таблица */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Название</th>
                <th className="px-6 py-3">Тип</th>
                <th className="px-6 py-3">Размер</th>
                <th className="px-6 py-3">Цена аренды</th>
                <th className="px-6 py-3">Статус</th>
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
              ) : boards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Доски не найдены
                  </td>
                </tr>
              ) : (
                boards.map((board) => (
                  <tr key={board.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium">{board.name}</p>
                        <p className="text-sm text-gray-500">{board.brand} {board.model}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      {boardTypes.find(t => t.value === board.type)?.label}
                    </td>
                    <td className="table-cell">
                      {board.length_cm && `${board.length_cm}×${board.width_cm} см`}
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <p>{board.rental_price_daily} ₽/день</p>
                        <p className="text-gray-500">{board.rental_price_hourly} ₽/час</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusColors[board.status]}`}>
                        {statusLabels[board.status]}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(board)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(board.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
        <BoardModal
          board={editingBoard}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}

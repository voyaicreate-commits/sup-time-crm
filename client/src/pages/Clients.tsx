import { useEffect, useState } from 'react';
import { clientsApi } from '../api';
import { Client, LoyaltyLevel, PaginatedResponse } from '../types';
import { Plus, Search, Edit2, Trash2, Eye, Phone, Mail, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import ClientModal from '../components/ClientModal';
import ClientDetails from '../components/ClientDetails';

const loyaltyLabels: Record<LoyaltyLevel, string> = {
  basic: 'Базовый',
  silver: 'Серебряный',
  gold: 'Золотой',
  vip: 'VIP',
};

const loyaltyColors: Record<LoyaltyLevel, string> = {
  basic: 'bg-gray-100 text-gray-800',
  silver: 'bg-gray-200 text-gray-800',
  gold: 'bg-yellow-100 text-yellow-800',
  vip: 'bg-purple-100 text-purple-800',
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loyaltyFilter, setLoyaltyFilter] = useState<LoyaltyLevel | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, [page, loyaltyFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (loyaltyFilter) params.loyalty_level = loyaltyFilter;
      if (search) params.search = search;
      
      const response = await clientsApi.getAll(params);
      setClients(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Ошибка загрузки клиентов');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadClients();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить клиента?')) return;
    
    try {
      await clientsApi.delete(id);
      toast.success('Клиент удален');
      loadClients();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleModalSave = () => {
    handleModalClose();
    loadClients();
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-gray-600">База клиентов магазина</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Добавить клиента
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
                placeholder="Поиск по имени, телефону или email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={loyaltyFilter}
            onChange={(e) => setLoyaltyFilter(e.target.value as LoyaltyLevel | '')}
            className="input-field w-auto"
          >
            <option value="">Все уровни</option>
            {Object.entries(loyaltyLabels).map(([value, label]) => (
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
                <th className="px-6 py-3">Клиент</th>
                <th className="px-6 py-3">Контакты</th>
                <th className="px-6 py-3">Статистика</th>
                <th className="px-6 py-3">Уровень</th>
                <th className="px-6 py-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Загрузка...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Клиенты не найдены
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium">
                          {client.first_name} {client.last_name}
                        </p>
                        {client.birth_date && (
                          <p className="text-sm text-gray-500">
                            {new Date(client.birth_date).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {client.phone}
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <p>{client.total_rentals} аренд</p>
                        <p>{client.total_purchases} покупок</p>
                        <p className="font-medium">{client.total_spent.toLocaleString('ru-RU')} ₽</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${loyaltyColors[client.loyalty_level]}`}>
                        {loyaltyLabels[client.loyalty_level]}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(client)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Удалить"
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

      {/* Модальное окно редактирования */}
      {isModalOpen && (
        <ClientModal
          client={editingClient}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      {/* Детали клиента */}
      {selectedClient && (
        <ClientDetails
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}

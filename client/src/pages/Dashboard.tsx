import { useEffect, useState } from 'react';
import { statisticsApi } from '../api';
import { DashboardStats, RevenueByPeriod, PopularBoard } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Sailboat, 
  Users, 
  DollarSign,
  Activity
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueByPeriod[]>([]);
  const [popular, setPopular] = useState<PopularBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, revenueRes, popularRes] = await Promise.all([
        statisticsApi.getDashboard(),
        statisticsApi.getRevenue({ days: '30' }),
        statisticsApi.getPopular({ limit: '5' }),
      ]);
      setStats(statsRes.data);
      setRevenue(revenueRes.data);
      setPopular(popularRes.data);
    } catch (error) {
      console.error('Ошибка загрузки дашборда:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Выручка',
      value: `${(stats?.totalRevenue || 0).toLocaleString('ru-RU')} ₽`,
      change: stats?.revenueChange || 0,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Активные аренды',
      value: stats?.activeRentals || 0,
      change: stats?.rentalsChange || 0,
      icon: Activity,
      color: 'bg-blue-500',
    },
    {
      title: 'Клиенты',
      value: stats?.totalClients || 0,
      change: stats?.clientsChange || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: 'Доски доступны',
      value: `${stats?.boardsAvailable || 0} из ${stats?.boardsTotal || 0}`,
      change: 0,
      icon: Sailboat,
      color: 'bg-ocean-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Главная</h1>
        <p className="text-gray-600">Обзор магазина SUP-TIME</p>
      </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  {card.change !== 0 && (
                    <div className={`flex items-center mt-2 text-sm ${card.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {card.change > 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      <span>{Math.abs(card.change).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* График выручки и популярные доски */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Выручка */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Выручка за 30 дней</h2>
          <div className="h-64">
            {revenue.length > 0 ? (
              <div className="flex items-end justify-between h-full gap-1">
                {revenue.slice(-14).map((item, index) => {
                  const maxRevenue = Math.max(...revenue.map(r => r.revenue));
                  const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-primary-500 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-gray-500 mt-2">
                        {new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Нет данных
              </div>
            )}
          </div>
        </div>

        {/* Популярные доски */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Популярные доски</h2>
          {popular.length > 0 ? (
            <div className="space-y-4">
              {popular.map((item, index) => (
                <div key={item.board_id} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.board_name}</p>
                    <p className="text-sm text-gray-500">
                      {item.rental_count} аренд · {item.sale_count} продаж
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{item.total_revenue.toLocaleString('ru-RU')} ₽</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Пока нет данных
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

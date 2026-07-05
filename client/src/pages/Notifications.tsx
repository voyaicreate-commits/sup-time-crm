import { useEffect, useState } from 'react';
import { notificationsApi } from '../api';
import { Notification } from '../types';
import { Bell, Check, CheckCheck, Trash2, Clock, AlertTriangle, CreditCard, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

const typeIcons: Record<string, React.ReactNode> = {
  reminder_return: <Clock className="w-5 h-5" />,
  overdue: <AlertTriangle className="w-5 h-5" />,
  booking_confirmed: <Check className="w-5 h-5" />,
  payment_received: <CreditCard className="w-5 h-5" />,
  maintenance_due: <Wrench className="w-5 h-5" />,
  custom: <Bell className="w-5 h-5" />,
};

const typeColors: Record<string, string> = {
  reminder_return: 'text-blue-500 bg-blue-100',
  overdue: 'text-red-500 bg-red-100',
  booking_confirmed: 'text-green-500 bg-green-100',
  payment_received: 'text-purple-500 bg-purple-100',
  maintenance_due: 'text-yellow-500 bg-yellow-100',
  custom: 'text-gray-500 bg-gray-100',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [showUnreadOnly]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getAll({ unread_only: showUnreadOnly });
      setNotifications(response.data.data);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      toast.error('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: 1 } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      toast.success('Все уведомления прочитаны');
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(notifications.filter(n => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитано'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`btn-secondary ${showUnreadOnly ? 'bg-primary-100 text-primary-700' : ''}`}
          >
            {showUnreadOnly ? 'Показать все' : 'Только непрочитанные'}
          </button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="btn-secondary flex items-center gap-2">
              <CheckCheck className="w-4 h-4" />
              Прочитать все
            </button>
          )}
        </div>
      </div>

      {/* Список уведомлений */}
      <div className="space-y-3">
        {loading ? (
          <div className="card text-center py-12">Загрузка...</div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-12">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Нет уведомлений</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card flex items-start gap-4 ${
                !notification.is_read ? 'border-l-4 border-primary-500' : ''
              }`}
            >
              <div className={`p-2 rounded-lg ${typeColors[notification.type]}`}>
                {typeIcons[notification.type]}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notification.title}
                  </h3>
                  {!notification.is_read && (
                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notification.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {!notification.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                    title="Отметить как прочитанное"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

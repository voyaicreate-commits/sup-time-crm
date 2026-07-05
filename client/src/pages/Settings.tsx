import { useEffect, useState } from 'react';
import { settingsApi } from '../api';
import { Settings as SettingsType } from '../types';
import { Save, Store, CreditCard, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType>({
    shop_name: '',
    shop_phone: '',
    shop_address: '',
    working_hours: '',
    currency: 'RUB',
    deposit_percent: '30',
    late_fee_hourly: '500',
    late_fee_daily: '1000',
    notification_advance_hours: '2',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.getAll();
      setSettings(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await settingsApi.update(settings);
      toast.success('Настройки сохранены');
    } catch (error) {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-600">Параметры магазина SUP-TIME</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основные настройки */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Основные</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Название магазина</label>
              <input
                type="text"
                name="shop_name"
                value={settings.shop_name}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Телефон</label>
              <input
                type="tel"
                name="shop_phone"
                value={settings.shop_phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Адрес</label>
              <input
                type="text"
                name="shop_address"
                value={settings.shop_address}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Часы работы</label>
              <input
                type="text"
                name="working_hours"
                value={settings.working_hours}
                onChange={handleChange}
                className="input-field"
                placeholder="09:00-21:00"
              />
            </div>
            <div>
              <label className="label">Валюта</label>
              <input
                type="text"
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="input-field"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Финансы */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Финансы</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="label">Залог (%)</label>
              <input
                type="number"
                name="deposit_percent"
                value={settings.deposit_percent}
                onChange={handleChange}
                className="input-field"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">Процент от стоимости аренды</p>
            </div>
            <div>
              <label className="label">Штраф за час (₽)</label>
              <input
                type="number"
                name="late_fee_hourly"
                value={settings.late_fee_hourly}
                onChange={handleChange}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">За каждый час просрочки</p>
            </div>
            <div>
              <label className="label">Штраф за день (₽)</label>
              <input
                type="number"
                name="late_fee_daily"
                value={settings.late_fee_daily}
                onChange={handleChange}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">За каждый день просрочки</p>
            </div>
          </div>
        </div>

        {/* Уведомления */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Уведомления</h2>
          </div>
          
          <div>
            <label className="label">Напоминание за (часов)</label>
            <input
              type="number"
              name="notification_advance_hours"
              value={settings.notification_advance_hours}
              onChange={handleChange}
              className="input-field w-48"
              min="1"
              max="48"
            />
            <p className="text-xs text-gray-500 mt-1">За сколько часов до окончания аренды напоминать</p>
          </div>
        </div>

        {/* Кнопка сохранения */}
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      </form>
    </div>
  );
}

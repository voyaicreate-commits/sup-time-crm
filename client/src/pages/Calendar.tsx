import { useEffect, useState } from 'react';
import { bookingsApi } from '../api';
import { Booking } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function Calendar() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, [currentDate]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await bookingsApi.getCalendarPeriod(
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      );
      setBookings(response.data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(booking => {
      const start = booking.start_date.split('T')[0];
      const end = booking.end_date.split('T')[0];
      return start <= dateStr && end >= dateStr;
    });
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: startingDay }, (_, i) => i);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const statusColors: Record<string, string> = {
    confirmed: 'bg-blue-500',
    active: 'bg-green-500',
    pending: 'bg-yellow-500',
    overdue: 'bg-red-500',
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Календарь</h1>
        <p className="text-gray-600">Расписание бронирований</p>
      </div>

      <div className="card">
        {/* Навигация */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 mb-px">
          {dayNames.map(day => (
            <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Календарь */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {blankDays.map((_, i) => (
            <div key={`blank-${i}`} className="bg-white p-3 min-h-[100px]" />
          ))}
          
          {days.map(day => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayBookings = getBookingsForDate(date);
            
            return (
              <div
                key={day}
                className={`bg-white p-3 min-h-[100px] cursor-pointer hover:bg-gray-50 ${isToday(day) ? 'bg-primary-50' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <div className={`text-sm font-medium mb-2 ${isToday(day) ? 'text-primary-600' : 'text-gray-900'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map(booking => (
                    <div
                      key={booking.id}
                      className={`text-xs text-white px-2 py-1 rounded ${statusColors[booking.status] || 'bg-gray-400'}`}
                      title={`${booking.client_name} - ${booking.board_name}`}
                    >
                      {booking.client_name}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayBookings.length - 3} ещё
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Детали выбранной даты */}
      {selectedDate && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <CalendarIcon className="w-5 h-5 inline mr-2" />
            {selectedDate.toLocaleDateString('ru-RU', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          {getBookingsForDate(selectedDate).length > 0 ? (
            <div className="space-y-3">
              {getBookingsForDate(selectedDate).map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{booking.client_name}</p>
                    <p className="text-sm text-gray-500">{booking.board_name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.start_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(booking.end_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${booking.status === 'active' ? 'badge-success' : booking.status === 'confirmed' ? 'badge-info' : 'badge-warning'}`}>
                      {booking.status === 'active' ? 'Активно' : 
                       booking.status === 'confirmed' ? 'Подтверждено' : 
                       booking.status === 'pending' ? 'Ожидает' : booking.status}
                    </span>
                    <p className="text-sm font-medium mt-1">{booking.total_price} ₽</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Нет бронирований на эту дату</p>
          )}
        </div>
      )}

      {/* Легенда */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Легенда</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-sm text-gray-600">Ожидает</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-sm text-gray-600">Подтверждено</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600">Активно</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-sm text-gray-600">Просрочено</span>
          </div>
        </div>
      </div>
    </div>
  );
}

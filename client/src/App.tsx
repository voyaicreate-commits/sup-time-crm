import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Boards from './pages/Boards';
import Clients from './pages/Clients';
import Bookings from './pages/Bookings';
import Calendar from './pages/Calendar';
import Sales from './pages/Sales';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/boards" element={<Boards />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;

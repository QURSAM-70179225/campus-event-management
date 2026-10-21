import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetails />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

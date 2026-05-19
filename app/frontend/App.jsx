import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

// Auth guard — checks for JWT token and role
function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('safesign_token');
  const storedUser = localStorage.getItem('safesign_user');
  
  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(storedUser);
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to their respective dashboard if they try to access the wrong one
    return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

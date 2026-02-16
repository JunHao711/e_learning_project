import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  // get access token from LocalStorage
  const token = localStorage.getItem('access_token');

  if (!token) {
    // if token doesn't exist, kick back to login page
    return <Navigate to="/login" replace />;
  }
  return children;
}
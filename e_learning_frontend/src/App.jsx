import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import CourseCreate from './pages/CourseCreate';
import CourseBuilder from './pages/CourseBuilder';
import Profile from './pages/Profile';
import UserSearch from './pages/UserSearch';
import CourseStudents from './pages/CourseStudents';
import CourseChat from './pages/CourseChat';
import Inbox from './pages/Inbox';
import CourseDetail from './pages/CourseDetail';
import StudentWorkspace from './pages/StudentWorkspace';

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Global navigation */}
      <Navbar />

      {/* Route Views */}
      <main>
        <Routes>
          {/* public route */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* protected route */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><UserSearch /></ProtectedRoute>} />
          <Route path="/courses/create" element={<ProtectedRoute><CourseCreate /></ProtectedRoute>} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path='/courses/:id/edit' element={<ProtectedRoute><CourseBuilder /></ProtectedRoute>} />
          <Route path="/courses/:id/students" element={<ProtectedRoute><CourseStudents /></ProtectedRoute>} />
          <Route path="/courses/:id/chat" element={<ProtectedRoute><CourseChat /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/inbox/:userId" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/student/course/:id" element={<ProtectedRoute><StudentWorkspace /></ProtectedRoute>} />
        </Routes>
      </main>

    </div>
  );
}

export default App;
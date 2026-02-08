import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import UploadVideoPage from './pages/UploadVideoPage';
import MyVideosPage from './pages/MyVideosPage';
import TestGeminiPage from './pages/TestGeminiPage';
import AIPersonalityPage from './pages/AIPersonalityPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminTeachersPage from './pages/AdminTeachersPage';
import AdminPersonalitiesPage from './pages/AdminPersonalitiesPage';
import StudentChatPage from './pages/StudentChatPage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] text-gray-800 font-sans antialiased selection:bg-purple-200 selection:text-purple-900">
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Common / Teacher / Student Dashboard */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher Routes */}
              <Route 
                path="/upload-video" 
                element={
                  <ProtectedRoute>
                    <UploadVideoPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-videos" 
                element={
                  <ProtectedRoute>
                    <MyVideosPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ai-personality" 
                element={
                  <ProtectedRoute>
                    <AIPersonalityPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/test-gemini" 
                element={
                  <ProtectedRoute>
                    <TestGeminiPage />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/teachers" 
                element={
                  <ProtectedRoute>
                    <AdminTeachersPage />
                  </ProtectedRoute>
                } 
              />
               <Route 
                path="/admin/personalities" 
                element={
                  <ProtectedRoute>
                    <AdminPersonalitiesPage />
                  </ProtectedRoute>
                } 
              />

              {/* Student Chat Route */}
              <Route 
                path="/student/chat/:personalityId" 
                element={
                  <ProtectedRoute>
                    <StudentChatPage />
                  </ProtectedRoute>
                } 
              />

              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Router>
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
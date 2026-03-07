import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Reports from './pages/Reports';
import MySavings from './pages/MySavings';
import SetupGuide from './components/SetupGuide';

// Check for Supabase keys
const hasSupabaseKeys = true; // Keys are now hardcoded as fallbacks in supabase.ts

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-pink-500/20" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

const AppContent = () => {
  const { theme } = useTheme();
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/members" element={
          <ProtectedRoute>
            <Members />
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
        
        <Route path="/my-savings" element={
          <ProtectedRoute>
            <MySavings />
          </ProtectedRoute>
        } />
        
        <Route path="/setup" element={
          <ProtectedRoute>
            <SetupGuide />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-right" theme={theme} />
    </>
  );
};

export default function App() {
  if (!hasSupabaseKeys) {
    return <SetupGuide />;
  }

  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

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
import Settings from './pages/Settings';
import SetupGuide from './components/SetupGuide';
import Discussion from './pages/Discussion';

import Investments from './pages/Investments';

// Check for Supabase keys
const hasSupabaseKeys = true; // Keys are now hardcoded as fallbacks in supabase.ts

import { LoadingScreen } from './components/LoadingScreen';

// Protected Route Component
const ProtectedRoute = ({ children, moduleKey }: { children: React.ReactNode, moduleKey?: string }) => {
  const { session, loading, isAdmin, systemSettings } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  if (moduleKey && !isAdmin && systemSettings && (systemSettings as any)[moduleKey] === false) {
    return <Navigate to="/members" />; // Redirect to members if module is disabled
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
          <ProtectedRoute moduleKey="show_dashboard">
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/members" element={
          <ProtectedRoute>
            <Members />
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute moduleKey="show_reports">
            <Reports />
          </ProtectedRoute>
        } />
        
        <Route path="/my-savings" element={
          <ProtectedRoute moduleKey="show_savings">
            <MySavings />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        <Route path="/investments" element={
          <ProtectedRoute moduleKey="show_investments">
            <Investments />
          </ProtectedRoute>
        } />

        <Route path="/discussion" element={
          <ProtectedRoute moduleKey="show_discussion">
            <Discussion />
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

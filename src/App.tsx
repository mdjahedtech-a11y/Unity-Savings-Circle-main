import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SettingsProvider, useSettings, AppSettings } from './context/SettingsContext';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Reports from './pages/Reports';
import MySavings from './pages/MySavings';
import SetupGuide from './components/SetupGuide';
import Discussion from './pages/Discussion';
import Settings from './pages/Settings';

import Investments from './pages/Investments';

// Check for Supabase keys
const hasSupabaseKeys = true; // Keys are now hardcoded as fallbacks in supabase.ts

// Protected Route Component
const ProtectedRoute = ({ children, requiredSetting }: { children: React.ReactNode, requiredSetting?: keyof AppSettings }) => {
  const { session, loading, isAdmin } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();

  if (loading || settingsLoading) {
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

  if (requiredSetting && !isAdmin && !settings[requiredSetting]) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Feature Disabled</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            This feature has been temporarily disabled by the admin. Please check back later.
          </p>
        </div>
      </Layout>
    );
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
          <ProtectedRoute requiredSetting="show_dashboard">
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/members" element={
          <ProtectedRoute requiredSetting="show_members">
            <Members />
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute requiredSetting="show_reports">
            <Reports />
          </ProtectedRoute>
        } />
        
        <Route path="/my-savings" element={
          <ProtectedRoute requiredSetting="show_my_savings">
            <MySavings />
          </ProtectedRoute>
        } />

        <Route path="/investments" element={
          <ProtectedRoute requiredSetting="show_investments">
            <Investments />
          </ProtectedRoute>
        } />

        <Route path="/discussion" element={
          <ProtectedRoute requiredSetting="show_discussion">
            <Discussion />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
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
      <SettingsProvider>
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </SettingsProvider>
    </ThemeProvider>
  );
}

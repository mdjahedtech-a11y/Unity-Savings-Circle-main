import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings as SettingsIcon, Shield, Bell, Save, AlertTriangle, LayoutDashboard, FileText, StickyNote, MessageSquare, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Settings() {
  const { isAdmin, isMainAdmin, systemSettings, updateSettings } = useAuth();
  const [loading, setLoading] = useState(false);

  const toggleModule = async (module: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      await updateSettings({ [module]: !currentStatus });
      toast.success('Module status updated');
    } catch (error) {
      toast.error('Failed to update module status');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="text-gray-500 dark:text-white/60">Only administrators can access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-white/60 mt-1">Manage application configurations and visibility for members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2"
        >
          <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Module Visibility (For Members)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'show_dashboard', name: 'Dashboard', icon: LayoutDashboard },
                  { id: 'show_reports', name: 'Reports', icon: FileText },
                  { id: 'show_investments', name: 'Investments', icon: StickyNote },
                  { id: 'show_discussion', name: 'Discussion', icon: MessageSquare },
                  { id: 'show_savings', name: 'My Savings', icon: Wallet },
                ].map((module) => (
                  <div key={module.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <module.icon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{module.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-white/40">Visible to members</p>
                      </div>
                    </div>
                    <button
                      disabled={loading}
                      onClick={() => toggleModule(module.id, (systemSettings as any)?.[module.id])}
                      className={`h-6 w-11 rounded-full relative transition-colors ${
                        (systemSettings as any)?.[module.id] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-white/20'
                      }`}
                    >
                      <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all ${
                        (systemSettings as any)?.[module.id] ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" />
                Security & Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Member Registration</p>
                  <p className="text-xs text-gray-500 dark:text-white/40">Allow new members to register themselves.</p>
                </div>
                <div className="h-6 w-11 bg-indigo-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}

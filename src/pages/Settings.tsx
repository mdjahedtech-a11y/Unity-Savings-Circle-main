import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings as SettingsIcon, Shield, Bell, Save, AlertTriangle, LayoutDashboard, FileText, StickyNote, MessageSquare, Wallet, Megaphone, Tv } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { MarqueeManager } from '../components/MarqueeManager';
import { SliderManager } from '../components/SliderManager';
import { AdminNotificationCenter } from '../components/AdminNotificationCenter';

export default function Settings() {
  const { isAdmin, isMainAdmin, systemSettings, updateSettings } = useAuth();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [livestreamUrl, setLivestreamUrl] = useState(systemSettings?.livestream_url || '');
  const [livestreamBadge, setLivestreamBadge] = useState(systemSettings?.livestream_badge || 'FIFA');

  const handleLivestreamUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updating) return;

    try {
      setUpdating(true);
      await updateSettings({
        livestream_url: livestreamUrl,
        livestream_badge: livestreamBadge
      });
      toast.success('Livestream settings updated');
    } catch (error) {
      toast.error('Failed to update livestream settings');
    } finally {
      setUpdating(false);
    }
  };

  const toggleModule = async (moduleId: string, currentStatus: boolean) => {
    if (loading) return;
    
    try {
      setLoading(true);
      await updateSettings({ [moduleId]: !currentStatus });
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
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
          <MarqueeManager />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="md:col-span-2"
        >
          <SliderManager />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="md:col-span-2"
        >
          <AdminNotificationCenter />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2"
        >
          <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tv className="w-5 h-5 text-red-500" />
                Livestream Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLivestreamUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-white/40 uppercase tracking-widest">
                      Floating Badge Text
                    </label>
                    <input
                      type="text"
                      value={livestreamBadge}
                      onChange={(e) => setLivestreamBadge(e.target.value)}
                      placeholder="e.g., FIFA"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-white/40 uppercase tracking-widest">
                      Stream Embed URL
                    </label>
                    <input
                      type="text"
                      value={livestreamUrl}
                      onChange={(e) => setLivestreamUrl(e.target.value)}
                      placeholder="YouTube Embed URL"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-indigo-600/20"
                  >
                    {updating ? 'Saving...' : 'Update Livestream Settings'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                      onClick={() => toggleModule(module.id, !!(systemSettings as any)?.[module.id])}
                      className={`h-6 w-11 rounded-full relative transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
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
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> Administrators can see all modules regardless of these settings. Toggles only affect regular members.
                </p>
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
              {/* Member Registration - Disabled until DB column is added */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 opacity-50">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Member Registration</p>
                  <p className="text-xs text-gray-500 dark:text-white/40">Allow new members to register themselves. (Requires DB Update)</p>
                </div>
                <div className="h-6 w-11 bg-gray-300 dark:bg-white/20 rounded-full relative cursor-not-allowed">
                  <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}

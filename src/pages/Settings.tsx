import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings, AppSettings } from '../context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Settings as SettingsIcon, LayoutDashboard, Users, FileText, StickyNote, MessageSquare, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';

export default function Settings() {
  const { isAdmin } = useAuth();
  const { settings, updateSetting, loading } = useSettings();
  const [tableError, setTableError] = useState(false);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleToggle = async (key: keyof AppSettings, currentValue: boolean) => {
    try {
      await updateSetting(key, !currentValue);
      toast.success('Setting updated successfully');
      setTableError(false);
    } catch (error: any) {
      if (error.code === '42P01') {
        setTableError(true);
      } else {
        toast.error(error.message || 'Failed to update setting');
      }
    }
  };

  const settingItems: { key: keyof AppSettings; label: string; icon: React.ElementType; description: string }[] = [
    { key: 'show_dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview of total savings and members' },
    { key: 'show_members', label: 'Members', icon: Users, description: 'List of all members and their details' },
    { key: 'show_reports', label: 'Reports', icon: FileText, description: 'Monthly collection and penalty reports' },
    { key: 'show_investments', label: 'Investments', icon: StickyNote, description: 'Investment notes and tracking' },
    { key: 'show_discussion', label: 'Discussion', icon: MessageSquare, description: 'Member chat and announcements' },
    { key: 'show_my_savings', label: 'My Savings', icon: Wallet, description: 'Individual member savings history' },
  ];

  if (tableError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Database Setup Required</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          The settings table does not exist in your Supabase database. Please run the following SQL in your Supabase SQL Editor:
        </p>
        <div className="bg-gray-900 text-gray-300 p-4 rounded-lg text-left text-sm font-mono overflow-x-auto w-full max-w-2xl">
          <pre>{`create table if not exists app_settings (
  id int primary key default 1,
  show_dashboard boolean default true,
  show_members boolean default true,
  show_reports boolean default true,
  show_investments boolean default true,
  show_discussion boolean default true,
  show_my_savings boolean default true
);

insert into app_settings (id) values (1) on conflict (id) do nothing;

alter table app_settings enable row level security;

drop policy if exists "Settings are viewable by everyone" on app_settings;
drop policy if exists "Admins can update settings" on app_settings;
drop policy if exists "Admins can insert settings" on app_settings;

create policy "Settings are viewable by everyone" on app_settings for select using (true);

create policy "Admins can update settings" on app_settings for update using (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);

create policy "Admins can insert settings" on app_settings for insert with check (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);`}</pre>
        </div>
        <Button onClick={() => window.location.reload()} className="mt-6 bg-pink-600 hover:bg-pink-700 text-white">
          I've run the SQL, Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-pink-500" />
            App Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Control which features are visible to regular members. Admins will always see all features.
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Feature Toggles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {settingItems.map((item) => (
              <div key={item.key} className="p-4 sm:p-6 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-pink-50 dark:bg-pink-500/10 rounded-lg text-pink-600 dark:text-pink-400 shrink-0 mt-1">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.label}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings[item.key]}
                    onChange={() => handleToggle(item.key, settings[item.key])}
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

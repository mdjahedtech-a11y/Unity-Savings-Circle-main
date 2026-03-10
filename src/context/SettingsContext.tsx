import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AppSettings {
  show_dashboard: boolean;
  show_members: boolean;
  show_reports: boolean;
  show_investments: boolean;
  show_discussion: boolean;
  show_my_savings: boolean;
}

const defaultSettings: AppSettings = {
  show_dashboard: true,
  show_members: true,
  show_reports: true,
  show_investments: true,
  show_discussion: true,
  show_my_savings: true,
};

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  updateSetting: (key: keyof AppSettings, value: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  updateSetting: async () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();

    const channel = supabase.channel('app_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, fetchSettings)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        if (error.code !== '42P01') { // Ignore table not found error
          console.error('Error fetching settings:', error);
        }
      } else if (data) {
        setSettings({
          show_dashboard: data.show_dashboard,
          show_members: data.show_members,
          show_reports: data.show_reports,
          show_investments: data.show_investments,
          show_discussion: data.show_discussion,
          show_my_savings: data.show_my_savings,
        });
      }
    } catch (err) {
      console.error('Unexpected error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: boolean) => {
    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: value }));
    
    try {
      // Upsert the setting
      const { error } = await supabase
        .from('app_settings')
        .upsert({ id: 1, [key]: value });

      if (error) {
        // Revert on error
        setSettings(prev => ({ ...prev, [key]: !value }));
        throw error;
      }
    } catch (err: any) {
      console.error('Error updating setting:', err);
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

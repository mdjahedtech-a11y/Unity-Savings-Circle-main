import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import { TvSponsor } from '../types';
import { Settings, Image as ImageIcon, Timer, Power, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const TvSponsorManager: React.FC = () => {
  const [sponsor, setSponsor] = useState<TvSponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Jahed Hasan',
    image_url: '',
    is_active: false,
    show_interval_seconds: 60,
    display_duration_seconds: 10
  });

  useEffect(() => {
    const fetchSponsor = async () => {
      try {
        const { data, error } = await supabase
          .from('tv_sponsors')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setSponsor(data);
          setFormData({
            name: data.name,
            image_url: data.image_url || '',
            is_active: data.is_active,
            show_interval_seconds: data.show_interval_seconds,
            display_duration_seconds: data.display_duration_seconds
          });
        }
      } catch (error) {
        console.error('Error fetching sponsor:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsor();
  }, []);

  const handleToggleActive = async () => {
    if (!sponsor) return;
    try {
      setSaving(true);
      const newActive = !formData.is_active;
      const { error } = await supabase
        .from('tv_sponsors')
        .update({ is_active: newActive, updated_at: new Date().toISOString() })
        .eq('id', sponsor.id);

      if (error) throw error;
      setFormData(prev => ({ ...prev, is_active: newActive }));
      toast.success(`Sponsorship ${newActive ? 'Enabled' : 'Disabled'}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!sponsor) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('tv_sponsors')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', sponsor.id);

      if (error) throw error;
      toast.success('Sponsor settings updated');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-white/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" />
          TV Sponsor Control
        </CardTitle>
        <button
          onClick={handleToggleActive}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            formData.is_active 
            ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
            : 'bg-gray-100 dark:bg-white/5 text-gray-400'
          }`}
        >
          <Power className="w-4 h-4" />
          {formData.is_active ? 'Online' : 'Offline'}
        </button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest pl-1">Sponsor Name</label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                placeholder="Enter name (e.g., Jahed Hasan)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest pl-1">Sponsor Photo URL (Optional)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <ImageIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest pl-1 flex items-center gap-2">
              <Timer className="w-3 h-3" /> Appearance Interval
            </label>
            <select
              value={formData.show_interval_seconds}
              onChange={(e) => setFormData({ ...formData, show_interval_seconds: parseInt(e.target.value) })}
              className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none"
            >
              <option value="0">Instant/Always Show</option>
              <option value="30">Every 30 Seconds</option>
              <option value="60">Every 1 Minute</option>
              <option value="120">Every 2 Minutes</option>
              <option value="300">Every 5 Minutes</option>
              <option value="600">Every 10 Minutes</option>
            </select>
            <p className="text-[9px] text-gray-400 mt-1 pl-1 italic">Set to "Instant" for immediate non-stop display.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest pl-1">Display Duration (Seconds)</label>
            <input
              type="number"
              value={formData.display_duration_seconds}
              onChange={(e) => setFormData({ ...formData, display_duration_seconds: parseInt(e.target.value) })}
              className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
              min="3"
              max="60"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex gap-3">
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Settings
          </Button>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
          <div className="flex items-start gap-4">
             <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 bg-black/80 flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                {formData.image_url ? (
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-white">{formData.name.charAt(0)}</span>
                )}
             </div>
             <div className="flex-1 space-y-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Live Preview</p>
                <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">{formData.name}</h4>
                <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">
                  This card will appear on the TV screen with a stylish entry animation. Any changes you save will update on all active TV players instantly.
                </p>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

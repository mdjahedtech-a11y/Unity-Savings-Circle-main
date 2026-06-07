import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Tv, Plus, Trash2, Globe, BadgeCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const TvChannelManager: React.FC = () => {
  const { tvChannels, addChannel, deleteChannel } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    badge: 'LIVE',
    icon_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) {
      toast.error('Name and URL are required');
      return;
    }

    try {
      setLoading(true);
      await addChannel(formData);
      setFormData({ name: '', url: '', badge: 'LIVE', icon_url: '' });
      setIsAdding(false);
      toast.success('Channel added successfully');
    } catch (error) {
      toast.error('Failed to add channel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;
    
    try {
      await deleteChannel(id);
      toast.success('Channel removed');
    } catch (error) {
      toast.error('Failed to remove channel');
    }
  };

  return (
    <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tv className="w-5 h-5 text-indigo-500" />
          TV Channels Management
        </CardTitle>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          variant="outline"
          size="sm"
          className="border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
        >
          {isAdding ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> Add Channel</>}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-4 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest pl-1">Channel Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., FIFA Premium"
                      className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest pl-1">Badge Text</label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="e.g., FIFA, LIVE, HD"
                      className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest pl-1">Stream URL (Direct URL preferred)</label>
                    <input
                      type="text"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://example.com/stream.m3u8 or YouTube URL"
                      className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6">
                    {loading ? 'Saving...' : 'Save Channel'}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tvChannels.length === 0 ? (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-gray-400">
              <Tv className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No channels added yet</p>
            </div>
          ) : (
            tvChannels.map((channel) => (
              <div
                key={channel.id}
                className="group relative bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex items-center justify-between hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {channel.name}
                      <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-widest">
                        {channel.badge}
                      </span>
                    </h4>
                    <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{channel.url}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(channel.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">Supported Formats</p>
            <p className="text-xs text-amber-700 dark:text-amber-500/80 leading-relaxed">
              We support direct video links (MP4, WebM), HLS streams (.m3u8), and standard YouTube embed links. HLS streams will automatically use adaptive quality based on user internet speed.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

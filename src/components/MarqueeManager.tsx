import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MarqueeText } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit2, Save, X, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export function MarqueeManager() {
  const [messages, setMessages] = useState<MarqueeText[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('marquee_texts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching marquee messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    try {
      const { error } = await supabase
        .from('marquee_texts')
        .insert([{ text: newText.trim(), is_active: true }]);

      if (error) throw error;
      setNewText('');
      fetchMessages();
      toast.success('Message added successfully');
    } catch (err) {
      toast.error('Failed to add message');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('marquee_texts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMessages();
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('marquee_texts')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchMessages();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return;
    try {
      const { error } = await supabase
        .from('marquee_texts')
        .update({ text: editText.trim() })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      fetchMessages();
      toast.success('Message updated');
    } catch (err) {
      toast.error('Failed to update message');
    }
  };

  return (
    <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-orange-500" />
          Breaking News Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Enter breaking news text..."
            className="flex-1 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button onClick={handleAdd} disabled={!newText.trim()} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        {/* List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 group"
              >
                <div className="flex-1 mr-4">
                  {editingId === msg.id ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-1 rounded-lg bg-white dark:bg-gray-800 border border-indigo-500 text-sm focus:outline-none"
                      />
                      <button onClick={() => handleSaveEdit(msg.id)} className="p-1 text-green-500 hover:bg-green-500/10 rounded-md">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-500/10 rounded-md">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className={`text-sm font-medium ${msg.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/30'}`}>
                      {msg.text}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(msg.id, msg.is_active)}
                    className={`p-2 rounded-lg transition-colors ${msg.is_active ? 'text-green-500 bg-green-500/10' : 'text-gray-400 bg-gray-400/10'}`}
                    title={msg.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {msg.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(msg.id);
                      setEditText(msg.text);
                    }}
                    className="p-2 text-blue-500 bg-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-2 text-red-500 bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && messages.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-2xl">
              <Megaphone className="w-8 h-8 text-gray-300 dark:text-white/10 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-white/30">No breaking news messages yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

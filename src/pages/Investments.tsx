import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Calendar, DollarSign, FileText, StickyNote, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

type Note = {
  id: string;
  title: string;
  content: string;
  amount: number;
  date: string;
  color: string;
  created_at: string;
};

const COLORS = [
  { name: 'Rose', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-700/50', text: 'text-rose-900 dark:text-rose-100', icon: 'text-rose-500' },
  { name: 'Blue', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700/50', text: 'text-blue-900 dark:text-blue-100', icon: 'text-blue-500' },
  { name: 'Green', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700/50', text: 'text-emerald-900 dark:text-emerald-100', icon: 'text-emerald-500' },
  { name: 'Amber', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700/50', text: 'text-amber-900 dark:text-amber-100', icon: 'text-amber-500' },
  { name: 'Purple', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700/50', text: 'text-purple-900 dark:text-purple-100', icon: 'text-purple-500' },
  { name: 'Cyan', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-700/50', text: 'text-cyan-900 dark:text-cyan-100', icon: 'text-cyan-500' },
];

export default function Investments() {
  const { isAdmin } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tableError, setTableError] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedColor, setSelectedColor] = useState(0);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        if (error.code === '42P01') { // undefined_table
          setTableError(true);
        }
        throw error;
      }

      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('notes').insert({
        title,
        content,
        amount: amount ? parseFloat(amount) : 0,
        date,
        color: selectedColor.toString()
      });

      if (error) throw error;

      toast.success('Note added successfully');
      setIsAddModalOpen(false);
      resetForm();
      fetchNotes();
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast.error(error.message || 'Failed to add note');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Note deleted successfully');
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedColor(0);
  };

  if (tableError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Database Setup Required</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          The 'notes' table does not exist in your Supabase database. Please run the following SQL in your Supabase SQL Editor:
        </p>
        <div className="bg-gray-900 text-gray-300 p-4 rounded-lg text-left text-sm font-mono overflow-x-auto w-full max-w-2xl">
          <pre>{`create table notes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text,
  amount numeric default 0,
  date date default current_date,
  color text default '0',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);`}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <StickyNote className="w-8 h-8 text-pink-500" />
            Investments & Notes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track investments and keep important notes for the circle.
          </p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/25">
            <Plus className="w-4 h-4 mr-2" />
            Add New Note
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <StickyNote className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg">No notes found. {isAdmin ? 'Add one to get started!' : ''}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note, index) => {
            const colorTheme = COLORS[parseInt(note.color) || 0];
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
              >
                <Card className={`h-full border ${colorTheme.border} ${colorTheme.bg} shadow-sm hover:shadow-md transition-all duration-300`}>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className={`text-xl font-bold ${colorTheme.text}`}>
                        {note.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs font-medium opacity-70">
                        <span className={`flex items-center gap-1 ${colorTheme.text}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(note.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${colorTheme.text} transition-colors`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className={`text-sm leading-relaxed ${colorTheme.text} opacity-90 whitespace-pre-wrap`}>
                      {note.content}
                    </p>
                    
                    {note.amount > 0 && (
                      <div className={`mt-4 pt-4 border-t ${colorTheme.border} flex items-center justify-between`}>
                        <span className={`text-xs font-semibold uppercase tracking-wider ${colorTheme.text} opacity-70`}>
                          Invested Amount
                        </span>
                        <span className={`text-lg font-bold ${colorTheme.text} flex items-center`}>
                          <DollarSign className="w-4 h-4 mr-0.5" />
                          {note.amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Investment Note"
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/50"
              placeholder="e.g. Land Purchase in Savar"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description / Note</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/50 min-h-[120px]"
              placeholder="Details about the investment..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount (Optional)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/50"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color Theme</label>
            <div className="flex gap-3 flex-wrap">
              {COLORS.map((color, index) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColor(index)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${color.bg.split(' ')[0]} ${
                    selectedColor === index 
                      ? 'border-gray-900 dark:border-white scale-110 shadow-lg' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white mt-4">
            Save Note
          </Button>
        </form>
      </Modal>
    </div>
  );
}

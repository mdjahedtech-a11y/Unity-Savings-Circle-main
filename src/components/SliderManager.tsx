import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Trash2, Plus, Image as ImageIcon, ExternalLink, Loader2, GripVertical, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export function SliderManager() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newSlide, setNewSlide] = useState({ image_url: '', title: '', description: '' });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('slider_images')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load slides');
    } finally {
      setLoading(false);
    }
  };

  const addSlide = async () => {
    if (!newSlide.image_url) {
      toast.error('Image URL is required');
      return;
    }

    try {
      setAdding(true);
      const { error } = await supabase.from('slider_images').insert([{
        ...newSlide,
        order_index: slides.length,
        is_active: true
      }]);

      if (error) throw error;
      
      toast.success('Slide added successfully');
      setNewSlide({ image_url: '', title: '', description: '' });
      fetchSlides();
    } catch (error) {
      toast.error('Failed to add slide');
    } finally {
      setAdding(false);
    }
  };

  const deleteSlide = async (id: string) => {
    try {
      const { error } = await supabase.from('slider_images').delete().eq('id', id);
      if (error) throw error;
      toast.success('Slide removed');
      fetchSlides();
    } catch (error) {
      toast.error('Failed to delete slide');
    }
  };

  const toggleSlideStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('slider_images')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      fetchSlides();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  return (
    <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-500" />
          Dashboard Image Slider
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Slide Form */}
        <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New Slide
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image URL</label>
              <input 
                type="text" 
                value={newSlide.image_url}
                onChange={(e) => setNewSlide({...newSlide, image_url: e.target.value})}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Title (Optional)</label>
              <input 
                type="text" 
                value={newSlide.title}
                onChange={(e) => setNewSlide({...newSlide, title: e.target.value})}
                placeholder="Slide Title"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description (Optional)</label>
              <textarea 
                value={newSlide.description}
                onChange={(e) => setNewSlide({...newSlide, description: e.target.value})}
                placeholder="Slide description..."
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={addSlide} 
              disabled={adding || !newSlide.image_url}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Slide
            </Button>
          </div>
        </div>

        {/* Slides List */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Slides</h4>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
          ) : slides.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {slides.map((slide) => (
                  <motion.div 
                    key={slide.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={slide.image_url} 
                        alt={slide.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button 
                          onClick={() => deleteSlide(slide.id)}
                          className="p-2 bg-red-500/80 backdrop-blur-md text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute top-2 left-2">
                        <button 
                          onClick={() => toggleSlideStatus(slide.id, slide.is_active)}
                          className={cn(
                            "p-2 backdrop-blur-md text-white rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase",
                            slide.is_active ? "bg-emerald-500/80" : "bg-gray-500/80"
                          )}
                        >
                          {slide.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {slide.is_active ? 'Active' : 'Hidden'}
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h5 className="font-bold text-gray-900 dark:text-white truncate">{slide.title || 'Untitled'}</h5>
                      <p className="text-xs text-gray-500 dark:text-white/40 truncate mt-1">{slide.description || 'No description'}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-white/2 rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-20" />
              <p className="text-gray-400 font-medium italic text-sm">No slides added yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

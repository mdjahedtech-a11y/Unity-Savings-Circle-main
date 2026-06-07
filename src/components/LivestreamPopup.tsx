import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tv, X, Maximize2, Minimize2, ExternalLink, Activity, Play, ChevronRight, Globe, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TvChannel } from '../types';
import Hls from 'hls.js';

export const LivestreamPopup: React.FC = () => {
  const { tvChannels } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<TvChannel | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [showChannelList, setShowChannelList] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const streamUrl = selectedChannel?.url || '';
  
  // Detect if the link is a direct video or HLS stream
  const isHls = (url: string) => url.toLowerCase().includes('.m3u8');
  const isDirectVideo = (url: string) => {
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || 
           cleanUrl.endsWith('.webm') || 
           cleanUrl.endsWith('.m4v') || 
           cleanUrl.endsWith('.ogv') || 
           cleanUrl.endsWith('.mov');
  };

  useEffect(() => {
    let hls: Hls | null = null;

    if (isOpen && videoRef.current && isHls(streamUrl)) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          abrEwmaFastLive: 1,
          abrEwmaSlowLive: 5,
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(e => console.log("Auto-play blocked:", e));
        });
        hls.on(Hls.Events.FRAG_BUFFERED, () => setBuffering(false));
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR: hls?.startLoad(); break;
              case Hls.ErrorTypes.MEDIA_ERROR: hls?.recoverMediaError(); break;
              default: hls?.destroy(); break;
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamUrl;
      }
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [isOpen, selectedChannel]);

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&rel=0`;
    }
    return url;
  };

  const finalEmbedUrl = getEmbedUrl(streamUrl);
  const hlsStream = isHls(streamUrl);
  const directVideo = isDirectVideo(streamUrl);
  const isIframe = !hlsStream && !directVideo;

  const handleOpen = () => {
    setIsOpen(true);
    if (!selectedChannel && tvChannels.length > 0) {
      setShowChannelList(true);
    } else if (selectedChannel) {
      setShowChannelList(false);
    }
  };

  const handleSelectChannel = (channel: TvChannel) => {
    setSelectedChannel(channel);
    setShowChannelList(false);
  };

  if (tvChannels.length === 0) return null;

  return (
    <>
      {/* Floating Icon */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleOpen}
        className="fixed bottom-24 right-6 z-40 flex flex-col items-center justify-center pointer-events-auto"
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 scale-150" />
          <div className="absolute inset-0 bg-indigo-500 rounded-full animate-pulse opacity-40 scale-125" />
          
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 border-2 border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
            <Tv className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            <div className="absolute top-0 right-0 p-1">
               <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
          </div>

          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full border border-gray-100 dark:border-white/10 shadow-sm transition-transform group-hover:scale-110">
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest whitespace-nowrap">
              {selectedChannel?.badge || tvChannels[0]?.badge || 'LIVE'}
            </p>
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                width: isMaximized ? '98vw' : showChannelList ? 'min(95vw, 600px)' : 'min(95vw, 900px)',
                maxHeight: isMaximized ? '95vh' : '90vh'
              }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-zinc-950 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 flex items-center justify-between bg-zinc-900/50 border-b border-white/5 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                    <Tv className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                       {showChannelList ? 'Transmission Hub' : selectedChannel?.name}
                       {!showChannelList && <span className="bg-red-500 text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest">LIVE</span>}
                    </h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                      {showChannelList ? `${tvChannels.length} Active Channels Available` : 'High Definition Secure Feed'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!showChannelList && (
                    <button
                      onClick={() => setShowChannelList(true)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-all border border-white/10"
                      title="Channel List"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-all border border-white/10"
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all border border-red-500/20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
                <AnimatePresence mode="wait">
                  {showChannelList ? (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {tvChannels.map((channel, idx) => (
                        <motion.button
                          key={channel.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleSelectChannel(channel)}
                          className={`group relative p-4 rounded-3xl border transition-all text-left overflow-hidden ${
                            selectedChannel?.id === channel.id 
                            ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.3)]' 
                            : 'bg-zinc-900 border-white/5 hover:border-indigo-500/50 hover:bg-zinc-800'
                          }`}
                        >
                          {/* Background Glow */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="relative flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                              selectedChannel?.id === channel.id ? 'bg-white/20' : 'bg-indigo-500/10'
                            }`}>
                              <Zap className={`w-6 h-6 ${selectedChannel?.id === channel.id ? 'text-white' : 'text-indigo-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase ${
                                  selectedChannel?.id === channel.id ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'
                                }`}>
                                  {channel.badge}
                                </span>
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">CH-{idx + 1}</span>
                              </div>
                              <h4 className="text-sm font-black text-white truncate uppercase tracking-widest">{channel.name}</h4>
                            </div>
                            <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                              selectedChannel?.id === channel.id ? 'text-white' : 'text-white/20'
                            }`} />
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="player"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col"
                    >
                      {/* Player Area */}
                      <div className="relative aspect-video bg-zinc-950 group/player border-b border-white/5">
                        {/* Channel Branding */}
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none transition-opacity duration-500 group-hover/player:opacity-100">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-black/60 backdrop-blur-md p-0.5">
                             <img 
                              src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" 
                              alt="Logo" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {isIframe ? (
                          <iframe
                            src={finalEmbedUrl}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            ref={videoRef}
                            controls
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                            poster="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200"
                          />
                        )}

                        {buffering && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                             <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                               <Activity className="w-10 h-10 text-indigo-500" />
                             </motion.div>
                          </div>
                        )}
                      </div>

                      {/* Mini Channel List Below Player */}
                      <div className="p-4 bg-zinc-900/30">
                        <div className="flex items-center gap-2 mb-4">
                           <Play className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                           <h5 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Quick Switch Channel</h5>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                           {tvChannels.map((channel) => (
                            <button
                              key={channel.id}
                              onClick={() => handleSelectChannel(channel)}
                              className={`flex-shrink-0 px-4 py-3 rounded-2xl border transition-all flex items-center gap-3 min-w-[160px] ${
                                selectedChannel?.id === channel.id 
                                ? 'bg-indigo-600/20 border-indigo-500 shadow-lg' 
                                : 'bg-black/40 border-white/5 hover:bg-white/5'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                selectedChannel?.id === channel.id ? 'bg-indigo-500' : 'bg-white/5'
                              }`}>
                                <Tv className="w-4 h-4 text-white" />
                              </div>
                              <div className="text-left overflow-hidden">
                                <p className="text-[10px] font-black text-white uppercase tracking-wider truncate mb-0.5">{channel.name}</p>
                                <span className="text-[8px] text-white/40 uppercase font-bold">{channel.badge} Feed</span>
                              </div>
                            </button>
                           ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

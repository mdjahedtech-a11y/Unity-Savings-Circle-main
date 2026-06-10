import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tv, X, Maximize2, Minimize2, ExternalLink, Activity, Play, ChevronRight, Globe, Zap, RotateCw } from 'lucide-react';
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

  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const toggleFullScreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const handleRotate = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        // Try to lock orientation to landscape on mobile
        if (window.screen?.orientation?.lock) {
          await window.screen.orientation.lock('landscape').catch(() => {
            // Silently fail if not supported
          });
        }
      } else {
        await document.exitFullscreen();
        if (window.screen?.orientation?.unlock) {
          window.screen.orientation.unlock();
        }
      }
    } catch (err) {
      console.error("Rotation error:", err);
    }
  };

  useEffect(() => {
    let hls: Hls | null = null;
    setIsVideoLoading(true);
    setBuffering(false);

    if (isOpen && videoRef.current && isHls(streamUrl)) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          capLevelToPlayerSize: true, // Save bandwidth based on player size
          backBufferLength: 30,       // Keep less history to save memory
          maxBufferLength: 20,       // Balanced buffer for stability
          maxMaxBufferLength: 40,
          maxBufferHole: 0.5,
          liveSyncDurationCount: 3,  // Number of fragments to stay behind live edge
          liveMaxLatencyDurationCount: 10, // Max delay before skipping to catch up
          manifestLoadingMaxRetry: 15,
          levelLoadingMaxRetry: 15,
          fragLoadingMaxRetry: 15,
          fragLoadingTimeOut: 15000,
          abrEwmaFastLive: 1,
          abrEwmaSlowLive: 3,
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(() => {});
        });
        
        hls.on(Hls.Events.LEVEL_LOADED, () => {
          setIsVideoLoading(false);
        });

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
  }, [isOpen, selectedChannel, streamUrl]);

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&rel=0&modestbranding=1`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&rel=0&modestbranding=1`;
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
    setIsVideoLoading(true);
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
          <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />

            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                width: isMaximized ? '100vw' : showChannelList ? 'min(95vw, 600px)' : 'min(98vw, 1100px)',
                height: isMaximized ? '100vh' : 'auto',
                maxHeight: '100vh'
              }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative bg-zinc-950 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col ${
                isMaximized ? 'rounded-none' : 'rounded-3xl md:rounded-[2.5rem]'
              }`}
            >
              {/* Header */}
              <div className="p-4 md:p-5 flex items-center justify-between bg-zinc-900/40 border-b border-white/5 backdrop-blur-md z-20 shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Tv className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 truncate">
                       {showChannelList ? 'TV HUB' : selectedChannel?.name}
                       {!showChannelList && <span className="bg-red-500 text-[7px] md:text-[8px] px-1 md:px-1.5 py-0.5 rounded font-black tracking-widest text-white shrink-0">LIVE</span>}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 md:gap-2">
                  {!showChannelList && (
                    <button
                      onClick={() => setShowChannelList(true)}
                      className="p-2 md:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-all border border-white/10"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleRotate}
                    className="p-2 md:p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-all border border-indigo-500/20"
                    title="Rotate to Landscape"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggleFullScreen}
                    className="hidden md:block p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-all border border-white/10"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="hidden md:block p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-all border border-white/10"
                    title={isMaximized ? 'Restore' : 'Expand Modal'}
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 md:p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all border border-red-500/20"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
                <AnimatePresence mode="wait">
                  {showChannelList ? (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6"
                    >
                      {tvChannels.map((channel, idx) => (
                        <motion.button
                          key={channel.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleSelectChannel(channel)}
                          className={`group relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] border transition-all text-left overflow-hidden ${
                            selectedChannel?.id === channel.id 
                            ? 'bg-indigo-600 border-indigo-400 shadow-2xl' 
                            : 'bg-zinc-900/50 border-white/5 hover:border-indigo-500/50 hover:bg-zinc-800'
                          }`}
                        >
                          <div className="relative flex items-center gap-4">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[1.25rem] flex items-center justify-center shrink-0 ${
                              selectedChannel?.id === channel.id ? 'bg-white/20' : 'bg-indigo-500/10'
                            }`}>
                              <Zap className={`w-6 h-6 md:w-7 md:h-7 ${selectedChannel?.id === channel.id ? 'text-white' : 'text-indigo-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                               <span className={`text-[6px] md:text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase mb-1.5 inline-block ${
                                 selectedChannel?.id === channel.id ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'
                               }`}>
                                 {channel.badge}
                               </span>
                              <h4 className="text-sm md:text-base font-black text-white truncate uppercase tracking-widest">{channel.name}</h4>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
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
                      className="flex flex-col h-full"
                    >
                      {/* Player Area */}
                      <div 
                        ref={containerRef}
                        className={`relative bg-zinc-950 group/player border-b border-white/5 flex flex-col justify-center overflow-hidden transition-all duration-500 ${
                         isMaximized ? 'flex-1' : 'aspect-video'
                      }`}>
                        {/* Vivid Filter Overlay */}
                        <div className="absolute inset-0 z-10 pointer-events-none [filter:brightness(1.05)_contrast(1.15)_saturate(1.4)] mix-blend-overlay opacity-20 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10" />

                        {/* Watermark/Credit (Bottom Left) */}
                        <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 z-30 pointer-events-none transition-opacity duration-500 opacity-40 group-hover/player:opacity-90">
                           <span className="text-[5px] md:text-[7px] font-black text-white/60 uppercase tracking-[0.4em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                             Made by - Jahed Hasan
                           </span>
                        </div>

                        {/* Top-right Status Indicators */}
                        {!isVideoLoading && (
                          <div className="absolute top-2 md:top-4 right-2 md:right-4 z-30 pointer-events-none opacity-0 group-hover/player:opacity-40 transition-opacity">
                             <div className="flex items-center gap-2">
                               <span className="text-[6px] md:text-[8px] font-mono text-white/50 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                                 {hlsStream ? 'ADAPTIVE HD' : 'DIRECT FEED'}
                               </span>
                               <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-red-500 animate-pulse" />
                             </div>
                          </div>
                        )}

                        {/* Video Content */}
                        <div className="w-full h-full [filter:brightness(1.05)_contrast(1.1)_saturate(1.3)] origin-center">
                          {isIframe ? (
                            <iframe
                              src={finalEmbedUrl}
                              onLoad={() => setIsVideoLoading(false)}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          ) : (
                            <div className="relative w-full h-full">
                              <video
                                ref={videoRef}
                                onCanPlay={() => setIsVideoLoading(false)}
                                onWaiting={() => setBuffering(true)}
                                onPlaying={() => {
                                  setBuffering(false);
                                  setIsVideoLoading(false);
                                }}
                                controls
                                autoPlay
                                playsInline
                                className="w-full h-full object-contain"
                                poster="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mini Switch Panel Below Player */}
                      <div className="p-3 md:p-4 bg-zinc-900/20 border-t border-white/5 shrink-0">
                        <div className="flex items-center gap-2 mb-3 px-1">
                           <div className="w-1 h-1 rounded-full bg-indigo-500" />
                           <h5 className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">Switch Feed</h5>
                        </div>
                        <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar no-scrollbar scroll-smooth">
                           {tvChannels.map((channel) => (
                            <button
                              key={channel.id}
                              onClick={() => handleSelectChannel(channel)}
                              className={`flex-shrink-0 px-4 py-3 rounded-2xl border transition-all flex items-center gap-3 min-w-[150px] md:min-w-[180px] ${
                                selectedChannel?.id === channel.id 
                                ? 'bg-indigo-600/20 border-indigo-500 shadow-lg' 
                                : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'
                              }`}
                            >
                              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                selectedChannel?.id === channel.id ? 'bg-indigo-500 shadow-lg' : 'bg-white/5'
                              }`}>
                                <Zap className={`w-4 h-4 md:w-5 md:h-5 text-white ${selectedChannel?.id === channel.id ? 'animate-pulse' : ''}`} />
                              </div>
                              <div className="text-left overflow-hidden">
                                <p className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-wider truncate mb-0.5">{channel.name}</p>
                                <span className={`text-[6px] md:text-[7px] uppercase font-bold tracking-widest ${
                                  selectedChannel?.id === channel.id ? 'text-indigo-400' : 'text-white/20'
                                }`}>{channel.badge}</span>
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

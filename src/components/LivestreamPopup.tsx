import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tv, X, Maximize2, Minimize2, ExternalLink, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Hls from 'hls.js';

export const LivestreamPopup: React.FC = () => {
  const { systemSettings } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const streamUrl = systemSettings?.livestream_url || '';
  const badgeText = systemSettings?.livestream_badge || 'FIFA';

  // Detect if the link is a direct video or HLS stream
  const isHls = (url: string) => url.match(/\.(m3u8)$/i);
  const isDirectVideo = (url: string) => url.match(/\.(mp4|webm|m4v|ogv|mov)$/i);

  useEffect(() => {
    let hls: Hls | null = null;

    if (isOpen && videoRef.current && isHls(streamUrl)) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          // Adaptive bitrate configuration hints
          abrEwmaFastLive: 1,
          abrEwmaSlowLive: 5,
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(e => console.log("Auto-play blocked:", e));
        });
        
        // Handle buffering
        hls.on(Hls.Events.FRAG_BUFFERED, () => setBuffering(false));
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                hls?.destroy();
                break;
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        videoRef.current.src = streamUrl;
      }
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [isOpen, streamUrl]);

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

  if (!streamUrl) return null;

  return (
    <>
      {/* Floating Icon */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 flex flex-col items-center justify-center pointer-events-auto"
      >
        <div className="relative group">
          {/* Animated rings */}
          <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 scale-150" />
          <div className="absolute inset-0 bg-indigo-500 rounded-full animate-pulse opacity-40 scale-125" />
          
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 border-2 border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
            <Tv className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            
            {/* Live Badge */}
            <div className="absolute top-0 right-0 p-1">
               <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
          </div>

          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full border border-gray-100 dark:border-white/10 shadow-sm">
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest whitespace-nowrap">
              {badgeText}
            </p>
          </div>
        </div>
      </motion.button>

      {/* Livestream Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                width: isMaximized ? '95vw' : 'min(95vw, 900px)',
                height: isMaximized ? '90vh' : 'auto'
              }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between bg-zinc-900/80 border-b border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                    Network Transmission: {badgeText}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-2 rounded-xl hover:bg-white/10 text-white/60 transition-all active:scale-95"
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl hover:bg-red-500/20 text-red-500 transition-all active:scale-95"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Player Body */}
              <div className="relative bg-zinc-950 flex-1 aspect-video group/player">
                {/* Channel Branding (Top Left) */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none transition-opacity duration-500 group-hover/player:opacity-100">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden border border-white/20 shadow-2xl bg-black/40 backdrop-blur-md p-0.5">
                    <img 
                      src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" 
                      alt="Station Logo" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="hidden md:flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md">Unity Circle</span>
                    <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter drop-shadow-md">Official Feed</span>
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
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                      poster="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200"
                    >
                      Your browser does not support the video tag.
                    </video>
                    
                    {buffering && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                         <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                         >
                           <Activity className="w-8 h-8 text-indigo-500" />
                         </motion.div>
                      </div>
                    )}
                  </div>
                )}

                {/* Aesthetic Overlay (Only visible when not playing) */}
                {!isMaximized && (
                  <div className="absolute top-4 right-4 pointer-events-none opacity-40">
                    <div className="text-[8px] font-mono text-white/50 space-y-1">
                      <p>QUALITY: {hlsStream ? 'AUTO (ADAPTIVE)' : 'HIGH'}</p>
                      <p>LATENCY: LOW</p>
                      <p>NETWORK: {hlsStream ? 'OPTIMIZED' : 'DIRECT'}</p>
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

};

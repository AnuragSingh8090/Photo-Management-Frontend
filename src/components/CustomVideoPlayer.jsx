import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiDownload, FiSettings } from 'react-icons/fi';
import { MdReplay10, MdForward10 } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

const CustomVideoPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const controlsTimeoutRef = useRef(null);

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (e) => {
    if (e) e.stopPropagation();
    if (showSettings) setShowSettings(false);
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(current);
    if (dur > 0) {
      setProgress((current / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (dur === Infinity) {
        videoRef.current.currentTime = 1e99;
        videoRef.current.onseeked = () => {
          videoRef.current.onseeked = null;
          videoRef.current.currentTime = 0;
          setDuration(videoRef.current.duration);
        };
      } else {
        setDuration(dur);
      }
    }
  };

  const handleProgressChange = (e) => {
    if (!videoRef.current) return;
    const newTime = (e.target.value / 100) * duration;
    videoRef.current.currentTime = newTime;
    setProgress(e.target.value);
  };

  const skipTime = (amount, e) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const handleVolumeChange = (e) => {
    if (e) e.stopPropagation();
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
    setIsMuted(newVol === 0);
  };

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
      if (volume === 0) setVolume(1);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = async (e) => {
    if (e) e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        await containerRef.current.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
    setShowSettings(false);
  };

  const handleDownload = (e) => {
    if (e) e.stopPropagation();
    const a = document.createElement('a');
    a.href = src;
    a.download = `recorded-video-${new Date().getTime()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSpeedChange = (speed, e) => {
    if (e) e.stopPropagation();
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettings(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipTime(10);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-10);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-lg group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handlePlayPause}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      {/* Play/Pause Center Overlay */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl">
              <FiPlay className="w-10 h-10 ml-2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-40"
            onClick={(e) => { e.stopPropagation(); if (showSettings) setShowSettings(false); }}
          >
            <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-2">
              {/* Progress Bar */}
              <div className="flex items-center gap-3 w-full group/progress cursor-pointer">
                <span className="text-white text-xs font-medium w-10 text-right font-mono">
                  {formatTime(currentTime)}
                </span>
                <div className="relative flex-1 h-2 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={handleProgressChange}
                    className="w-full h-1 bg-transparent appearance-none outline-none cursor-pointer group-hover/progress:h-2 transition-all z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                    style={{ background: `linear-gradient(to right, #3b82f6 ${progress}%, rgba(255,255,255,0.3) ${progress}%)` }}
                  />
                </div>
                <span className="text-white/70 text-xs font-medium w-10 font-mono">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Bottom Controls */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4">
                  <button onClick={handlePlayPause} className="text-white hover:text-blue-400 transition-colors focus:outline-none p-2 rounded-full hover:bg-white/10">
                    {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
                  </button>
                  <button onClick={(e) => skipTime(-10, e)} className="text-white hover:text-blue-400 transition-colors focus:outline-none p-2 rounded-full hover:bg-white/10">
                    <MdReplay10 className="w-6 h-6" />
                  </button>
                  <button onClick={(e) => skipTime(10, e)} className="text-white hover:text-blue-400 transition-colors focus:outline-none p-2 rounded-full hover:bg-white/10">
                    <MdForward10 className="w-6 h-6" />
                  </button>

                  <div className="flex items-center gap-2 group/volume relative ml-2">
                    <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors focus:outline-none p-2 rounded-full hover:bg-white/10">
                      {isMuted || volume === 0 ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      onClick={(e) => e.stopPropagation()}
                      className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 h-1 bg-transparent appearance-none outline-none cursor-pointer transition-all duration-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      style={{ background: `linear-gradient(to right, #3b82f6 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%)` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 relative">
                  {/* Settings Menu */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-14 mb-2 bg-black/80 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-2 min-w-[120px] z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-white/60 text-xs font-semibold px-2 mb-1 uppercase tracking-wider">Speed</div>
                        {[0.5, 1, 1.5, 2].map((speed) => (
                          <button
                            key={speed}
                            onClick={(e) => handleSpeedChange(speed, e)}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${playbackRate === speed ? 'bg-blue-500 text-white' : 'text-white hover:bg-white/20'}`}
                          >
                            {speed === 1 ? 'Normal' : `${speed}x`}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} className={`text-white hover:text-blue-400 transition-colors focus:outline-none p-2 rounded-full hover:bg-white/10 ${showSettings ? 'text-blue-400 bg-white/10' : ''}`} title="Settings">
                    <FiSettings className="w-5 h-5" />
                  </button>
                  <button onClick={handleDownload} className="text-white hover:text-blue-400 transition-colors focus:outline-none p-2 rounded-full hover:bg-white/10" title="Download">
                    <FiDownload className="w-5 h-5" />
                  </button>
                  <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors focus:outline-none p-2 rounded-full hover:bg-white/10">
                    {isFullscreen ? <FiMinimize className="w-5 h-5" /> : <FiMaximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomVideoPlayer;

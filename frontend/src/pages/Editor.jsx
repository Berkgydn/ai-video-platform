import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { videoService } from '../services/api';
import {
  Play,
  Pause,
  ChevronLeft,
  Download,
  Save,
  Volume2,
  VolumeX,
  Maximize2,
  SkipBack,
  SkipForward,
} from "lucide-react";

// --- FORMAT YARDIMCILARI ---
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const formatSRTTime = (seconds) => {
  const date = new Date(0);
  date.setSeconds(seconds);
  const timeString = date.toISOString().substr(11, 8);
  const ms = Math.floor((seconds % 1) * 1000)
    .toString()
    .padStart(3, "0");
  return `${timeString},${ms}`;
};

export default function Editor() {
  const { id } = useParams();
  
  // --- STATE YÖNETİMİ (Gerçek Veriler) ---
  const [video, setVideo] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const activeSubtitleRef = useRef(null);

  // --- VERİ YÜKLEME (API) ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [vidRes, subRes] = await Promise.all([
          videoService.getVideo(id),
          videoService.getSubtitles(id)
        ]);
        setVideo(vidRes.data);
        // Backend bazen obje bazen liste dönebilir, kontrol ediyoruz:
        setSubtitles(subRes.data.content || subRes.data || []); 
      } catch (err) {
        console.error("Veri yükleme hatası:", err);
        alert("Video veya altyazı yüklenemedi!");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // --- OYNATICI MANTIĞI ---
  
  // Aktif altyazıya otomatik scroll
  useEffect(() => {
    if (activeSubtitleRef.current) {
      activeSubtitleRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.ended) setIsPlaying(false);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const jumpToTime = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  // --- DÜZENLEME İŞLEMLERİ ---

  const handleTextChange = (index, newText) => {
    const updated = [...subtitles];
    updated[index].text = newText;
    setSubtitles(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await videoService.updateSubtitles(id, subtitles);
      // Başarılı olduğunu kullanıcıya hissettirmek için kısa bir bekleme (opsiyonel)
      await new Promise(r => setTimeout(r, 500)); 
      alert("✅ Değişiklikler başarıyla kaydedildi!");
    } catch (err) {
      console.error(err);
      alert("❌ Kayıt başarısız!");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadSRT = () => {
    if (!subtitles.length) return;
    let srtContent = "";
    subtitles.forEach((sub, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${formatSRTTime(sub.start)} --> ${formatSRTTime(sub.end)}\n`;
      srtContent += `${sub.text.trim()}\n\n`;
    });
    const blob = new Blob([srtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${video?.title || 'video'}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- RENDER ---
  
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#08080c] text-white">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  const currentSubtitle = subtitles.find((sub) => currentTime >= sub.start && currentTime <= sub.end);
  const progress = duration ? (currentTime / duration) * 100 : 0;
  
  // Backend'den gelen dosya yolunu düzeltme (/app/media -> /media)
  // Docker içinde /app/media, dışarıya /media olarak sunuluyor.
  const videoSrc = video ? `http://localhost:8000${video.file_path.replace('/app', '')}` : '';

  return (
    <div className="h-screen flex flex-col bg-[#08080c] overflow-hidden font-sans text-slate-200">
      {/* --- HEADER: Frosted Glass --- */}
      <header className="h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-white/50 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Projeler</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="font-semibold text-white/90 truncate max-w-md text-sm tracking-tight">
             {video?.title}
          </h1>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownloadSRT}
            className="px-4 py-2 text-xs font-medium text-white/70 border border-white/10 rounded-lg hover:bg-white/5 hover:border-white/20 hover:text-white transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            SRT İndir
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </header>

      {/* --- WORKSPACE --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: Video Studio */}
        <div className="flex-1 lg:w-[65%] bg-[#08080c] flex flex-col relative">
          
          {/* Video Area with Ambient Glow */}
          <div
            className="flex-1 flex items-center justify-center p-6 lg:p-10 overflow-hidden relative"
            onClick={togglePlay} // Videoya tıklayınca durdur/oynat
          >
            {/* Ambient Glow Effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] h-[60%] bg-blue-500/20 blur-[120px] rounded-full opacity-50" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[60%] h-[40%] bg-cyan-400/10 blur-[100px] rounded-full opacity-40" />
            </div>

            {/* Video Container */}
            <div className="relative max-h-full max-w-full z-10">
              <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 group">
                {videoSrc && (
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    className="max-h-[60vh] max-w-full cursor-pointer object-contain bg-black"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    controls={false} // Özel kontroller kullanıyoruz
                    playsInline
                  />
                )}

                {/* Subtitle Overlay (Video Üzerinde) */}
                {currentSubtitle && (
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="px-5 py-2.5 bg-black/70 backdrop-blur-sm rounded-lg max-w-[80%]">
                      <p className="text-white text-center text-sm lg:text-base font-medium leading-relaxed">
                        {currentSubtitle.text}
                      </p>
                    </div>
                  </div>
                )}

                {/* Play Button Overlay (Pause durumunda görünür) */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline & Controls */}
          <div className="bg-[#0c0c12] border-t border-white/5 p-5 shrink-0 select-none">
            {/* Progress Bar */}
            <div className="mb-4 relative group">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {/* Hover indicator (İsteğe bağlı) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Time */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-white/90">{formatTime(currentTime)}</span>
                  <span className="text-white/30">/</span>
                  <span className="text-white/40">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Center Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => skip(-5)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all"
                  title="5sn Geri"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white flex items-center justify-center transition-all shadow-lg shadow-blue-500/30 hover:scale-105"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => skip(5)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all"
                  title="5sn İleri"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Subtitle Editor */}
        <div className="hidden lg:flex w-[35%] bg-[#0c0c12]/80 backdrop-blur-xl border-l border-white/5 flex-col z-10">
          {/* Panel Header */}
          <div className="p-4 bg-white/[0.02] border-b border-white/5 flex justify-between items-center shrink-0">
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Altyazı Akışı</h2>
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono font-semibold rounded-md border border-blue-500/20">
              {subtitles.length} Satır
            </span>
          </div>

          {/* Subtitle List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {subtitles.length > 0 ? (
              subtitles.map((sub, index) => {
                const isActive = currentTime >= sub.start && currentTime <= sub.end;
                return (
                  <div
                    key={index}
                    ref={isActive ? activeSubtitleRef : null}
                    className={`group relative pl-4 pr-3 py-3 rounded-xl border transition-all duration-300 ${
                      isActive
                        ? "bg-white/[0.08] border-blue-500/50 shadow-lg shadow-blue-500/10"
                        : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                    }`}
                  >
                    {/* Active Indicator (Neon Line) */}
                    <div
                      className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-b from-blue-400 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                          : "bg-transparent group-hover:bg-white/20"
                      }`}
                    />

                    <div className="flex gap-3">
                      {/* Time Button */}
                      <button
                        onClick={() => jumpToTime(sub.start)}
                        className="flex flex-col gap-0.5 pt-0.5 select-none"
                      >
                        <span
                          className={`text-xs font-mono font-semibold transition-colors ${
                            isActive ? "text-blue-400" : "text-white/40 group-hover:text-blue-400"
                          }`}
                        >
                          {formatTime(sub.start)}
                        </span>
                      </button>

                      {/* Text Editor */}
                      <textarea
                        value={sub.text}
                        onChange={(e) => handleTextChange(index, e.target.value)}
                        className={`flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed min-h-[50px] transition-colors placeholder:text-white/20 ${
                          isActive ? "text-white" : "text-white/60"
                        }`}
                        spellCheck="false"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-white/30">
                <p className="text-sm">Altyazı bulunamadı</p>
              </div>
            )}
            <div className="h-24" /> {/* Alt boşluk */}
          </div>
        </div>
      </div>
    </div>
  );
}
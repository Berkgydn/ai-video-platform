import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { videoService } from '../services/api';
import WaveSurfer from 'wavesurfer.js';

// --- FORMAT YARDIMCILARI ---
const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const date = new Date(seconds * 1000);
    return date.toISOString().substr(14, 5);
};

const formatSRTTime = (seconds) => {
    const date = new Date(0);
    date.setSeconds(seconds);
    const timeString = date.toISOString().substr(11, 8);
    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
    return `${timeString},${ms}`;
};

export default function Editor() {
    const { id } = useParams();
    
    // Data States
    const [video, setVideo] = useState(null);
    const [subtitles, setSubtitles] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Player States
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [saving, setSaving] = useState(false);
    
    // Refs
    const videoRef = useRef(null);
    const wavesurferRef = useRef(null);
    const waveformContainerRef = useRef(null);
    const activeSubtitleRef = useRef(null);

    // 1. VERİ YÜKLEME
    useEffect(() => {
        const loadData = async () => {
            try {
                const [vidRes, subRes] = await Promise.all([
                    videoService.getVideo(id),
                    videoService.getSubtitles(id)
                ]);
                setVideo(vidRes.data);
                setSubtitles(subRes.data.content || subRes.data || []); 
            } catch (err) {
                console.error("Hata:", err);
                alert("Veri yüklenemedi.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    // 2. WAVESURFER KURULUMU (Pasif Mod)
    useEffect(() => {
        if (video && videoRef.current && waveformContainerRef.current && !wavesurferRef.current) {
            wavesurferRef.current = WaveSurfer.create({
                container: waveformContainerRef.current,
                waveColor: '#475569',      // Koyu gri (Slate-600)
                progressColor: '#3b82f6',  // Mavi (Blue-500)
                cursorWidth: 0,            // İmleç çizgisini gizle (Custom player kullanıyoruz)
                barWidth: 2,
                barGap: 3,
                barRadius: 3,
                height: 48,                // Daha kompakt yükseklik
                media: videoRef.current,   // Videoya bağla
                interact: false,           // <--- KRİTİK: Tıklamayı engeller
                minPxPerSec: 30,           // Geniş görünüm
                normalize: true,
            });

            // Temizlik
            return () => {
                if (wavesurferRef.current) {
                    wavesurferRef.current.destroy();
                    wavesurferRef.current = null;
                }
            };
        }
    }, [video]);

    // 3. AUTO SCROLL
    useEffect(() => {
        if (activeSubtitleRef.current) {
            activeSubtitleRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentTime]);

    // 4. PLAYER MANTIĞI
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
            // Video bittiyse ikonu durdur
            if (videoRef.current.ended) setIsPlaying(false);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    // Slider değiştiğinde videoyu sar
    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    // 5. EDITOR İŞLEMLERİ
    const handleTextChange = (index, newText) => {
        const updated = [...subtitles];
        updated[index].text = newText;
        setSubtitles(updated);
    };

    const jumpToTime = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await videoService.updateSubtitles(id, subtitles);
            alert("Kayıt Başarılı! ✨");
        } catch (err) {
            alert("Kayıt Hatası!");
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
        const blob = new Blob([srtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${video.title}.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-400">Stüdyo hazırlanıyor...</div>;

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
            
            {/* --- HEADER --- */}
            <header className="h-16 bg-white border-b border-slate-200 px-6 flex justify-between items-center z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <a href="/" className="text-slate-500 hover:text-slate-800 transition flex items-center gap-2 text-sm font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        Projeler
                    </a>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <h1 className="font-bold text-slate-800 truncate max-w-md text-sm">{video?.title}</h1>
                </div>

                <div className="flex gap-2">
                    <button onClick={handleDownloadSRT} className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        SRT İndir
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="px-6 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </header>

            {/* --- WORKSPACE --- */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* SOL PANEL: Video Stüdyosu */}
                <div className="w-[65%] bg-slate-900 flex flex-col relative">
                    
                    {/* Video Alanı */}
                    <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative" onClick={togglePlay}>
                        {video && (
                            <video 
                                ref={videoRef}
                                src={`http://localhost:8000${video.file_path.replace('/app', '')}`} 
                                className="max-h-full max-w-full rounded-lg shadow-2xl cursor-pointer"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                controls={false} // Native kontrolleri kapattık
                            />
                        )}
                        
                        {/* Dev Play İkonu (Video Durduğunda) */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer pointer-events-none">
                                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/20">
                                    <svg className="ml-2 text-white fill-white" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeline & Controls Alanı */}
                    <div className="bg-slate-950 border-t border-slate-800 p-4 shrink-0 select-none">
                        
                        {/* 1. Üst Kısım: Progress Bar */}
                        <div className="flex items-center gap-4 mb-3">
                            <span className="text-xs font-mono text-slate-400 w-12 text-right">{formatTime(currentTime)}</span>
                            
                            {/* Özel Range Input (Slider) */}
                            <input 
                                type="range" 
                                min="0" 
                                max={duration || 100} 
                                value={currentTime} 
                                onChange={handleSeek}
                                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                            />
                            
                            <span className="text-xs font-mono text-slate-500 w-12">{formatTime(duration)}</span>
                        </div>

                        {/* 2. Alt Kısım: Play Butonu ve Waveform */}
                        <div className="flex items-center gap-6 h-12">
                            {/* Play/Pause Butonu */}
                            <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition border border-slate-700 shrink-0">
                                {isPlaying ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                ) : (
                                    <svg className="ml-1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                )}
                            </button>

                            {/* Waveform Container (Sadece Görsel) */}
                            <div className="flex-1 h-full relative opacity-80 pointer-events-none">
                                <div ref={waveformContainerRef} className="absolute inset-0 top-2"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAĞ PANEL: Altyazı Editörü */}
                <div className="w-[35%] bg-white border-l border-slate-200 flex flex-col z-10 shadow-xl">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center backdrop-blur shrink-0">
                        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Altyazılar</h2>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-mono font-bold rounded">
                            {subtitles.length} Satır
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                        {subtitles.length > 0 ? (
                            subtitles.map((sub, index) => {
                                const isActive = currentTime >= sub.start && currentTime <= sub.end;
                                return (
                                    <div 
                                        key={index}
                                        ref={isActive ? activeSubtitleRef : null} 
                                        className={`group relative pl-4 pr-3 py-3 rounded-xl border transition-all duration-300
                                            ${isActive 
                                                ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02] z-10' 
                                                : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}
                                    >
                                        {/* Aktiflik Çizgisi (Sol) */}
                                        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all
                                            ${isActive ? 'bg-blue-500' : 'bg-transparent group-hover:bg-slate-200'}`}>
                                        </div>

                                        <div className="flex gap-3">
                                            {/* Zaman */}
                                            <div 
                                                onClick={() => jumpToTime(sub.start)}
                                                className="flex flex-col gap-1 pt-1 cursor-pointer select-none"
                                            >
                                                <span className={`text-xs font-mono font-bold transition-colors
                                                    ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
                                                    {formatTime(sub.start)}
                                                </span>
                                            </div>

                                            {/* Textarea */}
                                            <textarea
                                                value={sub.text}
                                                onChange={(e) => handleTextChange(index, e.target.value)}
                                                className={`flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed min-h-[50px] transition-colors
                                                    ${isActive ? 'text-slate-800 font-medium' : 'text-slate-500'}`}
                                                spellCheck="false"
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                                <p className="text-sm">Altyazı yok</p>
                            </div>
                        )}
                        <div className="h-24"></div>
                    </div>
                </div>

            </div>
        </div>
    );
}
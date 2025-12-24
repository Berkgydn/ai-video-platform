import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { videoService } from '../services/api';

export default function Editor() {
    const { id } = useParams();
    const [video, setVideo] = useState(null);
    const [subtitles, setSubtitles] = useState([]);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef(null);

    // Verileri Yükle
    useEffect(() => {
        const loadData = async () => {
            try {
                const [vidRes, subRes] = await Promise.all([
                    videoService.getVideo(id),
                    videoService.getSubtitles(id)
                ]);
                setVideo(vidRes.data);
                // Subtitles bir obje dönerse content'i al, liste dönerse direkt al
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

    // Altyazı Metnini Güncelleme
    const handleTextChange = (index, newText) => {
        const updated = [...subtitles];
        updated[index].text = newText;
        setSubtitles(updated);
    };

    // Kaydetme İşlemi
    const handleSave = async () => {
        try {
            await videoService.updateSubtitles(id, subtitles);
            alert("✅ Değişiklikler kaydedildi!");
        } catch (err) {
            console.error(err);
            alert("❌ Kayıt başarısız!");
        }
    };

    // Altyazıya tıklandığında videoyu o saniyeye götür
    const jumpToTime = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            videoRef.current.play();
        }
    };

    if (loading) return <div className="text-center p-10">Yükleniyor...</div>;

    return (
        <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
            {/* Üst Bar */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <h1 className="font-bold text-lg text-slate-700 truncate max-w-xl">
                    ✏️ Düzenleniyor: {video?.title}
                </h1>
                <div className="flex gap-3">
                    <a href="/" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition">
                        ← Geri Dön
                    </a>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2">
                        <span>Kaydet</span>
                    </button>
                </div>
            </header>

            {/* Ana İçerik (Split View) */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* SOL: Video Alanı */}
                <div className="w-2/3 bg-black flex items-center justify-center relative group">
                    {video && (
                        <video 
                            ref={videoRef}
                            src={`http://localhost:8000${video.file_path.replace('/app', '')}`} 
                            controls 
                            className="max-h-full max-w-full shadow-2xl"
                        />
                    )}
                </div>

                {/* SAĞ: Altyazı Editörü */}
                <div className="w-1/3 bg-white border-l border-slate-200 flex flex-col">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Altyazı Akışı</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                        {subtitles.map((sub, index) => (
                            <div key={index} className="flex gap-3 group">
                                {/* Zaman Damgası (Tıklanabilir) */}
                                <div 
                                    onClick={() => jumpToTime(sub.start)}
                                    className="w-16 pt-2 text-xs font-mono text-blue-500 cursor-pointer hover:underline opacity-60 group-hover:opacity-100 transition text-right"
                                >
                                    {new Date(sub.start * 1000).toISOString().substr(14, 5)}
                                </div>
                                
                                {/* Editlenebilir Alan */}
                                <textarea
                                    value={sub.text}
                                    onChange={(e) => handleTextChange(index, e.target.value)}
                                    className="flex-1 p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-700 text-sm resize-none shadow-sm transition min-h-[80px]"
                                />
                            </div>
                        ))}
                        
                        {subtitles.length === 0 && (
                            <div className="text-center text-slate-400 mt-10">
                                Altyazı bulunamadı.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
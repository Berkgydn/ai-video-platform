import React, { useEffect, useState } from 'react';
// deleteVideo fonksiyonunu da import etmeyi unutma (api.js'den)
import { videoService, deleteVideo } from '../services/api'; 
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const [videos, setVideos] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Videoları Yükle
    const fetchVideos = async () => {
        try {
            const res = await videoService.getAllVideos();
            setVideos(res.data);
        } catch (err) {
            console.error("Videolar yüklenemedi:", err);
        }
    };

    useEffect(() => {
        fetchVideos();
        // 5 saniyede bir listeyi yenile
        const interval = setInterval(fetchVideos, 5000);
        return () => clearInterval(interval);
    }, []);

    // Dosya Seçme ve Yükleme
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await videoService.uploadVideo(formData);
            await fetchVideos(); // Listeyi güncelle
            alert("Video yüklendi, işleniyor...");
        } catch (err) {
            alert("Yükleme hatası!");
            console.error(err);
        } finally {
            setUploading(false);
            e.target.value = null; // Input'u temizle
        }
    };

    // --- YENİ EKLENEN SİLME FONKSİYONU ---
    const handleDelete = async (e, videoId) => {
        // Link'in çalışmasını ve sayfaya gitmesini engelle
        e.preventDefault(); 
        e.stopPropagation();

        if (window.confirm("Bu videoyu kalıcı olarak silmek istediğinize emin misiniz?")) {
            try {
                // API'ye istek at
                await deleteVideo(videoId);
                
                // Başarılı olursa listeyi güncelle (State'ten çıkar)
                setVideos((prevVideos) => prevVideos.filter(v => v.id !== videoId));
            } catch (err) {
                console.error("Silme hatası:", err);
                alert("Video silinemedi, lütfen tekrar deneyin.");
            }
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Projelerim</h1>
                <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition ${uploading ? 'opacity-50' : ''}`}>
                    {uploading ? 'Yükleniyor...' : '+ Yeni Video'}
                    <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} disabled={uploading} />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                    <Link to={`/editor/${video.id}`} key={video.id} className="block group relative">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                            
                            {/* Üst Kısım (Thumbnail) */}
                            <div className="h-40 bg-slate-100 flex items-center justify-center relative">
                                <span className="text-4xl">🎬</span>
                                
                                {/* Durum Rozeti */}
                                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold uppercase
                                    ${video.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                      video.status === 'failed' ? 'bg-red-100 text-red-700' : 
                                      'bg-yellow-100 text-yellow-700'}`}>
                                    {video.status}
                                </div>

                                {/* --- SİLME BUTONU (Sağ Üst Köşe) --- */}
                                <button 
                                    onClick={(e) => handleDelete(e, video.id)}
                                    className="absolute top-2 right-2 bg-white/80 hover:bg-red-500 hover:text-white text-slate-600 p-2 rounded-full transition-all shadow-sm opacity-0 group-hover:opacity-100 z-10"
                                    title="Videoyu Sil"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            {/* Alt Kısım (Bilgiler) */}
                            <div className="p-4">
                                <h3 className="font-semibold text-lg text-slate-800 truncate group-hover:text-blue-600">{video.title}</h3>
                                <p className="text-sm text-slate-500 mt-1">{new Date(video.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </Link>
                ))}
                
                {videos.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                        Henüz video yok. Sağ üstten yüklemeye başla!
                    </div>
                )}
            </div>
        </div>
    );
}
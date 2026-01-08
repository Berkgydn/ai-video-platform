import React, { useEffect, useState } from "react"
// Yolu düzelttik: @ yerine ../ kullandık
import { videoService, deleteVideo } from "../services/api"
// Link bileşenini react-router-dom'dan aldık
import { Link } from "react-router-dom"

export default function Dashboard() {
  const [videos, setVideos] = useState([])
  const [uploading, setUploading] = useState(false)

  // Videoları Yükle
  const fetchVideos = async () => {
    try {
      const res = await videoService.getAllVideos()
      setVideos(res.data)
    } catch (err) {
      console.error("Videolar yüklenemedi:", err)
    }
  }

  useEffect(() => {
    fetchVideos()
    // 5 saniyede bir listeyi yenile
    const interval = setInterval(fetchVideos, 5000)
    return () => clearInterval(interval)
  }, [])

  // Dosya Seçme ve Yükleme
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    setUploading(true)
    try {
      await videoService.uploadVideo(formData)
      await fetchVideos() // Listeyi güncelle
      alert("Video yüklendi, işleniyor...")
    } catch (err) {
      alert("Yükleme hatası!")
      console.error(err)
    } finally {
      setUploading(false)
      e.target.value = null // Input'u temizle
    }
  }

  // Silme Fonksiyonu
  const handleDelete = async (e, videoId) => {
    // Link'in çalışmasını ve sayfaya gitmesini engelle
    e.preventDefault()
    e.stopPropagation()

    if (window.confirm("Bu videoyu kalıcı olarak silmek istediğinize emin misiniz?")) {
      try {
        // API'ye istek at
        await deleteVideo(videoId)

        // Başarılı olursa listeyi güncelle (State'ten çıkar)
        setVideos((prevVideos) => prevVideos.filter((v) => v.id !== videoId))
      } catch (err) {
        console.error("Silme hatası:", err)
        alert("Video silinemedi, lütfen tekrar deneyin.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12 animate-slide-in-from-top">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Projelerim</h1>
            <p className="text-slate-600">Tüm video projelerinizi yönetin ve düzenleyin</p>
          </div>

          {/* Upload Button */}
          <label
            className={`relative cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 ${uploading ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-2.5">
              {uploading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Yükleniyor...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Yeni Video</span>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} disabled={uploading} />
          </label>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video, index) => (
            <Link
              to={`/editor/${video.id}`} 
              key={video.id}
              className="block group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1">
                {/* Thumbnail Section */}
                <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.1)_25%,rgba(68,68,68,.1)_50%,transparent_50%,transparent_75%,rgba(68,68,68,.1)_75%,rgba(68,68,68,.1))] bg-[length:16px_16px]"></div>
                  </div>

                  {/* Video Icon */}
                  <div className="relative z-10">
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300">🎬</span>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-sm transition-all duration-200
                                            ${
                                              video.status === "completed"
                                                ? "bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/25"
                                                : video.status === "failed"
                                                ? "bg-red-500/90 text-white shadow-lg shadow-red-500/25"
                                                : "bg-amber-500/90 text-white shadow-lg shadow-amber-500/25 animate-pulse"
                                            }`}
                  >
                    {video.status === "completed"
                      ? "✓ Tamamlandı"
                      : video.status === "failed"
                      ? "✕ Başarısız"
                      : "⟳ İşleniyor"}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(e, video.id)}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-red-500 text-slate-600 hover:text-white p-2.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100 z-20 hover:scale-110 active:scale-95"
                    title="Videoyu Sil"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Info Section */}
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-slate-900 truncate group-hover:text-blue-600 transition-colors duration-200 mb-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {new Date(video.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {videos.length === 0 && (
            <div className="col-span-full">
              <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 transition-colors duration-300">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Henüz video yok</h3>
                <p className="text-slate-500 mb-6">Başlamak için ilk videonuzu yükleyin</p>
                <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
                  <span>Sağ üstteki butonu kullanın</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
import React, { useEffect, useState } from "react"
import { videoService, deleteVideo } from "../services/api"
import { Link } from "react-router-dom"

// Desteklenen diller listesi
const AVAILABLE_LANGUAGES = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "İngilizce (English)", flag: "🇺🇸" },
  { code: "de", label: "Almanca (Deutsch)", flag: "🇩🇪" },
  { code: "fr", label: "Fransızca (Français)", flag: "🇫🇷" },
  { code: "es", label: "İspanyolca (Español)", flag: "🇪🇸" },
  { code: "it", label: "İtalyanca (Italiano)", flag: "🇮🇹" },
]

export default function Dashboard() {
  const [videos, setVideos] = useState([])
  const [uploading, setUploading] = useState(false)
  
  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  
  // ---> Kaynak Dil ve Hedef Diller
  const [sourceLang, setSourceLang] = useState("tr") 
  const [selectedLangs, setSelectedLangs] = useState([]) 

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
    const interval = setInterval(fetchVideos, 5000)
    return () => clearInterval(interval)
  }, [])

  // Modal Aç/Kapa
  const openModal = () => {
    setSelectedFile(null)
    setSelectedLangs([])
    setSourceLang("tr") 
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (!uploading) setIsModalOpen(false)
  }

  // Dil Seçim Mantığı (Checkbox)
  const toggleLanguage = (langCode) => {
    setSelectedLangs((prev) => 
      prev.includes(langCode) 
        ? prev.filter((c) => c !== langCode) 
        : [...prev, langCode]
    )
  }

  // Dosya Seçildiğinde
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  // --- KRİTİK DÜZELTME BURADA YAPILDI ---
  const handleUploadStart = async () => {
    if (!selectedFile) return alert("Lütfen bir video dosyası seçin.")

    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("title", selectedFile.name)
    
    // Kaynak Dili ekle
    formData.append("source_language", sourceLang)

    // DÜZELTME: Hedef Dilleri virgülle ayrılmış string olarak gönder (örn: "en,tr")
    if (selectedLangs.length > 0) {
      formData.append("target_languages", selectedLangs.join(","))
    }

    setUploading(true)
    try {
      await videoService.uploadVideo(formData)
      await fetchVideos()
      setIsModalOpen(false)
      alert("Video yüklendi! Önce kaynak dilde işlenecek, sonra seçtiğiniz dillere çevrilecek. 🚀")
    } catch (err) {
      alert("Yükleme hatası oluştu!")
      console.error(err)
    } finally {
      setUploading(false)
      setSelectedFile(null)
      setSelectedLangs([])
    }
  }

  // Silme Fonksiyonu
  const handleDelete = async (e, videoId) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm("Bu videoyu kalıcı olarak silmek istediğinize emin misiniz?")) {
      try {
        await deleteVideo(videoId)
        setVideos((prevVideos) => prevVideos.filter((v) => v.id !== videoId))
      } catch (err) {
        console.error("Silme hatası:", err)
        alert("Video silinemedi.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 animate-fade-in relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12 animate-slide-in-from-top">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Projelerim</h1>
            <p className="text-slate-600">Video projelerinizi yönetin, çevirin ve indirin.</p>
          </div>

          <button
            onClick={openModal}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Yeni Proje</span>
          </button>
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
                {/* Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.1)_25%,rgba(68,68,68,.1)_50%,transparent_50%,transparent_75%,rgba(68,68,68,.1)_75%,rgba(68,68,68,.1))] bg-[length:16px_16px]"></div>
                  </div>
                  <div className="relative z-10">
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300">🎬</span>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-sm shadow-lg ${
                      video.status === "completed" ? "bg-emerald-500/90 text-white" :
                      video.status === "failed" ? "bg-red-500/90 text-white" :
                      "bg-amber-500/90 text-white animate-pulse"
                    }`}>
                    {video.status === "completed" ? "✓ Tamamlandı" :
                     video.status === "failed" ? "✕ Başarısız" : "⟳ İşleniyor"}
                  </div>

                  {/* Delete Button */}
                  <button onClick={(e) => handleDelete(e, video.id)} className="absolute top-3 right-3 bg-white/90 hover:bg-red-500 text-slate-600 hover:text-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all z-20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-slate-900 truncate mb-1">{video.title}</h3>
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                      <span>{new Date(video.created_at).toLocaleDateString("tr-TR")}</span>
                      {/* Eğer çeviri varsa icon göster */}
                      {video.target_languages && video.target_languages.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          +{video.target_languages.length} DİL
                        </span>
                      )}
                      {/* Kaynak Dil Göstergesi */}
                      <span className="text-slate-400 font-mono uppercase border border-slate-200 px-1 rounded">
                        {video.source_language || 'TR'}
                      </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {/* Empty State */}
          {videos.length === 0 && (
             <div className="col-span-full text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500">Henüz hiç video yok. "Yeni Proje" butonuna basarak başla.</p>
             </div>
          )}
        </div>
      </div>

      {/* --- UPLOAD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-in-from-bottom">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Yeni Video Projesi</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* 1. Dosya Seçimi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Video Dosyası</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer border border-slate-200 rounded-xl p-1"
                  />
                </div>
              </div>

              {/* 2. Kaynak Dil Seçimi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Videonun Orijinal Dili Nedir?
                </label>
                <div className="relative">
                  <select
                    value={sourceLang}
                    onChange={(e) => {
                      setSourceLang(e.target.value);
                      // Kaynak dil değişirse, hedef dillerden o dili çıkar (kendine çevrilmesin)
                      if (selectedLangs.includes(e.target.value)) {
                        toggleLanguage(e.target.value);
                      }
                    }}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                  >
                    {AVAILABLE_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* 3. Hedef Diller */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Hangi Dillere Çevrilsin? <span className="text-slate-400 text-xs font-normal">(Opsiyonel)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <label 
                      key={lang.code}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                        // Eğer bu dil kaynak dilse, seçilemez yap
                        lang.code === sourceLang
                          ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200"
                          : "cursor-pointer hover:border-slate-300 hover:bg-slate-50"
                      } ${
                        selectedLangs.includes(lang.code) ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500" : ""
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedLangs.includes(lang.code)}
                        onChange={() => toggleLanguage(lang.code)}
                        disabled={lang.code === sourceLang} // Kaynak dil devre dışı
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 disabled:text-slate-400"
                      />
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm font-medium text-slate-700">{lang.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bilgi Notu */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 text-blue-800 text-sm">
                 <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <p>Video <b>{AVAILABLE_LANGUAGES.find(l=>l.code===sourceLang)?.label}</b> olarak işlenecek, ardından seçili dillere çevrilecektir.</p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                disabled={uploading}
              >
                İptal
              </button>
              
              <button
                onClick={handleUploadStart}
                disabled={!selectedFile || uploading}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/30 transition-all ${
                  (!selectedFile || uploading) 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:bg-blue-700 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                }`}
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Yükleniyor...</span>
                  </div>
                ) : (
                  "İşlemi Başlat"
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
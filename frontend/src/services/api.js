import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_URL,
    // Büyük dosyalar veya yavaş ağlar için timeout'u artırdık
    timeout: 30000, 
});

export const videoService = {
    // Video Yükle
    uploadVideo: (formData) => {
        return api.post('/videos/upload/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    
    // Tüm Videoları Getir
    getAllVideos: () => api.get('/videos/'),
    
    // Tek Video Getir
    getVideo: (id) => api.get(`/videos/${id}`),
    
    // Altyazıları Getir (Dil parametresi eklendi)
    // Artık backend'e: /videos/123/subtitles?language=en şeklinde istek atacak
    getSubtitles: (id, language = null) => {
        return api.get(`/videos/${id}/subtitles`, {
            params: { 
                language: language 
            }
        });
    },
    
    // YENİ: Altyazı Güncelleme (Dil parametresi eklendi)
    updateSubtitles: (id, subtitles, language = null) => {
        return api.put(`/videos/${id}/subtitles`, subtitles, {
            params: {
                language: language
            }
        });
    },
};

export const deleteVideo = async (videoId) => {
    try {
        const response = await api.delete(`/videos/${videoId}`);
        return response.data;
    } catch (error) {
        console.error("Video silinirken hata:", error);
        throw error;
    }
};

export default api;
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_URL,
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
    // Altyazıları Getir
    getSubtitles: (id) => api.get(`/videos/${id}/subtitles`),
    // YENİ: Altyazı Güncelleme
    updateSubtitles: (id, subtitles) => api.put(`/videos/${id}/subtitles`, subtitles),
};

export const deleteVideo = async (videoId) => {
    try {
        // Backend'deki endpoint: DELETE /api/v1/videos/{id}
        const response = await api.delete(`/videos/${videoId}`);
        return response.data;
    } catch (error) {
        console.error("Video silinirken hata:", error);
        throw error;
    }
};


export default api;
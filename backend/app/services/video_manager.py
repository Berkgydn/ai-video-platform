import ffmpeg
import os

class VideoManager:
    @staticmethod
    def extract_audio(video_path: str) -> str:
        """
        Videodan sesi ayrıştırır ve .mp3 olarak kaydeder.
        Geriye ses dosyasının yolunu döndürür.
        """
        base_name = os.path.splitext(video_path)[0]
        audio_path = f"{base_name}.mp3"

        try:
            # Varolan varsa tekrar işlemeyelim
            if os.path.exists(audio_path):
                return audio_path

            # FFmpeg ile sesi al (audio only), mp3 formatında
            stream = ffmpeg.input(video_path)
            stream = ffmpeg.output(stream, audio_path, qscale=0, loglevel="error")
            ffmpeg.run(stream, overwrite_output=True)
            
            return audio_path
        except Exception as e:
            print(f"Ses ayrıştırma hatası: {e}")
            raise e
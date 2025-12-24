import os
import subprocess

def convert_to_h264(input_path: str) -> str:
    """
    Videoyu tarayıcı uyumlu H.264 formatına çevirir.
    Başarılı olursa yeni dosyanın yolunu döner, başarısız olursa eskisini döner.
    """
    directory = os.path.dirname(input_path)
    filename = os.path.basename(input_path)
    name_without_ext = os.path.splitext(filename)[0]
    
    # Yeni dosya adı sonuna "_converted" eklenerek oluşturulur
    output_filename = f"{name_without_ext}_converted.mp4"
    output_path = os.path.join(directory, output_filename)

    print(f"DEBUG: Video dönüştürülüyor: {filename} -> {output_filename}")

    # FFmpeg komutu: H.264 video + AAC ses (En güvenli web formatı)
    command = [
        "ffmpeg", "-i", input_path,
        "-vcodec", "libx264",
        "-acodec", "aac",
        "-movflags", "+faststart", # Videonun webde hızlı yüklenmesini sağlar
        output_path, "-y"
    ]

    try:
        # Komutu çalıştır (çıktıları gizle)
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Eğer yeni dosya oluştysa eskisini sil
        if os.path.exists(output_path):
            os.remove(input_path)
            return output_path
            
    except Exception as e:
        print(f"HATA: Video dönüştürülemedi: {e}")
        return input_path # Hata olursa orijinaliyle devam et

    return input_path
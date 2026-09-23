// Rejects obviously low-effort uploads (WhatsApp-compressed thumbnails,
// random screenshots) before they ever reach Storage — cheap, deterministic,
// no API call needed. Not a quality judge, just a floor.
export const MIN_IMAGE_DIMENSION = 300;

export function checkImageDimensions(file: File): Promise<{ ok: boolean; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        ok: img.naturalWidth >= MIN_IMAGE_DIMENSION && img.naturalHeight >= MIN_IMAGE_DIMENSION,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось прочитать изображение"));
    };
    img.src = url;
  });
}

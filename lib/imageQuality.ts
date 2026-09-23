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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

// Soft, non-blocking check for blur/darkness via Claude vision. Never throws —
// callers should treat any failure as "no warning" and let the user proceed.
export async function checkPhotoQualitySoft(file: File): Promise<{ ok: boolean; reason?: string }> {
  try {
    const base64 = await fileToBase64(file);
    const res = await fetch("/api/check-photo-quality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64, contentType: file.type || "image/jpeg" }),
    });
    if (!res.ok) return { ok: true };
    return await res.json();
  } catch {
    return { ok: true };
  }
}

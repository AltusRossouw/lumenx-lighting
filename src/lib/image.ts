// Browser-side image preparation for the catalogue admin.
//
// Product photos from a phone or a camera are often 8-20 MB. Uploading those
// untouched would make the public product pages slow, so large images are
// downscaled to a 2400px longest edge and encoded as WebP (preserving alpha).
// Small images are sent as-is. The server still validates the magic bytes.

export interface PreparedImage {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
}

const MAX_EDGE = 2400;
const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_EXT = /\.(png|jpe?g|webp)$/i;

const loadImage = (file: File): Promise<{ image: HTMLImageElement; url: string }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    image.src = url;
  });

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.test(file.name)) {
    throw new Error('Only PNG, JPEG or WebP images are supported.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image is larger than the 12 MB upload limit.');
  }

  const { image, url } = await loadImage(file);
  try {
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) throw new Error('Could not read that image.');

    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    if (scale >= 1 && file.size <= 2 * 1024 * 1024) {
      return { blob: file, filename: file.name, width, height };
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) return { blob: file, filename: file.name, width, height };

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.9),
    );
    if (!blob) return { blob: file, filename: file.name, width, height };

    return {
      blob,
      filename: file.name.replace(/\.[^.]+$/, '') + '.webp',
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

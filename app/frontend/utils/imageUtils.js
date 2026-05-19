import UTIF from 'utif2';

/**
 * Convert a TIFF/BMP file to a browser-renderable PNG data URL.
 * For files that browsers can already render, returns the normal data URL.
 */
export function isTiffFile(file) {
  if (!file) return false;
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  return ['.tif', '.tiff'].includes(ext);
}

export function decodeTiffToDataUrl(arrayBuffer) {
  const ifds = UTIF.decode(arrayBuffer);
  if (ifds.length === 0) throw new Error('No pages found in TIFF');

  UTIF.decodeImage(arrayBuffer, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  const { width, height } = ifds[0];

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(new Uint8Array(rgba));
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

/**
 * Read a file and return a renderable data URL.
 * Handles TIFF conversion automatically.
 */
export function readFileAsPreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    if (isTiffFile(file)) {
      reader.onload = (e) => {
        try {
          const dataUrl = decodeTiffToDataUrl(e.target.result);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
}

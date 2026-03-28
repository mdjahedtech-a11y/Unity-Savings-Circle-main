
/**
 * Service to handle background removal using remove.bg API
 */

export async function removeBackground(imageFile: File): Promise<string> {
  const apiKey = import.meta.env.VITE_REMOVE_BG_API_KEY;

  if (!apiKey) {
    throw new Error('Remove.bg API key is not configured. Please add VITE_REMOVE_BG_API_KEY to your environment variables.');
  }

  const formData = new FormData();
  formData.append('image_file', imageFile);
  formData.append('size', 'auto');
  formData.append('bg_color', 'white'); // Set background to white as requested

  try {
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.[0]?.title || 'Failed to remove background');
    }

    const blob = await response.blob();
    
    // Convert blob to base64 and resize to passport size (600x600)
    return await resizeToPassportSize(blob);
  } catch (error: any) {
    console.error('Error in removeBackground:', error);
    throw error;
  }
}

/**
 * Resizes an image blob to a standard passport size (600x600 square)
 */
async function resizeToPassportSize(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 600; // Passport size in pixels (approx 2x2 inches at 300dpi)
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate cropping to maintain square aspect ratio
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      // Draw and resize
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = URL.createObjectURL(blob);
  });
}

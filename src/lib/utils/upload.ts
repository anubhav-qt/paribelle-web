/**
 * File upload utility functions
 */

/**
 * Upload a single image file to the API
 * @param file - The file to upload
 * @param token - Authentication token
 * @param apiUrl - Base API URL (defaults to NEXT_PUBLIC_API_URL)
 * @param endpoint - Upload endpoint (defaults to '/api/v1/upload')
 * @returns Promise with the uploaded file URL
 */
export async function uploadImage(
  file: File,
  token: string,
  apiUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  endpoint: string = '/api/v1/upload'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload ${file.name}`);
  }
  
  const data = await response.json();
  return data.url;
}

/**
 * Upload multiple images
 * @param files - Array of files or FileList to upload
 * @param token - Authentication token
 * @param maxFiles - Maximum number of files to upload (defaults to unlimited)
 * @returns Promise with array of uploaded file URLs
 */
export async function uploadImages(
  files: File[] | FileList,
  token: string,
  maxFiles?: number
): Promise<string[]> {
  const fileArray = Array.from(files);
  const filesToUpload = maxFiles ? fileArray.slice(0, maxFiles) : fileArray;
  
  const uploadPromises = filesToUpload.map(file => uploadImage(file, token));
  return Promise.all(uploadPromises);
}

/**
 * Upload image with progress tracking
 * @param file - The file to upload
 * @param token - Authentication token
 * @param onProgress - Progress callback (0-100)
 * @returns Promise with the uploaded file URL
 */
export async function uploadImageWithProgress(
  file: File,
  token: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(Math.round(percentComplete));
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url);
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    // Send request
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    xhr.open('POST', `${apiUrl}/api/v1/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

/**
 * Convert file to base64 data URL
 * @param file - File to convert
 * @returns Promise with base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (defaults to 5)
 * @param allowedTypes - Allowed MIME types (defaults to common image types)
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5,
  allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }
  
  return { valid: true };
}

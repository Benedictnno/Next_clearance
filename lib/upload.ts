/**
 * Client-side file upload utilities for the clearance system
 * Handles file uploads via API calls
 */

export interface UploadResult {
  originalName: string;
  fileName: string;
  url: string;
  size: number;
  type: string;
  uploadedAt?: string;
}

/**
 * Upload a file to the server via API
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  // Validate file on client side first
  const validation = validateSingleFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);

  // Make API call
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Upload failed');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Upload multiple files
 */
export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  return Promise.all(files.map(file => uploadFile(file)));
}

/**
 * Validate file upload requirements for a specific clearance step
 */
export function validateStepDocuments(
  stepRequirements: any,
  uploadedFiles: File[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if payment receipt is required
  if (stepRequirements.requiresPayment && stepRequirements.requiresReceipt) {
    const hasReceipt = uploadedFiles.some(file => 
      file.name.toLowerCase().includes('receipt') ||
      file.name.toLowerCase().includes('payment')
    );
    
    if (!hasReceipt) {
      errors.push('Payment receipt is required for this step');
    }
  }

  // Check minimum file requirements
  if (uploadedFiles.length === 0) {
    errors.push('At least one document must be uploaded');
  }

  // Validate each file
  uploadedFiles.forEach((file, index) => {
    const validation = validateSingleFile(file);
    if (!validation.isValid) {
      errors.push(`File ${index + 1}: ${validation.error}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate a single file
 */
export function validateSingleFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit'
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload PDF, DOC, DOCX, or image files.'
    };
  }

  return { isValid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Check if file type is supported
 */
export function isFileTypeSupported(mimeType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  return allowedTypes.includes(mimeType);
}


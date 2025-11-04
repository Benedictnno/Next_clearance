'use client';

import { useState } from 'react';
import Image from 'next/image';

interface DocumentViewerProps {
  documentUrl: string;
  fileName?: string;
  fileType?: string;
}

export default function DocumentViewer({ documentUrl, fileName, fileType }: DocumentViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getFileIcon = (type?: string) => {
    if (!type) return '📄';
    
    const typeMap: Record<string, string> = {
      'pdf': '📕',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'webp': '🖼️',
      'doc': '📘',
      'docx': '📘',
    };
    
    const extension = type.toLowerCase().split('/').pop() || '';
    return typeMap[extension] || '📄';
  };

  const canPreview = (type?: string) => {
    if (!type) return false;
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    const extension = type.toLowerCase().split('/').pop() || '';
    return previewableTypes.includes(extension);
  };

  const handlePreview = () => {
    if (canPreview(fileType)) {
      setIsOpen(true);
    } else {
      // Download the file
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = fileName || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <button
        onClick={handlePreview}
        className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
      >
        <span>{getFileIcon(fileType)}</span>
        <span>{canPreview(fileType) ? 'Preview' : 'Download'}</span>
      </button>

      {/* Preview Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {fileName || 'Document Preview'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-4">
              {fileType?.includes('pdf') ? (
                <iframe
                  src={documentUrl}
                  className="w-full h-96 border rounded"
                  title="PDF Preview"
                />
              ) : (
                <Image
                  src={documentUrl}
                  alt="Document Preview"
                  width={800}
                  height={600}
                  className="max-w-full max-h-96 mx-auto object-contain"
                  unoptimized={documentUrl.startsWith('data:')}
                />
              )}
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = documentUrl;
                  link.download = fileName || 'document';
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

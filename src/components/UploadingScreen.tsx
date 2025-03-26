// components/UploadingScreen.tsx
import React from 'react';

interface UploadingScreenProps {
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
}

const UploadingScreen: React.FC<UploadingScreenProps> = ({
  isUploading,
  uploadProgress,
  uploadError,
}) => {
  if (!isUploading && !uploadError) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md transition-opacity duration-300">
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 border border-gray-200/50 transform transition-all duration-300 scale-95 hover:scale-100">
      {isUploading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-pulse">
              <svg className="w-8 h-8 text-indigo-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Processing Your File</h2>
          </div>
          
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 text-center">
          <div className="inline-flex p-3 bg-red-100 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Failed</h2>
            <p className="text-gray-600">{uploadError}</p>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 w-full"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  </div>
  );
};

export default UploadingScreen;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
        {isUploading ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Uploading...</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">{uploadProgress}% completed</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Upload Failed</h2>
            <p className="text-sm text-gray-600">{uploadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-900 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadingScreen;
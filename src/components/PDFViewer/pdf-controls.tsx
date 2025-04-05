import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface PDFControlsProps {
  scale: number;
  currentPage: number;
  numPages: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPageChange: (page: number) => void;
  minScale: number;
  maxScale: number;
}

const PDFControls: React.FC<PDFControlsProps> = ({
  scale,
  currentPage,
  numPages,
  onZoomIn,
  onZoomOut,
  onPageChange,
  minScale,
  maxScale,
}) => {
  return (
    <>
      <div className="flex items-center justify-end space-x-2 p-3 bg-white/80 border-b border-gray-200/50">
        <button
          onClick={onZoomOut}
          disabled={scale <= minScale}
          className={`p-2 rounded-lg transition-all ${scale <= minScale ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100/80 hover:shadow-inner'}`}
          title="Zoom Out"
        >
          <ZoomOut size={18} className="shrink-0" />
        </button>
        <div className="px-3 py-1.5 text-xs font-medium bg-gray-100/80 rounded-lg shadow-inner">
          {Math.round(scale * 100)}%
        </div>
        <button
          onClick={onZoomIn}
          disabled={scale >= maxScale}
          className={`p-2 rounded-lg transition-all ${scale >= maxScale ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100/80 hover:shadow-inner'}`}
          title="Zoom In"
        >
          <ZoomIn size={18} className="shrink-0" />
        </button>
      </div>
      <div className="p-3 flex justify-between items-center bg-white/80 border-t border-gray-200/50 backdrop-blur-sm">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentPage <= 1
              ? 'bg-gray-200/80 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg'
          }`}
        >
          Previous
        </button>
        <span className="text-sm font-medium text-gray-700">
          Page {currentPage} of {numPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= numPages}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentPage >= numPages
              ? 'bg-gray-200/80 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg'
          }`}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default PDFControls;
// components/PDFViewerWrapper.tsx
import React, { useEffect, useState, forwardRef } from 'react';
import PDFViewer from './PDFViewer';
interface PDFViewerWrapperProps {
  fileUrl?: string;
  onPageChange: (page: number) => void;
  onPDFClick: (e: React.MouseEvent, pageNumber: number) => void;
  registerPageRef: (pageNumber: number, element: HTMLElement | null) => void;
  renderPageAnnotations: (pageNumber: number) => JSX.Element[];
  showTextInput: boolean;
  textPosition: { x: number; y: number } | null;
  textInput: string;
  onTextInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTextSubmit: () => void;
  onCancelTextInput: () => void;
  onPdfResize: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  pdfWidth: number;
  // New screenshot event handlers:
  onScreenshotMouseDown: (e: React.MouseEvent, pageNumber: number) => void;
  onScreenshotMouseMove: (e: React.MouseEvent, pageNumber: number) => void;
  onScreenshotMouseUp: (e: React.MouseEvent, pageNumber: number) => void;
  screenshotSelection: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    selecting: boolean;
  };
  currentPage: number;
  screenshotToolActive: boolean;
  pdfContainerRef: React.RefObject<HTMLDivElement>;
}

const PDFViewerWrapper = forwardRef<HTMLDivElement, PDFViewerWrapperProps>(({
  fileUrl,
  onPageChange,
  onPDFClick,
  registerPageRef,
  renderPageAnnotations,
  showTextInput,
  textPosition,
  textInput,
  onTextInputChange,
  onTextSubmit,
  onCancelTextInput,
  onPdfResize,
  pdfWidth,
  onScreenshotMouseDown,
  onScreenshotMouseMove,
  onScreenshotMouseUp,
  screenshotSelection,
  currentPage,
  screenshotToolActive,
  pdfContainerRef
}) => {
  const [pdfSource, setPdfSource] = useState<string | null>(null);

  // Determine the PDF source
  useEffect(() => {
    if (fileUrl) {
      setPdfSource(fileUrl);
    } else {
      setPdfSource(null);
    }
  }, [fileUrl]);

  return (
    <div 
      ref={pdfContainerRef}
      className={`
        flex-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 transition-all duration-300
        ${pdfWidth ? '' : 'w-full'} // Use full width on mobile or when pdfWidth isn't set
      `}
      style={{ 
        width: pdfWidth ? `${pdfWidth}px` : '100%', // Conditional width
        maxWidth: '100%' // Ensure it doesn't overflow on mobile
      }}
    >
      <div className="h-full flex flex-col relative">
        {/* Main PDF Content */}
        <div className="h-full p-1 overflow-auto">
          {pdfSource ? (
            <PDFViewer
              file={pdfSource}
              onLoadSuccess={(numPages) => console.log('PDF loaded with', numPages, 'pages')}
              onPageChange={onPageChange}
              onPageClick={onPDFClick}
              registerPageRef={registerPageRef}
              renderPageAnnotations={renderPageAnnotations}
              // Pass screenshot event handlers to PDFViewer
              onScreenshotMouseDown={onScreenshotMouseDown}
              onScreenshotMouseMove={onScreenshotMouseMove}
              onScreenshotMouseUp={onScreenshotMouseUp}
              screenshotSelection={screenshotSelection}
              currentPage={currentPage}
              screenshotToolActive={screenshotToolActive}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No Document Selected</h3>
              <p className="text-gray-500 max-w-md">Upload a PDF file or provide a URL to begin annotating</p>
            </div>
          )}
        </div>
    
        {/* Floating Text Input */}
        {showTextInput && textPosition && (
          <div
            className="absolute z-50 bg-white rounded-xl shadow-lg p-4 border border-gray-200/80 transform transition-all duration-200"
            style={{
              left: `clamp(10px, ${textPosition.x}px, calc(100% - 260px))`, // Prevent overflow on mobile
              top: `${textPosition.y}px`,
              minWidth: '250px',
              maxWidth: 'calc(100% - 20px)' // Ensure it doesn't overflow screen
            }}
          >
            <textarea
              value={textInput}
              onChange={onTextInputChange}
              className="w-full border border-gray-300/80 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Type your annotation..."
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-3">
              <button
                onClick={onCancelTextInput}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={onTextSubmit}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 rounded-lg shadow-sm transition-all duration-200"
              >
                Add Note
              </button>
            </div>
          </div>
        )}
    
        {/* Resize Handle */}
        <div
          onMouseDown={onPdfResize}
          className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:w-3 hover:bg-indigo-500/30 transition-all duration-200 group hidden md:block"
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 rounded-full group-hover:bg-indigo-600 transition-colors duration-200"></div>
        </div>

        {/* Mobile zoom controls
        <div className="md:hidden flex justify-center gap-4 p-2 bg-white/80 rounded-lg shadow-sm mb-2">
          <button onClick={() => handleZoom(0.8)} className="p-2 rounded-full bg-gray-100">
            <Minus size={18} />
          </button>
          <button onClick={() => handleZoom(1.2)} className="p-2 rounded-full bg-gray-100">
            <Plus size={18} />
          </button>
        </div> */}

      </div>
    </div>
  );
});

export default PDFViewerWrapper;

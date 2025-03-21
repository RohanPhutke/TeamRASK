import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { ZoomIn, ZoomOut } from 'lucide-react';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | null;
  onLoadSuccess: (numPages: number) => void;
  onPageChange?: (page: number) => void;
  onPageClick?: (e: React.MouseEvent, pageNumber: number) => void;
  registerPageRef?: (pageNumber: number, element: HTMLElement | null) => void;
  renderPageAnnotations?: (pageNumber: number) => React.ReactNode;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  file, 
  onLoadSuccess, 
  onPageChange = () => {}, 
  onPageClick = () => {},
  registerPageRef = () => {},
  renderPageAnnotations = () => null,
  className = ''
}) => {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [containerWidth, setContainerWidth] = useState(800);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [pagePositions, setPagePositions] = useState<number[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pageRefs = React.useRef<{[key: number]: React.RefObject<HTMLDivElement>}>({});
  
  // Add zoom state
  const [scale, setScale] = useState(1);
  const MAX_SCALE = 2;
  const MIN_SCALE = 0.5;
  const SCALE_STEP = 0.1;

  useEffect(() => {
    // Update container width on mount and resize
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 40); // Subtract padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    // Track scroll position to determine current page
    const handleScroll = () => {
      if (containerRef.current) {
        setScrollPosition(containerRef.current.scrollTop);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    // Determine current page based on scroll position
    if (pagePositions.length > 0) {
      for (let i = 0; i < pagePositions.length; i++) {
        if (i === pagePositions.length - 1 || 
            (scrollPosition >= pagePositions[i] && scrollPosition < pagePositions[i + 1])) {
          const newPage = i + 1;
          if (newPage !== currentPage) {
            setCurrentPage(newPage);
            onPageChange(newPage);
          }
          break;
        }
      }
    }
  }, [scrollPosition, pagePositions, currentPage, onPageChange]);

  // Initialize page refs when number of pages changes
  useEffect(() => {
    if (numPages > 0) {
      for (let i = 1; i <= numPages; i++) {
        if (!pageRefs.current[i]) {
          pageRefs.current[i] = React.createRef<HTMLDivElement>();
        }
      }
    }
  }, [numPages]);

  // Register page refs with parent component
  useEffect(() => {
    Object.entries(pageRefs.current).forEach(([pageNum, ref]) => {
      registerPageRef(Number(pageNum), ref.current);
    });
  }, [numPages, registerPageRef]);

  // When scale changes, recalculate page positions after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (numPages > 0) {
        for (let i = 1; i <= numPages; i++) {
          recordPagePosition(i);
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [scale, numPages]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onLoadSuccess(numPages);
    
    // Initialize page positions array
    setPagePositions(Array(numPages).fill(0));
  };

  const recordPagePosition = (page: number) => {
    // Calculate and store the position of each page
    if (containerRef.current && page > 0 && page <= numPages) {
      const pageElement = containerRef.current.querySelector(`[data-page-number="${page}"]`);
      if (pageElement) {
        const position = pageElement.getBoundingClientRect().top + 
                         containerRef.current.scrollTop - 
                         containerRef.current.getBoundingClientRect().top;
        
        setPagePositions(prev => {
          const newPositions = [...prev];
          newPositions[page - 1] = position;
          return newPositions;
        });
      }
    }
  };

  const scrollToPage = (pageNumber: number) => {
    if (containerRef.current && pageNumber > 0 && pageNumber <= numPages) {
      const position = pagePositions[pageNumber - 1];
      containerRef.current.scrollTo({
        top: position,
        behavior: 'smooth'
      });
    }
  };

  const handlePageClick = (e: React.MouseEvent, pageNumber: number) => {
    onPageClick(e, pageNumber);
  };

  // Zoom functions
  const zoomIn = () => {
    if (scale < MAX_SCALE) {
      setScale(prevScale => Math.min(prevScale + SCALE_STEP, MAX_SCALE));
    }
  };

  const zoomOut = () => {
    if (scale > MIN_SCALE) {
      setScale(prevScale => Math.max(prevScale - SCALE_STEP, MIN_SCALE));
    }
  };

  const resetZoom = () => {
    setScale(1);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {file ? (
        <>
          <div className="flex items-center justify-end space-x-2 pb-2">
            <button
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE}
              className={`p-1 rounded ${
                scale <= MIN_SCALE 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={resetZoom}
              className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE}
              className={`p-1 rounded ${
                scale >= MAX_SCALE 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
          </div>
          
          <div 
            ref={containerRef}
            className="flex-1 overflow-auto"
          >
            <Document
              file={file}
              onLoadSuccess={handleDocumentLoadSuccess}
              loading={<div className="text-center text-gray-500 py-4">Loading PDF...</div>}
              error={<div className="text-center text-red-500 py-4">Failed to load PDF</div>}
            >
              {Array.from({ length: numPages }, (_, index) => {
                const pageNum = index + 1;
                return (
                  <div 
                    key={`page_${pageNum}`}
                    ref={pageRefs.current[pageNum] || (() => {})}
                    className="mb-4 border-b border-gray-200 pb-4 relative"
                    data-page-number={pageNum}
                    onClick={(e) => handlePageClick(e, pageNum)}
                  >
                    <div className="relative">
                      <Page
                        pageNumber={pageNum}
                        width={containerWidth * scale}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        onRenderSuccess={() => recordPagePosition(pageNum)}
                      />
                      {/* Render annotations for this page - scale position */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                        {renderPageAnnotations(pageNum)}
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-500 mt-2">
                      Page {pageNum} of {numPages}
                    </div>
                  </div>
                );
              })}
            </Document>
          </div>
          <div className="p-2 flex justify-between items-center border-t border-gray-200">
            <button
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`px-3 py-1 rounded text-sm ${
                currentPage <= 1 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              Previous
            </button>
            <span className="text-sm">
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className={`px-3 py-1 rounded text-sm ${
                currentPage >= numPages 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>Please upload a PDF file</p>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
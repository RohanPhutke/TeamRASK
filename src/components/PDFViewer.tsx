// components/PDFViewer.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { ZoomIn, ZoomOut } from 'lucide-react';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | string | null;
  onLoadSuccess: (numPages: number) => void;
  onPageChange?: (page: number) => void;
  onPageClick?: (e: React.MouseEvent, pageNumber: number) => void;
  registerPageRef?: (pageNumber: number, element: HTMLElement | null) => void;
  renderPageAnnotations?: (pageNumber: number) => React.ReactNode;
  className?: string;
  onVisibleTextChange?: (text: string) => void;
  // New screenshot event handlers
  onScreenshotMouseDown?: (e: React.MouseEvent, pageNumber: number) => void;
  onScreenshotMouseMove?: (e: React.MouseEvent, pageNumber: number) => void;
  onScreenshotMouseUp?: (e: React.MouseEvent, pageNumber: number) => void;
  // Props for screenshot overlay:
  screenshotSelection: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    selecting: boolean;
  };
  currentPage: number; // Parent's current page, used for overlay and display
  screenshotToolActive: boolean;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  file, 
  onLoadSuccess, 
  onPageChange = () => {}, 
  onPageClick = () => {},
  registerPageRef = () => {},
  renderPageAnnotations = () => null,
  className = '',
  onVisibleTextChange = () => {},
  onScreenshotMouseDown,
  onScreenshotMouseMove,
  onScreenshotMouseUp,
  screenshotSelection,
  currentPage, // Parent's current page
  screenshotToolActive,
}) => {
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [pagePositions, setPagePositions] = useState<number[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pageRefs = React.useRef<{ [key: number]: React.RefObject<HTMLDivElement> }>({});

  // Only render pages in viewport; no extra buffer.
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const BUFFER_PAGES = 0;
  
  // Zoom state
  const [scale, setScale] = useState(1);
  const MAX_SCALE = 2;
  const MIN_SCALE = 0.5;
  const SCALE_STEP = 0.1;

  // Page height estimation
  const [pageHeights, setPageHeights] = useState<{ [key: number]: number }>({});
  const [averagePageHeight, setAveragePageHeight] = useState(1000);

  // Memoize file
  const memoizedFile = useMemo(() => {
    if (!file) return null;
    return file instanceof File ? file : { url: file };
  }, [file]);

  const handleLoadSuccess = useCallback((pdf: any) => {
    setNumPages(pdf.numPages);
    onLoadSuccess(pdf.numPages);
  }, [onLoadSuccess]);

  // Calculate which pages should be rendered
  const calculateVisiblePages = useCallback(() => {
    if (!containerRef.current || numPages === 0 || pagePositions.length === 0) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;
    const viewportTop = scrollTop;
    const viewportBottom = viewportTop + viewportHeight;
    
    const newVisiblePages: number[] = [];
    
    for (let i = 1; i <= numPages; i++) {
      const pageTop = pagePositions[i - 1] || (averagePageHeight * (i - 1));
      let pageHeight = pageHeights[i] || averagePageHeight;
      const pageBottom = pageTop + pageHeight;
      
      // Check if the page is visible or within buffer
      if (
        (pageTop <= viewportBottom + (BUFFER_PAGES * pageHeight)) && 
        (pageBottom >= viewportTop - (BUFFER_PAGES * pageHeight))
      ) {
        newVisiblePages.push(i);
      }
    }
    
    setVisiblePages(newVisiblePages);
  }, [numPages, pagePositions, averagePageHeight, pageHeights]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 40);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Utility throttle function
  const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function (this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const handleScroll = throttle(() => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setScrollPosition(scrollTop);
        updateCurrentPageFromScroll(scrollTop);
        calculateVisiblePages();
      }
    }, 100); // adjust delay as needed
  
    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [pagePositions, calculateVisiblePages]);

  useEffect(() => {
    calculateVisiblePages();
  }, [scale, numPages, calculateVisiblePages]);

  useEffect(() => {
    if (Object.keys(pageHeights).length > 0) {
      const totalHeight = Object.values(pageHeights).reduce((sum, h) => sum + h, 0);
      setAveragePageHeight(totalHeight / Object.keys(pageHeights).length);
    }
  }, [pageHeights]);

  // Use parent's onPageChange to update current page (no local currentPage state)
  const updateCurrentPageFromScroll = (scrollTop: number) => {
    if (pagePositions.length === 0 || !containerRef.current) return;
    const containerHeight = containerRef.current.clientHeight;
    const midpoint = scrollTop + containerHeight / 2;
    for (let i = 0; i < pagePositions.length; i++) {
      const currentPos = pagePositions[i];
      const nextPos = i < pagePositions.length - 1 ? pagePositions[i + 1] : Infinity;
      if (midpoint >= currentPos && midpoint < nextPos) {
        onPageChange(i + 1);
        break;
      }
    }
  };

  const handleScroll = useCallback((scrollTop: number) => {
    setScrollPosition(scrollTop);
    updateCurrentPageFromScroll(scrollTop);
    calculateVisiblePages();
  }, [calculateVisiblePages, updateCurrentPageFromScroll]);

  useEffect(() => {
    if (numPages > 0) {
      for (let i = 1; i <= numPages; i++) {
        if (!pageRefs.current[i]) {
          pageRefs.current[i] = React.createRef<HTMLDivElement>();
        }
      }
      calculateVisiblePages();
    }
  }, [numPages, calculateVisiblePages]);

  useEffect(() => {
    Object.entries(pageRefs.current).forEach(([pageNum, ref]) => {
      registerPageRef(Number(pageNum), ref.current);
    });
  }, [numPages, registerPageRef]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateAllPagePositions();
    }, 100);
    return () => clearTimeout(timer);
  }, [scale, numPages]);

  const calculateAllPagePositions = () => {
    if (numPages <= 0 || !containerRef.current) return;
    const newPositions: number[] = [];
    let pos = 0;
    for (let i = 1; i <= numPages; i++) {
      if (i === 1) {
        newPositions.push(0);
        const firstPageElement = containerRef.current.querySelector(`[data-page-number="1"]`);
        if (firstPageElement) {
          const h = firstPageElement.getBoundingClientRect().height;
          setPageHeights(prev => ({ ...prev, 1: h }));
          pos += h;
        } else {
          pos += averagePageHeight;
        }
      } else {
        newPositions.push(pos);
        const pageElement = containerRef.current.querySelector(`[data-page-number="${i}"]`);
        if (pageElement) {
          const h = pageElement.getBoundingClientRect().height;
          setPageHeights(prev => ({ ...prev, [i]: h }));
          pos += h;
        } else {
          pos += pageHeights[i] || averagePageHeight;
        }
      }
    }
    setPagePositions(newPositions);
  };

  const recordPagePosition = (page: number) => {
    if (containerRef.current && page > 0 && page <= numPages) {
      const pageElement = containerRef.current.querySelector(`[data-page-number="${page}"]`);
      if (pageElement) {
        const pos = pageElement.getBoundingClientRect().top +
                    containerRef.current.scrollTop -
                    containerRef.current.getBoundingClientRect().top;
        const h = pageElement.getBoundingClientRect().height;
        setPageHeights(prev => ({ ...prev, [page]: h }));
        setPagePositions(prev => {
          const newPos = [...prev];
          newPos[page - 1] = pos;
          return newPos;
        });
        setTimeout(calculateAllPagePositions, 0);
      }
    }
  };


  const scrollToPage = (pageNumber: number) => {
    if (containerRef.current && pageNumber > 0 && pageNumber <= numPages) {
      setVisiblePages(prev => {
        if (!prev.includes(pageNumber)) {
          return [...new Set([...prev, pageNumber])];
        }
        return prev;
      });
      setTimeout(() => {
        if (containerRef.current) {
          const pos = pagePositions[pageNumber - 1] || (averagePageHeight * (pageNumber - 1));
          containerRef.current.scrollTo({ top: pos, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const handlePageClick = (e: React.MouseEvent, pageNumber: number) => {
    onPageClick(e, pageNumber);
  };

  // Zoom functions
  const zoomIn = () => {
    if (scale < MAX_SCALE) {
      setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
    }
  };
  const zoomOut = () => {
    if (scale > MIN_SCALE) {
      setScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE));
    }
  };
  const resetZoom = () => {
    setScale(1);
  };

  const isElementVisible = (el: Element, container: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    return rect.bottom >= cRect.top && rect.top <= cRect.bottom;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleExtractVisibleText = () => {
      const textLayers = container.querySelectorAll('.react-pdf__Page__textContent');
      const texts: string[] = [];
      textLayers.forEach(layer => {
        if (layer instanceof HTMLElement && isElementVisible(layer, container)) {
          texts.push(layer.innerText);
        }
      });
      onVisibleTextChange(texts.join(' '));
    };
    container.addEventListener('scroll', handleExtractVisibleText);
    handleExtractVisibleText();
    return () => container.removeEventListener('scroll', handleExtractVisibleText);
  }, [onVisibleTextChange]);

  const renderPlaceholders = () => {
    const placeholders = [];
    for (let i = 1; i <= numPages; i++) {
      if (!visiblePages.includes(i)) {
        const h = pageHeights[i] || averagePageHeight;
        const pos = pagePositions[i - 1] || (averagePageHeight * (i - 1));
        placeholders.push(
          <div 
            key={`placeholder_${i}`}
            style={{ height: `${h}px`, position: 'absolute', top: `${pos}px`, width: '100%' }}
            data-page-placeholder={i}
          />
        );
      }
    }
    return placeholders;
  };

  const estimatedTotalHeight = numPages > 0 
    ? pagePositions[numPages - 1] + (pageHeights[numPages] || averagePageHeight)
    : 0;

  return (
    <div className={`flex flex-col h-full bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden ${className}`}>
      {file ? (
        <>
          <div className="flex items-center justify-end space-x-2 p-3 bg-white/80 border-b border-gray-200/50">
            <button
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE}
              className={`p-2 rounded-lg transition-all ${scale <= MIN_SCALE ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100/80 hover:shadow-inner'}`}
              title="Zoom Out"
            >
              <ZoomOut size={18} className="shrink-0" />
            </button>
            <div className="px-3 py-1.5 text-xs font-medium bg-gray-100/80 rounded-lg shadow-inner">
              {Math.round(scale * 100)}%
            </div>
            <button
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE}
              className={`p-2 rounded-lg transition-all ${scale >= MAX_SCALE ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100/80 hover:shadow-inner'}`}
              title="Zoom In"
            >
              <ZoomIn size={18} className="shrink-0" />
            </button>
          </div>
          <div ref={containerRef} className="flex-1 overflow-auto relative bg-gray-50/50">
            <Document
              file={memoizedFile}
              onLoadSuccess={handleLoadSuccess}
              loading={
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse text-gray-500 flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-indigo-500/20 rounded-full mb-2"></div>
                    Loading PDF...
                  </div>
                </div>
              }
              error={
                <div className="absolute inset-0 flex items-center justify-center text-red-500">
                  Failed to load PDF
                </div>
              }
            >
              <div style={{ height: `${estimatedTotalHeight}px`, position: 'relative' }}>
                {renderPlaceholders()}
                {visiblePages.map(pageNum => {
                  let overlay = null;
                  if (screenshotToolActive && screenshotSelection.selecting && pageNum === currentPage) {
                    const left = Math.min(screenshotSelection.startX, screenshotSelection.endX);
                    const top = Math.min(screenshotSelection.startY, screenshotSelection.endY);
                    const width = Math.abs(screenshotSelection.endX - screenshotSelection.startX);
                    const height = Math.abs(screenshotSelection.endY - screenshotSelection.startY);
                    overlay = (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${left}px`,
                          top: `${top}px`,
                          width: `${width}px`,
                          height: `${height}px`,
                          border: '2px dashed blue',
                          pointerEvents: 'none',
                          zIndex: 1000,
                        }}
                      />
                    );
                  }
                  return (
                    <div 
                      key={`page_${pageNum}`}
                      ref={pageRefs.current[pageNum] || (() => {})}
                      className="border-b border-gray-200/50 pb-6 absolute w-full"
                      style={{ top: `${pagePositions[pageNum - 1] || (averagePageHeight * (pageNum - 1))}px`, position: 'relative' }}
                      data-page-number={pageNum}
                      onClick={(e) => handlePageClick(e, pageNum)}
                      onMouseDown={(e) => onScreenshotMouseDown && onScreenshotMouseDown(e, pageNum)}
                      onMouseMove={(e) => onScreenshotMouseMove && onScreenshotMouseMove(e, pageNum)}
                      onMouseUp={(e) => onScreenshotMouseUp && onScreenshotMouseUp(e, pageNum)}
                    >
                      <div className="relative shadow-sm">
                        <Page
                          pageNumber={pageNum}
                          width={containerWidth * scale}
                          scale={scale}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          onRenderSuccess={() => recordPagePosition(pageNum)}
                        />
                        <div style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%', 
                          transform: `scale(${scale})`, 
                          transformOrigin: 'top left' 
                        }}>
                          {renderPageAnnotations(pageNum)}
                        </div>
                        {overlay}
                      </div>
                      <div className="text-center text-xs text-gray-500 mt-3">
                        Page {pageNum} of {numPages}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Document>
          </div>
          <div className="p-3 flex justify-between items-center bg-white/80 border-t border-gray-200/50 backdrop-blur-sm">
            <button
              onClick={() => scrollToPage(currentPage - 1)}
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
              onClick={() => scrollToPage(currentPage + 1)}
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
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100/50">
          <div className="w-20 h-20 mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-inner">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-1">No Document Loaded</h3>
          <p className="text-gray-500 max-w-md">Upload a PDF file to begin reading</p>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;

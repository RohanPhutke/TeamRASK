import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { ZoomIn, ZoomOut } from 'lucide-react';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// CSS for text selection
const customStyles = `
  .select-text {
    user-select: auto !important;
    cursor: text !important;
  }
  .react-pdf__Page__textContent {
    cursor: text !important;
    user-select: text !important;
  }
`;

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
  currentPage,
  screenshotToolActive,
}) => {
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const pageHeightsRef = useRef<{ [key: number]: number }>({});
  const pagePositionsRef = useRef<number[]>([]);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const lastScrollPositionRef = useRef<number>(0);
  
  // Optimize page rendering with a larger buffer for smoother experience
  const [visiblePageRange, setVisiblePageRange] = useState<[number, number]>([1, 5]);
  const BUFFER_PAGES = 2; // Increased buffer for smoother scrolling
  
  // Zoom state
  const [scale, setScale] = useState(1);
  const MAX_SCALE = 2;
  const MIN_SCALE = 0.5;
  const SCALE_STEP = 0.1;

  // Virtual list for page elements
  const [estimatedTotalHeight, setEstimatedTotalHeight] = useState(0);
  const [averagePageHeight, setAveragePageHeight] = useState(1000);
  
  // Memoize file to prevent unnecessary rerenders
  const memoizedFile = useMemo(() => {
    if (!file) return null;
    return file instanceof File ? file : { url: file };
  }, [file]);

  const handleLoadSuccess = useCallback((pdf: any) => {
    setNumPages(pdf.numPages);
    onLoadSuccess(pdf.numPages);
    
    // Reset page heights and positions on new document load
    pageHeightsRef.current = {};
    pagePositionsRef.current = [];
    setVisiblePageRange([1, Math.min(5, pdf.numPages)]);
    
    // Initialize virtual list approximations
    const initialHeight = window.innerHeight;
    setAveragePageHeight(initialHeight * 0.9);
    setEstimatedTotalHeight(initialHeight * 0.9 * pdf.numPages);
  }, [onLoadSuccess]);

  // Efficient throttle function
  const throttle = useCallback((fn: Function, delay: number) => {
    let lastCall = 0;
    return function(...args: any[]) {
      const now = Date.now();
      if (now - lastCall < delay) return;
      lastCall = now;
      return fn(...args);
    };
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = customStyles;
    document.head.appendChild(style);
  }, []);

  // Update container width when window resizes
  useEffect(() => {
    const updateWidth = throttle(() => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 40);
      }
    }, 100);
    
    updateWidth();
    
    // Use ResizeObserver for more efficient resize detection
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(updateWidth);
      resizeObserver.observe(containerRef.current);
      resizeObserverRef.current = resizeObserver;
    }
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [throttle]);

  // Calculate which pages should be in view based on scroll position
  const calculateVisiblePages = useCallback(() => {
    if (!containerRef.current || numPages === 0) return;
    
    const container = containerRef.current;
    const viewportTop = container.scrollTop;
    const viewportHeight = container.clientHeight;
    const viewportBottom = viewportTop + viewportHeight;
    
    // Find the first visible page
    let firstVisiblePage = 1;
    for (let i = 1; i <= numPages; i++) {
      const pageTop = pagePositionsRef.current[i - 1] || ((i - 1) * averagePageHeight);
      const pageHeight = pageHeightsRef.current[i] || averagePageHeight;
      const pageBottom = pageTop + pageHeight;
      
      if (pageBottom >= viewportTop) {
        firstVisiblePage = i;
        break;
      }
    }
    
    // Find the last visible page
    let lastVisiblePage = firstVisiblePage;
    for (let i = firstVisiblePage; i <= numPages; i++) {
      const pageTop = pagePositionsRef.current[i - 1] || ((i - 1) * averagePageHeight);
      
      if (pageTop > viewportBottom) {
        lastVisiblePage = i - 1;
        break;
      }
      
      lastVisiblePage = i;
    }
    
    // Add buffer pages for smoother scrolling
    const start = Math.max(1, firstVisiblePage - BUFFER_PAGES);
    const end = Math.min(numPages, lastVisiblePage + BUFFER_PAGES);
    
    setVisiblePageRange([start, end]);
    
    // Update current page based on what's most visible in the viewport
    const midpoint = viewportTop + viewportHeight / 2;
    for (let i = 0; i < numPages; i++) {
      const pageTop = pagePositionsRef.current[i] || (i * averagePageHeight);
      const pageHeight = pageHeightsRef.current[i + 1] || averagePageHeight;
      const pageBottom = pageTop + pageHeight;
      
      if (midpoint >= pageTop && midpoint < pageBottom) {
        onPageChange(i + 1);
        break;
      }
    }
  }, [numPages, averagePageHeight, onPageChange]);

  // Handle scroll events with debouncing
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const currentScrollPosition = containerRef.current.scrollTop;
      
      // Only process if we've scrolled a significant amount
      if (Math.abs(currentScrollPosition - lastScrollPositionRef.current) > 10) {
        lastScrollPositionRef.current = currentScrollPosition;
        
        // Clear previous timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Calculate visible pages immediately for responsiveness
        calculateVisiblePages();
        
        // Schedule a more thorough update after scrolling stops
        scrollTimeoutRef.current = setTimeout(() => {
          calculateVisiblePages();
          updatePageMetrics();
        }, 100);
      }
    };
    
    const throttledScroll = throttle(handleScroll, 16); // ~60fps
    
    const container = containerRef.current;
    container.addEventListener('scroll', throttledScroll);
    return () => {
      container.removeEventListener('scroll', throttledScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [calculateVisiblePages, throttle]);

  // Update when scale changes
  useEffect(() => {
    if (numPages > 0) {
      updatePageMetrics();
      
      // Force recalculation of visible pages after scale change
      const timer = setTimeout(() => {
        calculateVisiblePages();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [scale, numPages, calculateVisiblePages]);

  // Record metrics for a specific page after it renders
  const recordPageMetrics = useCallback((pageNumber: number, element: HTMLElement) => {
    if (!element || !containerRef.current) return;
    
    const pageHeight = element.getBoundingClientRect().height;
    pageHeightsRef.current[pageNumber] = pageHeight;
    
    // Register the page ref for parent component
    registerPageRef(pageNumber, element);
    
    // Update average page height and estimated total height
    const heights = Object.values(pageHeightsRef.current);
    if (heights.length > 0) {
      const newAverageHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
      setAveragePageHeight(newAverageHeight);
      setEstimatedTotalHeight(newAverageHeight * numPages);
    }
    
    // Update position calculations
    updatePageMetrics();
  }, [numPages, registerPageRef]);

  // Calculate positions for all pages
  const updatePageMetrics = useCallback(() => {
    if (numPages <= 0) return;
    
    const newPositions: number[] = [];
    let runningPosition = 0;
    
    for (let i = 1; i <= numPages; i++) {
      newPositions.push(runningPosition);
      const pageHeight = pageHeightsRef.current[i] || averagePageHeight;
      runningPosition += pageHeight;
    }
    
    pagePositionsRef.current = newPositions;
    setEstimatedTotalHeight(runningPosition);
  }, [numPages, averagePageHeight]);

  

  // Extract visible text for search functionality
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleExtractVisibleText = throttle(() => {
      const container = containerRef.current;
      if (!container) return;
      
      const textLayers = container.querySelectorAll('.react-pdf__Page__textContent');
      const visibleTexts: string[] = [];
      
      textLayers.forEach(layer => {
        if (!(layer instanceof HTMLElement)) return;
        
        const rect = layer.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Check if element is visible in container
        if (rect.bottom >= containerRect.top && rect.top <= containerRect.bottom) {
          visibleTexts.push(layer.innerText);
        }
      });
      
      onVisibleTextChange(visibleTexts.join(' '));
    }, 250);
    
    const container = containerRef.current;
    container.addEventListener('scroll', handleExtractVisibleText);
    handleExtractVisibleText();
    
    return () => container.removeEventListener('scroll', handleExtractVisibleText);
  }, [onVisibleTextChange, throttle]);

  // Scroll to a specific page
  const scrollToPage = useCallback((pageNumber: number) => {
    if (!containerRef.current || pageNumber < 1 || pageNumber > numPages) return;
    
    // Ensure the target page is in our visible range
    setVisiblePageRange(prev => {
      const [start, end] = prev;
      if (pageNumber >= start && pageNumber <= end) return prev;
      return [
        Math.max(1, pageNumber - BUFFER_PAGES), 
        Math.min(numPages, pageNumber + BUFFER_PAGES)
      ];
    });
    
    // Use virtualized position or estimated position
    const pos = pagePositionsRef.current[pageNumber - 1] || ((pageNumber - 1) * averagePageHeight);
    
    // Scroll to that position
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: pos, behavior: 'smooth' });
      }
    }, 10);
  }, [numPages, averagePageHeight]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    if (scale < MAX_SCALE) {
      setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
    }
  }, [scale]);
  
  const zoomOut = useCallback(() => {
    if (scale > MIN_SCALE) {
      setScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE));
    }
  }, [scale]);

  // Create page elements for the visible range
  const renderPages = useCallback(() => {
    if (!numPages) return null;
    
    const [startPage, endPage] = visiblePageRange;
    const pages = [];
    
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const position = pagePositionsRef.current[pageNum - 1] || ((pageNum - 1) * averagePageHeight);
      const height = pageHeightsRef.current[pageNum] || averagePageHeight;
      
      // Create overlay for screenshot tool if needed
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
      
      pages.push(
        <div 
          key={`page_${pageNum}`}
          ref={el => pageRefs.current[pageNum] = el}
          className="border-b border-gray-200/50 pb-6 absolute w-full"
          style={{ 
            top: `${position}px`, 
            height: `${height}px`,
            position: 'absolute',
          }}
          data-page-number={pageNum}
          onClick={(e) => onPageClick(e, pageNum)}
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
              className="select-text"
              onRenderSuccess={(page) => {
                if (pageRefs.current[pageNum]) {
                  recordPageMetrics(pageNum, pageRefs.current[pageNum]!);
                }
              }}
              loading={
                <div 
                  style={{ 
                    width: `${containerWidth}px`, 
                    height: `${averagePageHeight * 0.9}px`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: '#f9fafb'
                  }}
                >
                  <div className="animate-pulse w-8 h-8 rounded-full border-4 border-indigo-300/50"></div>
                </div>
              }
            />
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              transform: `scale(${scale})`, 
              transformOrigin: 'top left',
              pointerEvents: 'none'
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
    }
    
    return pages;
  }, [
    visiblePageRange, 
    numPages, 
    containerWidth, 
    scale, 
    averagePageHeight, 
    onPageClick, 
    onScreenshotMouseDown, 
    onScreenshotMouseMove, 
    onScreenshotMouseUp, 
    renderPageAnnotations, 
    screenshotToolActive, 
    screenshotSelection, 
    currentPage,
    recordPageMetrics
  ]);

  // Create placeholder elements for invisible pages
  const renderPlaceholders = useCallback(() => {
    if (!numPages) return null;
    
    // Generate minimal placeholders for non-visible pages
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${estimatedTotalHeight}px`,
          pointerEvents: 'none',
        }}
      />
    );
  }, [numPages, estimatedTotalHeight]);

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
                {renderPages()}
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

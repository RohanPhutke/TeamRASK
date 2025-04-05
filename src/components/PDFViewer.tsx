import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Document, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import PDFControls from './PDFViewer/pdf-controls';
import PDFPage from './PDFViewer/pdf-page';
import PDFPlaceholder from './PDFViewer/pdf-pageholder';

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
  onScreenshotMouseDown?: (e: React.MouseEvent, pageNumber: number) => void;
  onScreenshotMouseMove?: (e: React.MouseEvent, pageNumber: number) => void;
  onScreenshotMouseUp?: (e: React.MouseEvent, pageNumber: number) => void;
  screenshotSelection: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    selecting: boolean;
  };
  currentPage: number;
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
  
  const [visiblePageRange, setVisiblePageRange] = useState<[number, number]>([1, 5]);
  const BUFFER_PAGES = 2;
  
  const [scale, setScale] = useState(1);
  const MAX_SCALE = 2;
  const MIN_SCALE = 0.5;
  const SCALE_STEP = 0.1;

  const [estimatedTotalHeight, setEstimatedTotalHeight] = useState(0);
  const [averagePageHeight, setAveragePageHeight] = useState(1000);
  
  const memoizedFile = useMemo(() => {
    if (!file) return null;
    return file instanceof File ? file : { url: file };
  }, [file]);

  const getPageRef = useCallback((pageNumber: number) => {
    return (el: HTMLDivElement | null) => {
      pageRefs.current[pageNumber] = el;
      registerPageRef(pageNumber, el);
    };
  }, [registerPageRef]);

  const handleLoadSuccess = useCallback((pdf: any) => {
    setNumPages(pdf.numPages);
    onLoadSuccess(pdf.numPages);
    pageHeightsRef.current = {};
    pagePositionsRef.current = [];
    setVisiblePageRange([1, Math.min(5, pdf.numPages)]);
    const initialHeight = window.innerHeight;
    setAveragePageHeight(initialHeight * 0.9);
    setEstimatedTotalHeight(initialHeight * 0.9 * pdf.numPages);
  }, [onLoadSuccess]);

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

  // ... (keep all the existing hooks and functions, but update the render method)
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
  

    const renderPages = useCallback(() => {
        if (!numPages) return null;
        
        const [startPage, endPage] = visiblePageRange;
        const pages = [];
        
        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
          const position = pagePositionsRef.current[pageNum - 1] || ((pageNum - 1) * averagePageHeight);
          const height = pageHeightsRef.current[pageNum] || averagePageHeight;
          
          pages.push(
            <PDFPage
              key={`page_${pageNum}`}
              ref={getPageRef(pageNum)}
              pageNumber={pageNum}
              containerWidth={containerWidth}
              scale={scale}
              onRenderSuccess={recordPageMetrics}
              averagePageHeight={averagePageHeight}
              renderPageAnnotations={renderPageAnnotations}
              onPageClick={onPageClick}
              onScreenshotMouseDown={onScreenshotMouseDown}
              onScreenshotMouseMove={onScreenshotMouseMove}
              onScreenshotMouseUp={onScreenshotMouseUp}
              screenshotToolActive={screenshotToolActive}
              screenshotSelection={screenshotSelection}
              currentPage={currentPage}
              position={position}
              height={height}
              numPages={numPages}
            />
          );
        }
        
        return pages;
      }, [visiblePageRange, numPages, containerWidth, scale, averagePageHeight, 
      onPageClick, onScreenshotMouseDown, onScreenshotMouseMove, onScreenshotMouseUp, 
      renderPageAnnotations, screenshotToolActive, screenshotSelection, currentPage, 
      recordPageMetrics, registerPageRef]);

  return (
    <div className={`flex flex-col h-full bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden ${className}`}>
      {file ? (
        <>
          <PDFControls
            scale={scale}
            currentPage={currentPage}
            numPages={numPages}
            onZoomIn={() => setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE))}
            onZoomOut={() => setScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE))}
            onPageChange={(page) => scrollToPage(page)}
            minScale={MIN_SCALE}
            maxScale={MAX_SCALE}
          />
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
                {renderPages()}
              </div>
            </Document>
          </div>
        </>
      ) : (
        <PDFPlaceholder />
      )}
    </div>
  );
};

export default PDFViewer;
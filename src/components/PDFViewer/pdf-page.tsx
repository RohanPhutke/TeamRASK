import React, { forwardRef } from 'react';
import { Page } from 'react-pdf';

interface PDFPageProps {
  pageNumber: number;
  containerWidth: number;
  scale: number;
  onRenderSuccess: (pageNumber: number, element: HTMLElement) => void;
  averagePageHeight: number;
  renderPageAnnotations: (pageNumber: number) => React.ReactNode;
  onPageClick: (e: React.MouseEvent, pageNumber: number) => void;
  onScreenshotMouseDown?: (e: React.MouseEvent, pageNumber: number) => void;
  onScreenshotMouseMove?: (e: React.MouseEvent, pageNumber: number) => void;
  onScreenshotMouseUp?: (e: React.MouseEvent, pageNumber: number) => void;
  screenshotToolActive: boolean;
  screenshotSelection: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    selecting: boolean;
  };
  currentPage: number;
  position: number;
  height: number;
  numPages: number;
}

const PDFPage = forwardRef<HTMLDivElement, PDFPageProps>(({
  pageNumber,
  containerWidth,
  scale,
  onRenderSuccess,
  averagePageHeight,
  renderPageAnnotations,
  onPageClick,
  onScreenshotMouseDown,
  onScreenshotMouseMove,
  onScreenshotMouseUp,
  screenshotToolActive,
  screenshotSelection,
  currentPage,
  position,
  height,
  numPages,
}, ref) => {
  let overlay = null;
  if (screenshotToolActive && screenshotSelection.selecting && pageNumber === currentPage) {
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
      ref={ref}
      className="border-b border-gray-200/50 pb-6 absolute w-full"
      style={{ 
        top: `${position}px`, 
        height: `${height}px`,
        position: 'absolute',
      }}
      data-page-number={pageNumber}
      onClick={(e) => onPageClick(e, pageNumber)}
      onMouseDown={(e) => onScreenshotMouseDown && onScreenshotMouseDown(e, pageNumber)}
      onMouseMove={(e) => onScreenshotMouseMove && onScreenshotMouseMove(e, pageNumber)}
      onMouseUp={(e) => onScreenshotMouseUp && onScreenshotMouseUp(e, pageNumber)}
    >
      <div className="relative shadow-sm">
        <Page
          pageNumber={pageNumber}
          width={containerWidth * scale}
          scale={scale}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          className="select-text"
          onRenderSuccess={() => {
            if (ref && typeof ref !== 'function' && ref.current) {
              onRenderSuccess(pageNumber, ref.current);
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
          {renderPageAnnotations(pageNumber)}
        </div>
        {overlay}
      </div>
      <div className="text-center text-xs text-gray-500 mt-3">
        Page {pageNumber} of {numPages}
      </div>
    </div>
  );
});

PDFPage.displayName = 'PDFPage';

export default PDFPage;
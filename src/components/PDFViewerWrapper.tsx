// components/PDFViewerWrapper.tsx
import React, { useRef } from 'react';
import PDFViewer from './PDFViewer';

interface PDFViewerWrapperProps {
  selectedFile: File | null;
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
}

const PDFViewerWrapper: React.FC<PDFViewerWrapperProps> = ({
  selectedFile,
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
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="flex-1 bg-white rounded-xl shadow-lg p-1 overflow-hidden"
      style={{ width: `${pdfWidth}px` }}
    >
      <div ref={viewerRef} className="h-full flex flex-col relative">
        <div className="h-full">
          <PDFViewer
            file={selectedFile}
            onLoadSuccess={(numPages) => console.log('PDF loaded with', numPages, 'pages')}
            onPageChange={onPageChange}
            onPageClick={onPDFClick}
            registerPageRef={registerPageRef}
            renderPageAnnotations={renderPageAnnotations}
          />
        </div>
        {showTextInput && textPosition && (
          <div
            className="absolute z-50 bg-white rounded shadow-lg p-2"
            style={{
              left: `${textPosition.x}px`,
              top: `${textPosition.y}px`,
            }}
          >
            <textarea
              value={textInput}
              onChange={onTextInputChange}
              className="w-full border rounded p-2 text-sm"
              placeholder="Add a note..."
              rows={3}
              autoFocus
            />
            <div className="flex justify-end mt-2 gap-2">
              <button
                onClick={onCancelTextInput}
                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={onTextSubmit}
                className="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Add Note
              </button>
            </div>
          </div>
        )}
        <div
          onMouseDown={onPdfResize}
          className="absolute top-0 right-0 w-2 h-full cursor-ew-resize bg-gray-300"
        />
      </div>
    </div>
  );
};

export default PDFViewerWrapper;
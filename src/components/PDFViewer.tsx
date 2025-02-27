import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | null;
  onLoadSuccess?: (numPages: number) => void;
  className?: string;
}

export default function PDFViewer({ file, onLoadSuccess, className }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    if (!file) setNumPages(null);
  }, [file]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onLoadSuccess?.(numPages);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      {file ? (
        <Document
          file={file}
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={
            <div className="text-center text-gray-500 py-4">
              Loading PDF...
            </div>
          }
          error={
            <div className="text-center text-red-500 py-4">
              Failed to load PDF
            </div>
          }
        >
          <div className="overflow-y-auto max-h-[80vh]">
            {Array.from({ length: numPages || 0 }, (_, index) => (
              <div key={`page_${index + 1}`} className="mb-4">
                <Page
                  pageNumber={index + 1}
                  width={containerWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={true}
                  className="border"
                />
                <div className="text-center text-sm text-gray-500 mt-2">
                  Page {index + 1} of {numPages}
                </div>
              </div>
            ))}
          </div>
        </Document>
      ) : (
        <div className="text-center text-gray-500 py-4">
          No PDF file selected
        </div>
      )}
    </div>
  );
}
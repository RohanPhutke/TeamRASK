import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Navbar from './components/Navbar';
import { ChevronLeft, ChevronRight, Highlighter, Undo, Redo, Type, Eraser } from 'lucide-react';
import ChatInterface from './components/ChatInterface';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Book {
  id: number;
  content: string;
}

type Tool = 'highlight' | 'text' | 'eraser' | null;

function App() {
  const [currentPdf, setCurrentPdf] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth); // Subtract padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.scrollTop = 0;
    }
  }, [pageNumber]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentPdf(event.target?.result as string);
        setPageNumber(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages || 1);
    });
  };

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool === selectedTool ? null : tool);
  };

  const handleUndo = () => {
    // Implement undo logic here
    console.log('Undo');
  };

  const handleRedo = () => {
    // Implement redo logic here
    console.log('Redo');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-0 h-[calc(110vh-12rem)]">
          {/* Tools Section */}          
          <div className="w-16 bg-white rounded-xl shadow-lg p-1 flex flex-col items-center space-y-4 border border-gray-100">
            {/* Upload Section */}
            <div className="py-2 space-y-2 w-full pb-4 border-b border-gray-200 mb-4 min-h-[90px]">
              <label className="block">
                <div className="bg-indigo-600 rounded-lg hover:bg-indigo-900 transition-colors transition-colors cursor-pointer group">
                  <span 
                    className={`text-white ${
                      currentPdf ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {currentPdf ? 'Change' : 'Upload'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </label>
              {currentPdf && (
                <div className="mt-2 text-center">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPdf(null);
                    }}
                    className="text-xs text-gray-600 hover:text-indigo-500 cursor-pointer underline"
                  >
                    Remove
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={() => handleToolSelect('highlight')}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                selectedTool === 'highlight' 
                  ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' 
                  : 'text-gray-700 hover:text-indigo-600'
              }`}
              title="Highlight Tool"
            >
              <Highlighter size={20} />
            </button>
            <button
              onClick={() => handleToolSelect('text')}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                selectedTool === 'highlight' 
                  ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' 
                  : 'text-gray-700 hover:text-indigo-600'
              }`}
              title="Text Tool"
            >
              <Type size={20} />
            </button>
            <button
              onClick={() => handleToolSelect('eraser')}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                selectedTool === 'highlight' 
                  ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' 
                  : 'text-gray-700 hover:text-indigo-600'
              }`}
              title="Eraser"
            >
              <Eraser size={20} />
            </button>
            <div className="w-full h-px bg-gray-200 my-2"></div>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                !canUndo ? 'opacity-50 cursor-not-allowed' : 'text-gray-600'
              }`}
              title="Undo"
            >
              <Undo size={20} />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                !canRedo ? 'opacity-50 cursor-not-allowed' : 'text-gray-600'
              }`}
              title="Redo"
            >
              <Redo size={20} />
            </button>
          </div>

          {/* PDF Viewer Section */}
          <div 
            ref={containerRef}
            className="flex-1 bg-white rounded-xl shadow-lg p-1 overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {currentPdf ? (
                <>
                  <div
                   className="flex-1 overflow-auto"
                   ref={viewerRef}
                   >
                    <Document
                      file={currentPdf}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="h-full flex items-center justify-center">
                          <span className="text-gray-500 italic">Loading PDF...</span>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={pageNumber}
                        renderTextLayer={true}
                        width={containerWidth}
                        className="shadow-lg mx-auto"
                      />
                    </Document>
                  </div>
                  <div className="flex items-center justify-center space-x-4 mt-4 py-2 border-t">
                    <button
                      onClick={() => changePage(-1)}
                      disabled={pageNumber <= 1}
                      className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <p className="text-sm text-gray-600">
                      Page {pageNumber} of {numPages}
                    </p>
                    <button
                      onClick={() => changePage(1)}
                      disabled={pageNumber >= (numPages || 1)}
                      className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center ">
                  <p className="text-gray-500 italic">No PDF loaded. Please upload a PDF file.</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="w-80 bg-white rounded-lg shadow-lg p-1">
            <ChatInterface />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
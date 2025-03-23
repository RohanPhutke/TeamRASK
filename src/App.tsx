import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import { Highlighter, Undo, Redo, Type, Eraser, Upload } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import PDFViewer from './components/PDFViewer';
import axios from "axios";

interface Book {
  id: number;
  content: string;
}

interface Annotation {
  id: string;
  type: 'highlight' | 'text' | 'eraser';
  pageNumber: number;
  content?: string;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  color?: string;
}

type Tool = 'highlight' | 'text' | 'eraser' | null;

function App() {
  // Keep your existing state variables
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [chatWidth, setChatWidth] = useState(400);
  const [pdfWidth, setPdfWidth] = useState(600);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<{ x: number, y: number } | null>(null);

  const [annotationHistory, setAnnotationHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pageRefs = useRef<{ [pageNumber: number]: HTMLElement | null }>({});

  const [extractedText, setExtractedText] = useState<string>('');

  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    setCanUndo(historyIndex > 0);
    setCanRedo(historyIndex < annotationHistory.length - 1);
  }, [annotationHistory, historyIndex]);

  const handleChatResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const startX = e.clientX;
    const startWidth = chatWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (startX - moveEvent.clientX);
      if (newWidth > 200 && newWidth < 800) {
        setChatWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handlePdfResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const startX = e.clientX;
    const startWidth = pdfWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      if (newWidth > 300 && newWidth < 1000) {
        setPdfWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setAnnotations([]);
      setAnnotationHistory([[]]);
      setHistoryIndex(0);

      const handleUpload = async () => {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await axios.post("http://127.0.0.1:8000/upload/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const { collection_name } = response.data;
          setCollectionName(collection_name);
          alert(`Collection Name: ${collection_name}`);
        } catch (error) {
          console.error("Errr:", error);
        }
      };

      handleUpload();
    }
  };

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool === selectedTool ? null : tool);
    if (tool !== 'text') {
      setShowTextInput(false);
    }
  };

  const saveToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = annotationHistory.slice(0, historyIndex + 1);
    newHistory.push([...newAnnotations]);
    setAnnotationHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations([...annotationHistory[newIndex]]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < annotationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations([...annotationHistory[newIndex]]);
    }
  };

  const registerPageRef = (pageNumber: number, element: HTMLElement | null) => {
    pageRefs.current[pageNumber] = element;
  };

  const handlePDFClick = (e: React.MouseEvent, pageNumber: number) => {
    if (!selectedTool) return;

    const pageElement = pageRefs.current[pageNumber];
    if (!pageElement) return;

    const rect = pageElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'text') {
      setTextPosition({ x, y });
      setCurrentPage(pageNumber);
      setShowTextInput(true);
    } else if (selectedTool === 'highlight') {
      const selection = window.getSelection();

      if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const rangeRect = range.getBoundingClientRect();
        if (!rangeIntersectsElement(rangeRect, pageElement)) {
          return;
        }

        const newAnnotation: Annotation = {
          id: `annotation-${Date.now()}`,
          type: 'highlight',
          pageNumber: pageNumber,
          position: {
            x: rangeRect.left - rect.left,
            y: rangeRect.top - rect.top,
            width: rangeRect.width,
            height: rangeRect.height
          },
          color: 'rgba(255, 255, 0, 0.3)'
        };

        const newAnnotations = [...annotations, newAnnotation];
        setAnnotations(newAnnotations);
        saveToHistory(newAnnotations);
        selection.removeAllRanges();
      } else {
        const newAnnotation: Annotation = {
          id: `annotation-${Date.now()}`,
          type: 'highlight',
          pageNumber: pageNumber,
          position: { x, y, width: 100, height: 20 },
          color: 'rgba(255, 255, 0, 0.3)'
        };

        const newAnnotations = [...annotations, newAnnotation];
        setAnnotations(newAnnotations);
        saveToHistory(newAnnotations);
      }
    } else if (selectedTool === 'eraser') {
      const eraserRadius = 20;
      const annotationsToKeep = annotations.filter(annotation => {
        if (annotation.pageNumber !== pageNumber) return true;
        const annotX = annotation.position.x;
        const annotY = annotation.position.y;
        if (annotation.type === 'highlight' && annotation.position.width && annotation.position.height) {
          const highlightMinX = annotX;
          const highlightMaxX = annotX + annotation.position.width;
          const highlightMinY = annotY;
          const highlightMaxY = annotY + annotation.position.height;
          if (
            x >= highlightMinX - eraserRadius &&
            x <= highlightMaxX + eraserRadius &&
            y >= highlightMinY - eraserRadius &&
            y <= highlightMaxY + eraserRadius
          ) {
            return false;
          }
        } else {
          const distance = Math.sqrt(Math.pow(x - annotX, 2) + Math.pow(y - annotY, 2));
          if (distance <= eraserRadius) {
            return false;
          }
        }
        return true;
      });
      if (annotationsToKeep.length !== annotations.length) {
        setAnnotations(annotationsToKeep);
        saveToHistory(annotationsToKeep);
      }
    }
  };

  const rangeIntersectsElement = (rangeRect: DOMRect, element: HTMLElement) => {
    const elementRect = element.getBoundingClientRect();
    return !(
      rangeRect.right < elementRect.left ||
      rangeRect.left > elementRect.right ||
      rangeRect.bottom < elementRect.top ||
      rangeRect.top > elementRect.bottom
    );
  };

  const handleTextSubmit = () => {
    if (!textInput || !textPosition) return;

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: 'text',
      pageNumber: currentPage,
      content: textInput,
      position: textPosition
    };

    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);
    saveToHistory(newAnnotations);
    setTextInput('');
    setShowTextInput(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPageAnnotations = (pageNumber: number) => {
    const pageAnnotations = annotations.filter(ann => ann.pageNumber === pageNumber);
    return pageAnnotations.map(annotation => (
      <div
        key={annotation.id}
        className="absolute z-10 pointer-events-none"
        style={{
          left: `${annotation.position.x}px`,
          top: `${annotation.position.y}px`,
          width: annotation.position.width ? `${annotation.position.width}px` : 'auto',
          height: annotation.position.height ? `${annotation.position.height}px` : 'auto',
          backgroundColor: annotation.type === 'highlight' ? annotation.color : 'transparent',
        }}
      >
        {annotation.type === 'text' && (
          <div className="bg-white p-1 rounded shadow text-sm border border-gray-200 pointer-events-auto">
            {annotation.content}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-200 ">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-5 h-[calc(110vh-12rem)]">
          {/* Tools Section */}
          <div className="w-16 bg-white rounded-xl shadow-lg p-1 flex flex-col items-center space-y-4 border border-gray-100">
            <div className="py-2 space-y-2 w-full pb-4 border-b border-gray-200 mb-4 min-h-[90px]">
              <label className="block flex items-center justify-center">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg hover:bg-indigo-900 transition-colors transition-colors cursor-pointer group flex items-center justify-center">
                  <span
                    className={`text-white ${selectedFile ? 'text-green-600' : 'text-gray-600'
                      }`}
                  >
                    <Upload size={25} />
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </label>
              {selectedFile && (
                <div className="mt-2 text-center">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedFile(null);
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
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${selectedTool === 'highlight'
                  ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500'
                  : 'text-gray-700 hover:text-indigo-600'
                }`}
              title="Highlight Tool"
            >
              <Highlighter size={20} />
            </button>
            <button
              onClick={() => handleToolSelect('text')}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${selectedTool === 'text'
                  ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500'
                  : 'text-gray-700 hover:text-indigo-600'
                }`}
              title="Text Tool"
            >
              <Type size={20} />
            </button>
            <button
              onClick={() => handleToolSelect('eraser')}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${selectedTool === 'eraser'
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
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${!canUndo ? 'opacity-50 cursor-not-allowed' : 'text-gray-600'
                }`}
              title="Undo"
            >
              <Undo size={20} />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${!canRedo ? 'opacity-50 cursor-not-allowed' : 'text-gray-600'
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
            style={{ width: `${pdfWidth}px` }}
          >
            <div
              ref={viewerRef}
              className="h-full flex flex-col relative"
            >
              <div className="h-full">
                <PDFViewer
                  file={selectedFile}
                  onLoadSuccess={(numPages) => console.log('PDF loaded with', numPages, 'pages')}
                  onVisibleTextChange={(text) => setExtractedText(text)}
                  onPageChange={handlePageChange}
                  className="h-full"
                  onPageClick={handlePDFClick}
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
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Add a note..."
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end mt-2 gap-2">
                    <button
                      onClick={() => setShowTextInput(false)}
                      className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTextSubmit}
                      className="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              )}
              <div
                onMouseDown={handlePdfResize}
                className="absolute top-0 right-0 w-2 h-full cursor-ew-resize bg-gray-300"
              />
            </div>
          </div>

          {/* Chat Section */}
          <div
            className="bg-white rounded-lg shadow-lg p-1 relative"
            style={{ width: `${chatWidth}px` }}
          >
            <ChatInterface collectionName={collectionName} />
            <div
              onMouseDown={handleChatResize}
              className="absolute top-0 left-0 w-2 h-full cursor-ew-resize bg-gray-300"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
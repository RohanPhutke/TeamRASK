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

// Updated interface for annotations with better positioning
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Add new state for annotations
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<{x: number, y: number} | null>(null);
  
  // History for undo/redo
  const [annotationHistory, setAnnotationHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Reference to keep track of page elements
  const pageRefs = useRef<{[pageNumber: number]: HTMLElement | null}>({});

  // For extracting text
  const [extractedText, setExtractedText] = useState<string>('');

  // Keep your existing effect for container width
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

  // Add effect to update undo/redo state
  useEffect(() => {
    setCanUndo(historyIndex > 0);
    setCanRedo(historyIndex < annotationHistory.length - 1);
  }, [annotationHistory, historyIndex]);

  // Upload file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      // Reset annotations and history when loading a new file
      setAnnotations([]);
      setAnnotationHistory([[]]);
      setHistoryIndex(0);
      
      // Handle backend part of the file upload
      const handleUpload = async () => {
  
        const formData = new FormData();
        formData.append("file", file);
  
        try {
          const response = await axios.post("http://127.0.0.1:8000/upload/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
           const {collection_name}  = response.data;
          alert(`Collection Name: ${collection_name}`);
        } catch (error) {
          console.error("Errr:", error);
        }
      };
  
      handleUpload();
    }
  };

  // Keep your existing tool select handler but enhance it
  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool === selectedTool ? null : tool);
    
    // If text tool is deselected, hide text input
    if (tool !== 'text') {
      setShowTextInput(false);
    }
  };

  // Add function to save to history
  const saveToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = annotationHistory.slice(0, historyIndex + 1);
    newHistory.push([...newAnnotations]);
    setAnnotationHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Enhance your undo handler
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations([...annotationHistory[newIndex]]);
    }
  };

  // Enhance your redo handler
  const handleRedo = () => {
    if (historyIndex < annotationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations([...annotationHistory[newIndex]]);
    }
  };

  // Register a page element reference
  const registerPageRef = (pageNumber: number, element: HTMLElement | null) => {
    pageRefs.current[pageNumber] = element;
  };

  // Handle PDF viewer clicks with improved positioning
  const handlePDFClick = (e: React.MouseEvent, pageNumber: number) => {
    if (!selectedTool) return;
    
    const pageElement = pageRefs.current[pageNumber];
    if (!pageElement) return;
    
    // Get click position relative to the current page
    const rect = pageElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (selectedTool === 'text') {
      // For text tool, show text input at click position
      setTextPosition({ x, y });
      setCurrentPage(pageNumber);
      setShowTextInput(true);
    } else if (selectedTool === 'highlight') {
      // For highlight tool, create a highlight annotation
      const selection = window.getSelection();
      
      // If there's text selected, use that for highlighting
      if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        
        // Check if the selection is within our PDF viewer
        const rangeRect = range.getBoundingClientRect();
        if (!rangeIntersectsElement(rangeRect, pageElement)) {
          return; // Selection is outside the current page
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
          color: 'rgba(255, 255, 0, 0.3)' // Yellow highlight
        };
        
        const newAnnotations = [...annotations, newAnnotation];
        setAnnotations(newAnnotations);
        saveToHistory(newAnnotations);
        
        // Clear selection
        selection.removeAllRanges();
      } else {
        // Fallback to simple click position for highlighting
        const newAnnotation: Annotation = {
          id: `annotation-${Date.now()}`,
          type: 'highlight',
          pageNumber: pageNumber,
          position: { x, y, width: 100, height: 20 },
          color: 'rgba(255, 255, 0, 0.3)' // Yellow highlight
        };
        
        const newAnnotations = [...annotations, newAnnotation];
        setAnnotations(newAnnotations);
        saveToHistory(newAnnotations);
      }
   // Inside the handlePDFClick function in App.tsx, replace the eraser logic:

} else if (selectedTool === 'eraser') {
  // For eraser tool, remove annotations near the click position
  const eraserRadius = 20; // pixels
  
  const annotationsToKeep = annotations.filter(annotation => {
    // Only consider annotations on this page
    if (annotation.pageNumber !== pageNumber) return true;
    
    // Check if click is near this annotation
    const annotX = annotation.position.x;
    const annotY = annotation.position.y;
    
    // For highlights with width and height, check if click is within or near the highlight area
    if (annotation.type === 'highlight' && annotation.position.width && annotation.position.height) {
      // Check if click is inside the highlight or within eraserRadius of its edges
      const highlightMinX = annotX;
      const highlightMaxX = annotX + annotation.position.width;
      const highlightMinY = annotY;
      const highlightMaxY = annotY + annotation.position.height;
      
      // Click is inside the highlight or close to its edges
      if (
        x >= highlightMinX - eraserRadius &&
        x <= highlightMaxX + eraserRadius &&
        y >= highlightMinY - eraserRadius &&
        y <= highlightMaxY + eraserRadius
      ) {
        return false; // Remove this annotation
      }
    } 
    // For text notes or other annotations without width/height
    else {
      const distance = Math.sqrt(Math.pow(x - annotX, 2) + Math.pow(y - annotY, 2));
      if (distance <= eraserRadius) {
        return false; // Remove this annotation
      }
    }
    
    // Keep this annotation
    return true;
  });
  
  if (annotationsToKeep.length !== annotations.length) {
    setAnnotations(annotationsToKeep);
    saveToHistory(annotationsToKeep);
  }
}
  };

  // Helper function to check if a range intersects with an element
  const rangeIntersectsElement = (rangeRect: DOMRect, element: HTMLElement) => {
    const elementRect = element.getBoundingClientRect();
    return !(
      rangeRect.right < elementRect.left || 
      rangeRect.left > elementRect.right ||
      rangeRect.bottom < elementRect.top ||
      rangeRect.top > elementRect.bottom
    );
  };

  // Add handler for text submission with improved positioning
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
    
    // Reset
    setTextInput('');
    setShowTextInput(false);
  };

  // Add handler for page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Render annotations for a specific page
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
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-5 h-[calc(110vh-12rem)]">
          {/* Tools Section */}          
          <div className="w-16 bg-white rounded-xl shadow-lg p-1 flex flex-col items-center space-y-4 border border-gray-100">
            
            {/* Upload Section */}
            <div className="py-2 space-y-2 w-full pb-4 border-b border-gray-200 mb-4 min-h-[90px]">
              <label className="block flex items-center justify-center">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg hover:bg-indigo-900 transition-colors transition-colors cursor-pointer group flex items-center justify-center">
                  <span 
                    className={`text-white ${
                      selectedFile ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    <Upload size={25}/>
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
                selectedTool === 'text' 
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
                selectedTool === 'eraser' 
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
            className="flex-1 bg-white rounded-xl shadow-lg p-1 overflow-hidden">
              <div 
                ref={viewerRef}
                className="h-full flex flex-col relative"
              >
                {/* PDFViewer component */}
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
                
                {/* Text input modal with proper positioning */}
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
              </div>
            </div>

          {/* Chat Section */}
          <div 
            className="bg-white rounded-lg shadow-lg p-1 relative"
            style={{ width: `${chatWidth}px` }}
          >
            <ChatInterface  />
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
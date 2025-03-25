import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import { Highlighter, Undo, Redo, Type, Eraser, Upload, Camera } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import PDFViewer from './components/PDFViewer';
import axios from "axios";
import html2canvas from 'html2canvas';

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

type Tool = 'screenshot' | 'highlight' | 'text' | 'eraser' | null;

function App() {
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);

  useEffect(() => {
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

  // When screenshot tool is selected, we now enter cropping mode.
  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool === selectedTool ? null : tool);
    if (tool === 'screenshot') {
      setSelectionStart(null);
      setSelectionEnd(null);
    } else if (tool !== 'text') {
        setShowTextInput(false);
      }
  };

  // Capture and crop the screenshot based on the user's selection.
  const captureCroppedScreenshot = async (x: number, y: number, width: number, height: number) => {
    if (!viewerRef.current) return;
    try {
      const canvas = await html2canvas(viewerRef.current);
      // Create an offscreen canvas for cropping.
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = width;
      croppedCanvas.height = height;
      const ctx = croppedCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
        const croppedDataUrl = croppedCanvas.toDataURL('image/png');
        console.log('Cropped screenshot:', croppedDataUrl);
        alert('Cropped screenshot captured! Check the console for the data URL.');
        // Optionally, send croppedDataUrl to your backend.
      }
    } catch (error) {
      console.error('Error capturing cropped screenshot:', error);
    }
  };

  // Mouse event handlers for cropping (active when selectedTool === 'screenshot')
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool !== 'screenshot' || !viewerRef.current) return;
    const rect = viewerRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    setSelectionStart({ x: startX, y: startY });
    setSelectionEnd({ x: startX, y: startY });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectedTool !== 'screenshot' || !viewerRef.current || !selectionStart) return;
    const rect = viewerRef.current.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const moveY = e.clientY - rect.top;
    setSelectionEnd({ x: moveX, y: moveY });
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (selectedTool !== 'screenshot' || !viewerRef.current || !selectionStart || !selectionEnd)
      return;
    
    const rect = viewerRef.current.getBoundingClientRect();
    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    // Reset selection and tool state.
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedTool(null);
    
    try {
      const canvas = await html2canvas(viewerRef.current, { useCORS: true });
      const scale = canvas.width / rect.width;
      const cropX = x * scale;
      const cropY = y * scale;
      const cropWidth = width * scale;
      const cropHeight = height * scale;
      
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      const ctx = croppedCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          canvas,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );
        
        const croppedDataUrl = croppedCanvas.toDataURL('image/png');
        console.log('Cropped screenshot:', croppedDataUrl);
        alert('Cropped screenshot captured! Check the console for the data URL.');
        
        // Upload the screenshot to backend:
        uploadScreenshot(croppedDataUrl);
        
        // Save the image to display in chat
        setScreenshotImage(croppedDataUrl);
      }
    } catch (error) {
      console.error('Error capturing cropped screenshot:', error);
    }
  };
  
  const uploadScreenshot = async (dataUrl: string) => {
    try {
      // Convert data URL to Blob.
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "screenshot.png", { type: "image/png" });
      
      const formData = new FormData();
      formData.append("image", file);
      formData.append("book_name", "book1"); // Adjust this value as needed.
  
      // Make the API call (adjust the URL to your backend endpoint).
      const response = await axios.post("http://127.0.0.1:8000/upload-screenshot/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      console.log("Upload response:", response.data);
      // You might return or handle the public URL returned by your backend.
      return response.data;
    } catch (error) {
      console.error("Error uploading screenshot:", error);
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
            height: rangeRect.height,
          },
          color: 'rgba(255, 255, 0, 0.3)',
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
          color: 'rgba(255, 255, 0, 0.3)',
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
      position: textPosition,
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
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-5 h-[calc(110vh-12rem)]">
          {/* Tools Section */}
          <div className="w-16 bg-white rounded-xl shadow-lg p-1 flex flex-col items-center space-y-4 border border-gray-100">
            <div className="py-2 space-y-2 w-full pb-4 border-b border-gray-200 mb-4 min-h-[90px]">
              <label className="block flex items-center justify-center">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg hover:bg-indigo-900 transition-colors cursor-pointer group flex items-center justify-center">
                  <span className={`text-white ${selectedFile ? 'text-green-600' : 'text-gray-600'}`}>
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
            {/* Screenshot Tool Button */}
            <button
              onClick={() => handleToolSelect('screenshot')}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                selectedTool === 'screenshot'
                  ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500'
                  : 'text-gray-700 hover:text-indigo-600'
              }`}
              title="Screenshot Tool"
            >
              <Camera size={20} />
            </button>
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
            className="flex-1 bg-white rounded-xl shadow-lg p-1 overflow-hidden"
            style={{ width: `${pdfWidth}px` }}
          >
            <div 
              ref={viewerRef}
              className="h-full flex flex-col relative"
              // Attach cropping event handlers when screenshot tool is active.
              onMouseDown={selectedTool === 'screenshot' ? handleMouseDown : undefined}
              onMouseMove={selectedTool === 'screenshot' ? handleMouseMove : undefined}
              onMouseUp={selectedTool === 'screenshot' ? handleMouseUp : undefined}
            >
              <div className="h-full">
                <PDFViewer 
                  file={selectedFile}
                  onLoadSuccess={(numPages) => console.log('PDF loaded with', numPages, 'pages')}
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
              {/* Render selection overlay if in screenshot mode and user is dragging */}
              {selectedTool === 'screenshot' && selectionStart && selectionEnd && (
                <div
                  className="absolute border-2 border-blue-500 pointer-events-none"
                  style={{
                    left: `${Math.min(selectionStart.x, selectionEnd.x)}px`,
                    top: `${Math.min(selectionStart.y, selectionEnd.y)}px`,
                    width: `${Math.abs(selectionEnd.x - selectionStart.x)}px`,
                    height: `${Math.abs(selectionEnd.y - selectionStart.y)}px`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div 
            className="bg-white rounded-lg shadow-lg p-1 relative"
            style={{ width: `${chatWidth}px` }}
          >
            <ChatInterface incomingImageMessage={screenshotImage} />
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

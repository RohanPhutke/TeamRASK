// App.tsx
import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import MainLayout from './components/MainLayout';
import UploadingScreen from './components/UploadingScreen';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';

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

type Tool = 'highlight' | 'text' | 'eraser' | 'screenshot' | null;

function App() {
  // const [collectionName, setCollectionName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [chatWidth, setChatWidth] = useState(500);
  const [pdfWidth, setPdfWidth] = useState(500);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [annotationHistory, setAnnotationHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const pageRefs = useRef<{ [pageNumber: number]: HTMLElement | null }>({});

  // State for screenshot selection (only used when screenshot tool is active)
  const [screenshotSelection, setScreenshotSelection] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    selecting: boolean;
  }>({ startX: 0, startY: 0, endX: 0, endY: 0, selecting: false });
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);

  // fetching fileURL for our file
  const location = useLocation();
  const { fileUrl, collectionName } = location.state || {};
  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setAnnotations([]);
      setAnnotationHistory([[]]);
      setHistoryIndex(0);
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      const handleUpload = async () => {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await axios.post('http://127.0.0.1:8000/upload/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 1)
              );
              setUploadProgress(percentCompleted);
            },
          });
          const { collection_name } = response.data;
          // setCollectionName(collection_name);
          setIsUploading(false);
        } catch (error) {
          console.error('Error uploading file:', error);
          setUploadError('Failed to upload the file. Please try again.');
          setIsUploading(false);
        }
      };

      handleUpload();
    }
  };

  // Handle tool selection
  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool === selectedTool ? null : tool);
    if (tool !== 'text') {
      setShowTextInput(false);
    }
  };

  // Save annotation history
  const saveToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = annotationHistory.slice(0, historyIndex + 1);
    newHistory.push([...newAnnotations]);
    setAnnotationHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations([...annotationHistory[newIndex]]);
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (historyIndex < annotationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations([...annotationHistory[newIndex]]);
    }
  };

  // Register page references
  const registerPageRef = (pageNumber: number, element: HTMLElement | null) => {
    pageRefs.current[pageNumber] = element;
  };

  // Handle PDF click (for text, highlight, eraser)
  const handlePDFClick = (e: React.MouseEvent, pageNumber: number) => {
    // Do not process click if screenshot tool is active since it uses drag events
    if (selectedTool === 'screenshot') return;
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
      const annotationsToKeep = annotations.filter((annotation) => {
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

 // --- Screenshot tool event handlers ---
 const handleScreenshotMouseDown = (e: React.MouseEvent, pageNumber: number) => {
  if (selectedTool !== 'screenshot') return;
  const pageElement = pageRefs.current[pageNumber];
  if (!pageElement) return;
  const rect = pageElement.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  setScreenshotSelection({ startX: x, startY: y, endX: x, endY: y, selecting: true });
  setCurrentPage(pageNumber);
  console.log('Screenshot started at:', x, y);
};

const handleScreenshotMouseMove = (e: React.MouseEvent, pageNumber: number) => {
  if (selectedTool !== 'screenshot' || !screenshotSelection.selecting) return;
  const pageElement = pageRefs.current[pageNumber];
  if (!pageElement) return;
  const rect = pageElement.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  setScreenshotSelection(prev => ({ ...prev, endX: x, endY: y }));
  console.log('Screenshot updated to:', x, y);
};

const handleScreenshotMouseUp = async (e: React.MouseEvent, pageNumber: number) => {
  if (selectedTool !== 'screenshot' || !screenshotSelection.selecting) return;
  const pageElement = pageRefs.current[pageNumber];
  if (!pageElement) return;
  setScreenshotSelection(prev => ({ ...prev, selecting: false }));

  // Use the selection state
  const { startX, startY, endX, endY } = screenshotSelection;
  // Calculate raw selection coordinates relative to the page element
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  if (width === 0 || height === 0) {
    alert('No area selected for screenshot.');
    return;
  }

  try {
    // Capture the page element without forcing scrollY adjustment.
    // (Remove scrollY option if it's not needed or is causing offset issues.)
    const canvas = await html2canvas(pageElement, { useCORS: true });
    
    // Get the element's bounding rectangle so we can compute a scale factor.
    const rect = pageElement.getBoundingClientRect();
    // Compute the scale factor: how many canvas pixels per element pixel
    const scaleFactor = canvas.width / rect.width;
    
    // Apply the scale factor to crop coordinates
    const cropX = left * scaleFactor;
    const cropY = top * scaleFactor;
    const cropWidth = width * scaleFactor;
    const cropHeight = height * scaleFactor;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    const ctx = croppedCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      const dataUrl = croppedCanvas.toDataURL('image/png');
      setScreenshotImage(dataUrl);
    }
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    alert('Error capturing screenshot. See console for details.');
  }
};

  
  

  // Check if range intersects with element
  const rangeIntersectsElement = (rangeRect: DOMRect, element: HTMLElement) => {
    const elementRect = element.getBoundingClientRect();
    return !(
      rangeRect.right < elementRect.left ||
      rangeRect.left > elementRect.right ||
      rangeRect.bottom < elementRect.top ||
      rangeRect.top > elementRect.bottom
    );
  };

  // Handle text input submission
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

  const handlePdfResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    const startX = e.clientX;
    const startWidth = pdfWidth;
  
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      setPdfWidth(Math.max(300, Math.min(newWidth, window.innerWidth * 0.7)));
    };
  
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseUp);
    };
  
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseUp);
  };

  // Handle chat resize
  const handleChatResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = chatWidth;
  
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (startX - moveEvent.clientX);
      setChatWidth(
        Math.max(250, Math.min(newWidth, window.innerWidth * 0.4))
      );
    };
  
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseUp);
    };
  
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseUp);
  };

  // Render page annotations
  const renderPageAnnotations = (pageNumber: number) => {
    const pageAnnotations = annotations.filter((ann) => ann.pageNumber === pageNumber);
    return pageAnnotations.map((annotation) => (
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

  useEffect(() => {
    setCanUndo(historyIndex > 0);
    setCanRedo(historyIndex < annotationHistory.length - 1);
  }, [annotationHistory, historyIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className={`transition-all duration-300 ${isUploading || uploadError ? 'blur-sm opacity-90' : ''}`}>
          <MainLayout
            selectedTool={selectedTool}
            onToolSelect={handleToolSelect}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onPageChange={setCurrentPage}
            onPDFClick={handlePDFClick}
            onScreenshotMouseDown={handleScreenshotMouseDown}
            onScreenshotMouseMove={handleScreenshotMouseMove}
            onScreenshotMouseUp={handleScreenshotMouseUp}
            registerPageRef={registerPageRef}
            renderPageAnnotations={renderPageAnnotations}
            showTextInput={showTextInput}
            textPosition={textPosition}
            textInput={textInput}
            onTextInputChange={(e) => setTextInput(e.target.value)}
            onTextSubmit={handleTextSubmit}
            onCancelTextInput={() => setShowTextInput(false)}
            onPdfResize={handlePdfResize}
            pdfWidth={pdfWidth}
            collectionName={collectionName}
            chatWidth={chatWidth}
            onChatResize={handleChatResize}
            fileUrl={fileUrl}
            screenShotImage={screenshotImage}
            screenshotSelection={screenshotSelection}   // New prop
            currentPage={currentPage}                     // New prop (the page on which selection is active)
            screenshotToolActive={selectedTool === 'screenshot'}  // New prop to indicate tool active
          />
        </div>
        <UploadingScreen
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
        />
      </main>
    </div>
  );
}

export default App;

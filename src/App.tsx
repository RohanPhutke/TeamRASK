// App.tsx
import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import MainLayout from './components/MainLayout';
import axios from 'axios';

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
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [chatWidth, setChatWidth] = useState(400);
  const [pdfWidth, setPdfWidth] = useState(600);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [annotationHistory, setAnnotationHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const pageRefs = useRef<{ [pageNumber: number]: HTMLElement | null }>({});

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setAnnotations([]);
      setAnnotationHistory([[]]);
      setHistoryIndex(0);

      const handleUpload = async () => {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await axios.post('http://127.0.0.1:8000/upload/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const { collection_name } = response.data;
          setCollectionName(collection_name);
        } catch (error) {
          console.error('Error uploading file:', error);
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

  // Handle PDF click
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

  // Handle PDF resize
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

  // Handle chat resize
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

  // Update undo/redo states
  useEffect(() => {
    setCanUndo(historyIndex > 0);
    setCanRedo(historyIndex < annotationHistory.length - 1);
  }, [annotationHistory, historyIndex]);

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <MainLayout
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          onFileUpload={handleFileUpload}
          selectedFile={selectedFile}
          onRemoveFile={() => setSelectedFile(null)}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onPageChange={setCurrentPage}
          onPDFClick={handlePDFClick}
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
        />
      </main>
    </div>
  );
}

export default App;
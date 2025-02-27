import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import { Highlighter, Undo, Redo, Type, Eraser, Upload } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import PDFViewer from './components/PDFViewer';

interface Book {
  id: number;
  content: string;
}

type Tool = 'highlight' | 'text' | 'eraser' | null;

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
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

          {/* PDF Viewer */}
          <div
            ref={containerRef}
            className="flex-1 bg-white rounded-xl shadow-lg p-1 overflow-hidden">
              <div className="h-full flex flex-col">
                <PDFViewer 
                  file={selectedFile}
                  onLoadSuccess={setNumPages}
                  className='custom-class-if-needed'
                  />
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
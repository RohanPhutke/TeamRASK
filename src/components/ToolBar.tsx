// components/Toolbar.tsx
import React from 'react';
import { Highlighter, Undo, Redo, Type, Eraser, Upload } from 'lucide-react';
type Tool = 'highlight' | 'text' | 'eraser' | null;
interface ToolbarProps {
    selectedTool: Tool;
    onToolSelect: (tool: Tool) => void; // Updated to use Tool type
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    selectedFile: File | null;
    onRemoveFile: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
  }
  

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  onFileUpload,
  selectedFile,
  onRemoveFile,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  return (
    <div className="w-16 bg-white rounded-xl shadow-lg p-1 flex flex-col items-center space-y-4 border border-gray-100">
      <div className="py-2 space-y-2 w-full pb-4 border-b border-gray-200 mb-4 min-h-[90px]">
        <label className="block flex items-center justify-center">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg hover:bg-indigo-900 transition-colors cursor-pointer group flex items-center justify-center">
            <span className={`text-white ${selectedFile ? 'text-green-600' : 'text-gray-600'}`}>
              <Upload size={25} />
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={onFileUpload}
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
                onRemoveFile();
              }}
              className="text-xs text-gray-600 hover:text-indigo-500 cursor-pointer underline"
            >
              Remove
            </a>
          </div>
        )}
      </div>
      <button
        onClick={() => onToolSelect('highlight')}
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
        onClick={() => onToolSelect('text')}
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
        onClick={() => onToolSelect('eraser')}
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
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
          !canUndo ? 'opacity-50 cursor-not-allowed' : 'text-gray-600'
        }`}
        title="Undo"
      >
        <Undo size={20} />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
          !canRedo ? 'opacity-50 cursor-not-allowed' : 'text-gray-600'
        }`}
        title="Redo"
      >
        <Redo size={20} />
      </button>
    </div>
  );
};

export default Toolbar;
// components/Toolbar.tsx
import React from 'react';
import { Highlighter, Undo, Redo, Type, Eraser, Upload } from 'lucide-react';
type Tool = 'highlight' | 'text' | 'eraser' | null;
interface ToolbarProps {
    selectedTool: Tool;
    onToolSelect: (tool: Tool) => void; // Updated to use Tool type
    // onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    // selectedFile: File | null;
    // onRemoveFile: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
  }
  

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  // onFileUpload,
  // selectedFile,
  // onRemoveFile,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  return (
    <div className="w-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-2 flex flex-col items-center space-y-3 border border-gray-200/50">
  {/* Highlight Tool */}
  <button
    onClick={() => onToolSelect('highlight')}
    className={`p-3 rounded-xl transition-all duration-200 ${
      selectedTool === 'highlight'
        ? 'bg-gradient-to-br from-indigo-100/80 to-purple-100/80 text-indigo-600 shadow-inner'
        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100/50'
    }`}
    title="Highlight Tool"
  >
    <Highlighter size={20} className="shrink-0" />
  </button>

  {/* Text Tool */}
  <button
    onClick={() => onToolSelect('text')}
    className={`p-3 rounded-xl transition-all duration-200 ${
      selectedTool === 'text'
        ? 'bg-gradient-to-br from-indigo-100/80 to-purple-100/80 text-indigo-600 shadow-inner'
        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100/50'
    }`}
    title="Text Tool"
  >
    <Type size={20} className="shrink-0" />
  </button>

  {/* Eraser Tool */}
  <button
    onClick={() => onToolSelect('eraser')}
    className={`p-3 rounded-xl transition-all duration-200 ${
      selectedTool === 'eraser'
        ? 'bg-gradient-to-br from-indigo-100/80 to-purple-100/80 text-indigo-600 shadow-inner'
        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100/50'
    }`}
    title="Eraser"
  >
    <Eraser size={20} className="shrink-0" />
  </button>

  {/* Divider */}
  <div className="w-8 h-px bg-gray-200/70 my-1"></div>

  {/* Undo */}
  <button
    onClick={onUndo}
    disabled={!canUndo}
    className={`p-3 rounded-xl transition-all duration-200 ${
      !canUndo 
        ? 'opacity-40 cursor-not-allowed' 
        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100/50'
    }`}
    title="Undo"
  >
    <Undo size={20} className="shrink-0" />
  </button>

  {/* Redo */}
  <button
    onClick={onRedo}
    disabled={!canRedo}
    className={`p-3 rounded-xl transition-all duration-200 ${
      !canRedo 
        ? 'opacity-40 cursor-not-allowed' 
        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100/50'
    }`}
    title="Redo"
  >
    <Redo size={20} className="shrink-0" />
  </button>
</div>
  );
};

export default Toolbar;
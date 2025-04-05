// components/Toolbar.tsx
import React from 'react';
import { Highlighter, Undo, Redo, Type, Eraser, Camera } from 'lucide-react';
type Tool = 'screenshot' | 'highlight' | 'text' | 'eraser' | null;
interface ToolbarProps {
    selectedTool: Tool;
    onToolSelect: (tool: Tool) => void;
    horizontal : boolean;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
  }
  

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  horizontal = false,
}) => {
  return (
    <div className={`
      ${horizontal ? 
        'w-full bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-2 flex flex-row items-center justify-center space-x-3 border border-gray-200/50' :
        'w-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-2 flex flex-col items-center space-y-3 border border-gray-200/50'
      }
    `}>
  {/* Screenshot Tool */}
  <button
    onClick={() => onToolSelect('screenshot')}
    className={`p-3 rounded-xl transition-all duration-200 ${
      selectedTool === 'screenshot'
        ? 'bg-gradient-to-br from-indigo-100/80 to-purple-100/80 text-indigo-600 shadow-inner'
        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100/50'
    }`}
    title="Screenshot Tool"
  >
    <Camera size={20} className="shrink-0" />
  </button>

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

  {/* Divider (only in vertical mode)*/}
  {!horizontal && (
        <div className="w-8 h-px bg-gray-200/70 my-1"></div>
      )}

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
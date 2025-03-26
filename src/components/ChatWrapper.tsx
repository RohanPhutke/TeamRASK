// components/ChatWrapper.tsx
import React from 'react';
import ChatInterface from './ChatInterface';

interface ChatWrapperProps {
  collectionName: string | null;
  chatWidth: number;
  onChatResize: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const ChatWrapper: React.FC<ChatWrapperProps> = ({ collectionName, chatWidth, onChatResize }) => {
  return (
    <div 
  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 transition-all duration-300 flex-none"
  style={{ width: `${chatWidth}px` }}

>
  <ChatInterface collectionName={collectionName} />
  <div
    onMouseDown={onChatResize}
    className="absolute top-0 left-0 w-2 h-full cursor-ew-resize hover:w-3 hover:bg-indigo-500/30 transition-all duration-200 group"
  >
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 rounded-full group-hover:bg-indigo-600 transition-colors duration-200"></div>
  </div>
</div>
  );
};

export default ChatWrapper;
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
      className="bg-white rounded-lg shadow-lg p-1 relative"
      style={{ width: `${chatWidth}px` }}
    >
      <ChatInterface collectionName={collectionName} />
      <div
        onMouseDown={onChatResize}
        className="absolute top-0 left-0 w-2 h-full cursor-ew-resize bg-gray-300"
      />
    </div>
  );
};

export default ChatWrapper;
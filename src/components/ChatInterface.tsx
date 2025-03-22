// ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
interface ChatMessage {
  content: string;
  isUser: boolean;
}

interface ChatInterfaceProps {
  collectionName?: string| null| undefined;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ collectionName='' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    alert(collectionName);
    if (!userInput.trim()) return;

    const userMessage: ChatMessage = {
      content: userInput,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);

    setUserInput('');

      try {
      // Send request to server
      const response = await fetch('http://127.0.0.1:8000/generate-response/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userInput,
          template: "Act as a Professor",
          collection_name: `1a91c04b4c501ce0`  }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      const aiMessage: ChatMessage = {
        content: data.response || 'Sorry, I couldn’t understand that. Please try again.',
        isUser: false,
      };

      setMessages(prev => [...prev, aiMessage]);
      
      scrollToBottom();
    } catch (error) {
      console.error('Error:', error);
      // Add error message to chat
      const errorMessage: ChatMessage = {
        content: 'An error occurred. Please try again.',
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
      
      scrollToBottom();
    }
  };

  return (
    <div className="flex flex-col h-[calc(110vh-12rem)] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isUser
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-800 shadow'
              }`}
            >
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t">
        <div className="flex gap-2 w-full">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-auto max-w-[80%] min-h-[40px] resize-none max-h-[100px] overflow-y-auto"
            style={{ whiteSpace: 'pre-wrap' }}
            ref={(textarea) => {
              if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
              }
            }}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-900 transition-colors w-24"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

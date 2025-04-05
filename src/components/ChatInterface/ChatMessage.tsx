import React from "react";
import ReactMarkdown from "react-markdown";
import TypewriterText from "../TypeWriter";

interface Message {
    content: string;
    isUser: boolean;
    type?: 'text' | 'image';
    fullyRendered?: boolean;
    faintText?: boolean; 
    displayedContent?: string;
  }
interface ChatMessagesProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, setMessages}) => {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
        >
          {message.type === "image" ? (
            <div className="p-2">
              <img
                src={message.content}
                alt="Screenshot"
                className="w-auto h-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isUser
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-800 shadow"
              }`}
              style={
                message.faintText
                  ? {
                      backgroundColor: "#f3f4f6",
                      color: "#9ca3af",
                      fontStyle: "italic",
                    }
                  : {}
              }
            >
              {message.faintText ? (
                <p className="text-sm mb-1">{message.content}</p>
              ) : message.isUser || message.fullyRendered ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <TypewriterText
                  key={`typewriter-${index}`}
                  content={message.content}
                  initialDisplayed={message.displayedContent || ""}
                  onComplete={() => {
                    const updatedMessages = [...messages];
                    updatedMessages[index] = {
                      ...updatedMessages[index],
                      fullyRendered: true,
                      displayedContent: updatedMessages[index].content,
                    };
                    setMessages(updatedMessages);
                  }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;

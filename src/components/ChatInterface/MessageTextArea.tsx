// components/ChatInterface/MessageTextArea.tsx
import React from "react";

interface MessageTextareaProps {
  userInput: string;
  setUserInput: (input: string) => void;
  textPreview?: boolean | null |string;
  imagePreview?: boolean | null |string;
  handleSendTxt: (message: string) => void;
  handleSendImg: () => void;
  handleSendWithTextPreview: () => void;
}

const MessageTextarea: React.FC<MessageTextareaProps> = ({
  userInput,
  setUserInput,
  textPreview,
  imagePreview,
  handleSendTxt,
  handleSendImg,
  handleSendWithTextPreview,
}) => {
  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (textPreview) {
        handleSendWithTextPreview();
      } else if (imagePreview) {
        handleSendImg();
      } else {
        handleSendTxt(userInput);
      }
    }
  };

  const placeholderText = textPreview
    ? "Add more context to your selected text..."
    : imagePreview
    ? "Ask about the image..."
    : "Ask something about the document...";

  return (
    <div className="flex-1 bg-white border border-gray-300/80 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyUp={handleKeyUp}
        placeholder={placeholderText}
        className="w-full px-4 py-3 text-gray-700 resize-none focus:outline-none bg-transparent rounded-xl"
        style={{ minHeight: "48px", maxHeight: "120px" }}
      />
    </div>
  );
};

export default MessageTextarea;

// components/ChatInterface.tsx
import { Send, BrainCircuit } from "lucide-react";
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import QuizInterface from './QuizInterface';
import TypewriterText from "./TypeWriter";

// Add to your interfaces
interface ChatContext {
  userId: string;
  bookId: string;
  chatId: string | null;
}


interface ChatMessage {
  content: string;
  isUser: boolean;
  type?: 'text' | 'image';
  fullyRendered?: boolean; 
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

interface QuizData {
  questions: QuizQuestion[];
}

interface ChatInterfaceProps {
  collectionName?: string | null;
  screenshotImage?: string | null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ChatInterface: React.FC<ChatInterfaceProps> = ({ collectionName = '', screenshotImage }) => {
  const [selectedPersonality, setSelectedPersonality] = useState("Professor");
  const [understandingLevel, setUnderstandingLevel] = useState<"normal" | "easy" | "very_easy">("normal");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<ChatContext>({
    userId: '',
    bookId: '',
    chatId: null
  });

  const messagesEndRef = useRef<HTMLDivElement>(null); 
  useEffect(() => {
    if (messagesEndRef.current) {
      // Scroll with smooth animation, leaving some space at the bottom
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, loading, quizData, showQuiz]);

  // Initialize chat when collectionName changes
  useEffect(() => {
    const initializeChat = async () => {
      if (!collectionName) return;
      
      try {
        // 1. Get userId and bookId
        const idsRes = await fetch(`${BACKEND_URL}/get-chat-ids?collection_name=${collectionName}`);
        const { userId, bookId } = await idsRes.json();
        
        // 2. Create or get existing chat
        const chatRes = await fetch(`${BACKEND_URL}/chats/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, bookId })
        });
        const { chatId } = await chatRes.json();
        
        setChatContext({ userId, bookId, chatId });
        
        // 3. Load existing messages if any
        const messagesRes = await fetch(`${BACKEND_URL}/chats/${bookId}?userId=${userId}`);
        const chatData = await messagesRes.json();
      
        // Check if messages exist in response
        if (chatData.messages) {
          setMessages(chatData.messages.map((msg: any) => ({
            content: msg.content,
            isUser: msg.role === 'user',
            type: 'text',
            fullyRendered: true
          })));
        }
      } catch (error) {
        console.error("Chat initialization failed:", error);
      }
    };
    
    initializeChat();
  }, [collectionName]);



  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const stripMarkdownCodeBlock = (response: string): string => {
    // Remove the Markdown code block (```json ... ```)
    return response.replace(/```json/g, '').replace(/```/g, '').trim();
  };

   // When screenshot is captured, set it as preview
   useEffect(() => {
    if (screenshotImage) {
      setImagePreview(screenshotImage);
    }
  }, [screenshotImage]);

  const saveMessageToHistory = async (role: 'user' | 'assistant', content: string) => {
    try {
      await fetch(`${BACKEND_URL}/chats/${chatContext.bookId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: chatContext.userId,
          role,
          content
        })
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const handleSendImg = async () => {
      // Don't allow sending if there's no content at all
      if ((!userInput.trim() && !imagePreview )|| !chatContext.chatId) return;

      // Store current values before clearing
      const currentInput = userInput;
      const currentImage = imagePreview;

      // Clear inputs immediately
      setUserInput("");
      setImagePreview(null);

      // Add user message with optional image
      const newMessages: ChatMessage[] = [];
      
      if (currentImage) {
        newMessages.push({ 
          content: currentImage, 
          isUser: true, 
          type: 'image',
          fullyRendered: true
        });
      }
      
      if (currentInput.trim()) {
        newMessages.push({ 
          content: currentInput, 
          isUser: true, 
          type: 'text', 
          fullyRendered: true
        });
      }

      setMessages(prev => [...prev, ...newMessages]);
      setLoading(true);
      scrollToBottom(); // Scroll to show new messages immediately


      try {

        // 1. Save text message if exists
        if (userInput.trim()) {
          await saveMessageToHistory('user', currentInput);
        }

        const formData = new FormData();
        
        if (currentImage) {
          const blob = await (await fetch(currentImage)).blob();
          formData.append("image", blob, "screenshot.png");
        }
        
        formData.append("user_query", currentInput);
        formData.append("collection_name", collectionName || "");
        formData.append("template", 
          `Act as a ${selectedPersonality}. Keep in mind that the user is unable to see the context. 
          Don't mention any context provided to you in response, just assume you know that.`);
        formData.append("userId", chatContext.userId);
        formData.append("bookId", chatContext.bookId);

        const response = await fetch(`${BACKEND_URL}/image-response`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const result = await response.json();
        setMessages(prev => [...prev, { 
          content: result.description, 
          isUser: false, 
          type: 'text',
          fullyRendered: false 
        }]);

        await saveMessageToHistory('assistant', result.description);

      } catch (error) {
        console.error("Error uploading screenshot and query:", error);
        setMessages(prev => [...prev, { 
          content: "An error occurred while processing your image. Please try again.", 
          isUser: false 
        }]);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };

    const removeImagePreview = () => {
      setImagePreview(null);
    };

  //handling Quiz Json 
  const extractQuizData = (response: string) => {
    try {
      // Case 1: Pure JSON (most common)
      if (response.trim().startsWith('{')) {
        return JSON.parse(response);
      }
      
      // Case 2: JSON wrapped in markdown (```json)
      const markdownMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (markdownMatch) {
        return JSON.parse(markdownMatch[1]);
      }
      
      // Case 3: Text + JSON combination
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Case 4: Last resort - try parsing the whole response
      return JSON.parse(response);
    } catch (e) {
      console.error('Quiz parsing error:', e);
      return null;
    }
  };

  
  const handleSendTxt = async (query: string, isQuiz: boolean = false) => {
    if (!query.trim() ||!chatContext.chatId) return;

    if(!isQuiz) {
        setMessages(prev => [...prev, { content: query, isUser: true,type: 'text',fullyRendered: true  }]);
        // Save user message to history
        await saveMessageToHistory('user',query);
    }
    else {
        // Save the quiz prompt too
        await saveMessageToHistory('user', "Requested a quiz on previous topics");
    }

    setUserInput('');
    setLoading(true);
    scrollToBottom(); // Scroll to show new messages immediately
    
    
    try {
      const templates = {
          normal: `Act as a ${selectedPersonality}. Keep in mind that the user is unable to see the context. Don't mention any context provided to you in response, just assume you know that.`,
          easy: `Act as a ${selectedPersonality} and explain this in a **simpler way** with **examples**.`,
          very_easy: `Act as a ${selectedPersonality} and **explain this to a 10-year-old** with **very simple terms and analogies**.`,
      };
  
      // Select the appropriate response format
      const selectedTemplate = isQuiz
          ? `Generate a quiz based on the user's previous learning.`
          : templates[understandingLevel];
        
        console.log("Sending query to backend...");
        // console.log(
        //   "sending : ",
        //   "query : ",query,
        //   "template :", selectedTemplate,
        //   "collection : ",collectionName
        // )

        const response = await fetch(`${BACKEND_URL}/generate-response/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                template: selectedTemplate,
                collection_name: collectionName,
                userId:chatContext.userId,
                bookId: chatContext.bookId,
            }),
        });

        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        const responseContent = data.response || 'Sorry, I couldn’t understand that. Please try again.';

        if (isQuiz) {
            try {
                const parsedQuizData = extractQuizData(responseContent);

                if (parsedQuizData.questions) {
                    setQuizData(parsedQuizData);
                    setShowQuiz(true);
                } else {
                    console.error("Invalid quiz format received.");
                    setMessages(prev => [...prev, { content: "Quiz format is incorrect. Please try again.", isUser: false }]);
                }
            } catch (e) {
                console.error('Failed to parse quiz JSON:', e);
                setMessages(prev => [...prev, { content: "Quiz parsing failed. Please try again.", isUser: false }]);
            }
        } else {
            setMessages(prev => [...prev, { content: responseContent, isUser: false,type:'text',fullyRendered:false }]);

            await saveMessageToHistory('assistant', responseContent);
        }

        scrollToBottom();
        return responseContent;
    } catch (error) {
        console.error('Error:', error);
        setMessages(prev => [...prev, { content: 'An error occurred. Please try again.', isUser: false }]);
        scrollToBottom();
        return null;
    } finally {
        setLoading(false);
    }
};

// 🟢 Handle Quiz Button Click
const handleQuizButtonClick = async () => {
    console.log("User clicked 'Have a Quiz!' button. Generating quiz...");

    setLoading(true); // Show loading state

    const quizPrompt = `
      Generate a quiz with 5 multiple-choice questions based on the general concepts from the user's previous learning.
      The user cannot see the context, so the questions should test their understanding of broader topics.
      Return the questions in JSON format:
      {
        "questions": [
          {
            "question": "What is the capital of France?",
            "options": ["Paris", "London", "Berlin", "Madrid"],
            "correct_answer": "Paris"
          },
          {
            "question": "What is 2 + 2?",
            "options": ["3", "4", "5", "6"],
            "correct_answer": "4"
          }
        ]
      }
    `;

    const response = await handleSendTxt(quizPrompt, true);

    if (response) {
        try {
            const strippedResponse = stripMarkdownCodeBlock(response);
            const parsedQuizData = JSON.parse(strippedResponse);

            if (parsedQuizData.questions) {
                setQuizData(parsedQuizData);
                setShowQuiz(true);
            } else {
                console.error("Quiz data is invalid.");
                setMessages(prev => [...prev, { content: "Quiz generation failed. Please try again.", isUser: false }]);
            }
        } catch (e) {
            console.error('Failed to parse quiz response:', e);
            setMessages(prev => [...prev, { content: "Quiz parsing failed. Please try again.", isUser: false }]);
        }
    }

    setLoading(false); // Hide loading state
};


const handleQuizSubmit = async (score: number, userAnswers: { [key: number]: string }) => {
  const quizResults = quizData!.questions.map((question, index) => {
    const userAnswer = userAnswers[index] || "No answer";
    const isCorrect = userAnswer === question.correct_answer;

    return `
### ❓ Question ${index + 1}
**${question.question}**

✅ **Your Answer:** ${userAnswer}
${isCorrect ? "✅ Correct!" : `❌ Incorrect!`}

🔍 **Correct Answer:** ${question.correct_answer}

💡 **Explanation:** ${isCorrect ? "*Well done!*" : "*Review this concept.*"}
    `;
  }).join('\n\n---\n\n'); // Divider between questions

  const percentage = Math.round((score / quizData!.questions.length) * 100);
  const performanceEmoji = percentage >= 80 ? '🎯' : percentage >= 50 ? '📚' : '🧠';
  const performanceComment = percentage >= 80
    ? "*Excellent work!* You nailed it!"
    : percentage >= 50
      ? "*Good effort!* Keep practicing!"
      : "*Keep trying!* You'll get better!";

  const quizSummary = `
## 📝 Quiz Results
${performanceEmoji} **Score:** ${score}/${quizData!.questions.length} (${percentage}%)  
${performanceComment}

### 📋 Question Breakdown
${quizResults}

> 💡 *Tip:* ${percentage < 100 ? 'Review the incorrect answers to improve.' : 'Perfect score! Share your achievement!'}
  `;

  const quizMessage: ChatMessage = {
    content: quizSummary,
    isUser: false,
  };

  setMessages(prev => [...prev, quizMessage]);
  // Save to chat history
  await saveMessageToHistory('assistant', quizSummary);

  setQuizData(null);
  setShowQuiz(false);
};


  return (
  <div className="flex flex-col h-[calc(110vh-12rem)] overflow-hidden bg-gradient-to-b from-white to-gray-50/50 rounded-xl">
  {/* Message Container */}
  <div className="flex-1 overflow-y-auto p-6 space-y-6">
    {messages.map((message, index) => (
      <div
        key={index}
        className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
      >
        {message.type === 'image' ? (
            <div className="p-2">
              <img
                src={message.content}
                alt="Screenshot"
                className="w-auto h-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.isUser ? "bg-indigo-600 text-white" : "bg-white text-gray-800 shadow"
            }`}>
              {message.isUser || message.fullyRendered ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <TypewriterText content={message.content} onComplete={() => {
                  // Mark message as fully rendered when typing completes
                  const updatedMessages = [...messages];
                  updatedMessages[index] = {...updatedMessages[index], fullyRendered: true};
                  setMessages(updatedMessages);
                }} />
              )}

            </div>
          )}
        </div>
      ))}

    {loading && (
      <div className="flex justify-start">
        <div className="bg-white border border-gray-200/50 rounded-2xl px-5 py-3 shadow-sm">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    )}

    {quizData && showQuiz && (
      <QuizInterface quizData={quizData} onQuizSubmit={handleQuizSubmit} />
    )}

    <div ref={messagesEndRef} />
  </div>

  {/* Control Panel */}
  <div className="p-4 border-t border-gray-200/50 bg-white/80 backdrop-blur-sm">
    {/* Dropdowns Section */}
    <div className="flex gap-3 mb-4">
      <select
        value={selectedPersonality}
        onChange={(e) => setSelectedPersonality(e.target.value)}
        className="flex-1 px-4 py-2.5 border border-gray-300/80 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
      >
        <option value="Professor">🧑‍🏫 Professor</option>
        <option value="Mentor">🧙 Mentor</option>
        <option value="Friend">😊 Friend</option>
        <option value="Comedian">🤡 Comedian</option>
        <option value="Socratic Teacher">🏛️ Socratic</option>
      </select>

      <select
        value={understandingLevel}
        onChange={(e) => setUnderstandingLevel(e.target.value as "normal" | "easy" | "very_easy")}
        className="flex-1 px-4 py-2.5 border border-gray-300/80 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
      >
        <option value="normal">📚 Normal</option>
        <option value="easy">🎓 Easier with examples</option>
        <option value="very_easy">🧒 Explain like I'm 10</option>
      </select>
    </div>

    {/* Input Section - Updated to include image preview */}
    <div className="flex flex-col gap-3">
          {imagePreview && (
            <div className="relative bg-gray-100 rounded-lg p-2 mb-2">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-40 max-w-full object-contain rounded-md"
              />
              <button
                onClick={removeImagePreview}
                className="absolute top-1 right-1 bg-gray-800/80 text-white rounded-full p-1 hover:bg-gray-900 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                </button>
            </div>
          )}
      <div className="flex items-end gap-3">
            <div className="flex-1 bg-white border border-gray-300/80 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    imagePreview ? handleSendImg() : handleSendTxt(userInput);
                  }
                }}
                placeholder={imagePreview ? "Ask about the image..." : "Ask something about the document..."}
                className="w-full px-4 py-3 text-gray-700 resize-none focus:outline-none bg-transparent rounded-xl"
                style={{ minHeight: "48px", maxHeight: "120px" }}
                ref={(textarea) => {
                  if (textarea) {
                    textarea.style.height = "auto";
                    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
                  }
                }}
              />
            </div>

      {/* Send Button */}
      <div className="relative group">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  imagePreview ? handleSendImg() : handleSendTxt(userInput);
                }}
                className="p-3 rounded-xl flex items-center justify-center transition-all duration-200 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg"
                disabled={!userInput.trim() && !imagePreview}
              >
                <Send size={20} />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {imagePreview ? "Send with image" : "Send Message"}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
              </div>
        </div>

      {/* Quiz Button with Persistent Tooltip */}
      {!showQuiz && (
        <div className="relative group">
          <button
            onClick={handleQuizButtonClick}
            className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            <BrainCircuit size={20} />
          </button>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Generate Quiz
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default ChatInterface;

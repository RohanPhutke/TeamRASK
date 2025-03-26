// components/ChatInterface.tsx
import { Send, FileText, BrainCircuit } from "lucide-react";
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import QuizInterface from './QuizInterface';

interface ChatMessage {
  content: string;
  isUser: boolean;
  type?: 'text' | 'image';
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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ collectionName = '', screenshotImage }) => {
  const [selectedPersonality, setSelectedPersonality] = useState("Professor");
  const [understandingLevel, setUnderstandingLevel] = useState<"normal" | "easy" | "very_easy">("normal");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const stripMarkdownCodeBlock = (response: string): string => {
    // Remove the Markdown code block (```json ... ```)
    return response.replace(/```json/g, '').replace(/```/g, '').trim();
  };

  useEffect(() => {
    if (screenshotImage) {
      const screenshotMessage: ChatMessage = {
        content: screenshotImage,
        isUser: true,
        type: 'image'
      };
      setMessages(prev => [...prev, screenshotMessage]);
    }
  }, [screenshotImage]);

  const handleSend = async (query: string, isQuiz: boolean = false) => {
    if (!query.trim()) return;

    // Define response templates based on selected personality
    const templates = {
        normal: `Act as a ${selectedPersonality}. Keep in mind that the user is unable to see the context. Don't mention any context provided to you in response, just assume you know that.`,
        easy: `Act as a ${selectedPersonality} and explain this in a **simpler way** with **examples**.`,
        very_easy: `Act as a ${selectedPersonality} and **explain this to a 10-year-old** with **very simple terms and analogies**.`,
    };

    // Select the appropriate response format
    const selectedTemplate = isQuiz
        ? `Generate a quiz based on the user's previous learning.`
        : templates[understandingLevel];

    if (!isQuiz) {
        setMessages(prev => [...prev, { content: query, isUser: true }]);
    }

    setUserInput('');
    setLoading(true);

    try {
        console.log("Sending query to backend...");
        console.log(
          "sending : ",
          "query : ",query,
          "template :", selectedTemplate,
          "collection : ",collectionName
        )

        const response = await fetch('http://127.0.0.1:8000/generate-response/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                template: selectedTemplate,
                collection_name: collectionName,
            }),
        });

        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        const responseContent = data.response || 'Sorry, I couldn’t understand that. Please try again.';

        if (isQuiz) {
            try {
                const strippedResponse = stripMarkdownCodeBlock(responseContent);
                const parsedQuizData = JSON.parse(strippedResponse);

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
            setMessages(prev => [...prev, { content: responseContent, isUser: false }]);
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

    const response = await handleSend(quizPrompt, true);

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


const handleQuizSubmit = (score: number, userAnswers: { [key: number]: string }) => {
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
            // For image messages, use a container that doesn't force padding/width constraints.
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
              <ReactMarkdown>{message.content}</ReactMarkdown>
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

    {/* Input Section */}
    <div className="flex items-end gap-3">
      <div className="flex-1 bg-white border border-gray-300/80 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && !e.shiftKey && handleSend(userInput)}
          placeholder="Ask something about the document..."
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

      {/* Send Button with Persistent Tooltip */}
      <div className="relative group">
        <button
          onClick={() => handleSend(userInput)}
          className="p-3 rounded-xl flex items-center justify-center transition-all duration-200 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg"
          disabled={!userInput.trim()}
        >
          <Send size={20} />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Send Message
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
  );
};

export default ChatInterface;

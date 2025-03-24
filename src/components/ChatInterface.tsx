// ChatInterface.tsx
import { Send, FileText, BrainCircuit } from "lucide-react";
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import QuizInterface from './QuizInterface';
import LoadingResponse from './LoadingResponse';

interface ChatMessage {
  content: string;
  isUser: boolean;
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
  collectionName?: string | null | undefined;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ collectionName = '' }) => {
  const [selectedPersonality, setSelectedPersonality] = useState("Professor");

  const [understandingLevel, setUnderstandingLevel] = useState<"normal" | "easy" | "very_easy">("normal");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const stripMarkdownCodeBlock = (response: string): string => {
    // Remove the Markdown code block (```json ... ```)
    return response.replace(/```json/g, '').replace(/```/g, '').trim();
  };

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
    // Add quiz results to chat history
    const quizResults = quizData!.questions.map((question, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === question.correct_answer;
      return `**Question:** ${question.question}\n**Your Answer:** ${userAnswer}\n**Correct Answer:** ${question.correct_answer}\n**Result:** ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`;
    }).join('\n\n');

    const quizSummary = `**Quiz Results:**\n\n${quizResults}\n\n**Score:** ${score} out of ${quizData!.questions.length}`;

    // Add quiz summary to chat history
    const quizMessage: ChatMessage = {
      content: quizSummary,
      isUser: false,
    };
    setMessages(prev => [...prev, quizMessage]);

    // Clear the quiz interface for a new quiz
    setQuizData(null);
    setShowQuiz(false);
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
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.isUser
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

        {loading && (<LoadingResponse />)}

        {quizData && showQuiz && (
          <QuizInterface quizData={quizData} onQuizSubmit={handleQuizSubmit} />
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t flex flex-wrap gap-2 items-center justify-between">
  {/* Personality Selection */}
  <select
    value={selectedPersonality}
    onChange={(e) => setSelectedPersonality(e.target.value)}
    className="px-3 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  >
    <option value="Professor">Professor</option>
    <option value="Mentor">Mentor</option>
    <option value="Friend">Friend</option>
    <option value="Comedian">Comedian</option>
    <option value="Socratic Teacher">Socratic Teacher</option>
  </select>

  {/* Understanding Level Dropdown */}
  <select
    value={understandingLevel}
    onChange={(e) => setUnderstandingLevel(e.target.value as "normal" | "easy" | "very_easy")}
    className="px-3 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  >
    <option value="normal">Normal</option>
    <option value="easy">Easier with examples</option>
    <option value="very_easy">Explain like I’m 10</option>
  </select>

  {/* Textarea for user input */}
  <div className="flex-1 flex items-center border rounded-lg px-3 py-2">
    <textarea
      value={userInput}
      onChange={(e) => setUserInput(e.target.value)}
      onKeyUp={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(userInput)}
      placeholder="Type your message..."
      className="flex-1 text-gray-700 resize-none focus:outline-none"
      style={{ whiteSpace: 'pre-wrap', minHeight: '40px', maxHeight: '100px' }}
      ref={(textarea) => {
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
        }
      }}
    />
  </div>

  {/* Buttons Section */}
  <div className="flex gap-2">
    {/* Send Button */}
    <button
      onClick={() => handleSend(userInput)}
      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-900 transition-colors flex items-center justify-center w-12 h-12"
      disabled={!userInput.trim()} // Prevent sending empty messages
    >
      <Send size={20} />
    </button>

    {/* Quiz Button */}
    {!showQuiz && (
      <button
        onClick={handleQuizButtonClick}
        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-900 transition-colors flex items-center justify-center w-12 h-12"
      >
        <BrainCircuit size={20} />
      </button>
    )}
  </div>
</div>



    </div>
  );
};

export default ChatInterface;

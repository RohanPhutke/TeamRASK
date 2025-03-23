// ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import QuizInterface from './QuizInterface';
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
  collectionName?: string| null| undefined;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ collectionName='' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const stripMarkdownCodeBlock = (response: string): string => {
    // Remove the Markdown code block (```json ... ```)
    return response.replace(/```json/g, '').replace(/```/g, '').trim();
  };

  const handleSend = async (query: string, template: string,isQuiz: boolean = false) => {
    // alert(collectionName);
    if (!query.trim()) return;

    if (!isQuiz) {
      // Add user message to chat only if it's not a quiz
      const userMessage: ChatMessage = {
        content: query,
        isUser: true,
      };
      setMessages(prev => [...prev, userMessage]);
    }

    console.log("Sending query to backend:", query);
    setUserInput('');

      try {
      // Send request to server
      const response = await fetch('http://127.0.0.1:8000/generate-response/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          template: template,
          collection_name: collectionName  
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      const responseContent = data.response || 'Sorry, I couldn’t understand that. Please try again.';

      if (!isQuiz) {
        // Add AI message to chat only if it's not a quiz
        const aiMessage: ChatMessage = {
          content: responseContent,
          isUser: false,
        };
        setMessages(prev => [...prev, aiMessage]);
      }


      scrollToBottom();
      return responseContent;

    } catch (error) {
      console.error('Error:', error);
      // Add error message to chat
      const errorMessage: ChatMessage = {
        content: 'An error occurred. Please try again.',
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
      scrollToBottom();
      return null;

    }
  };

  const handleQuizButtonClick = async () => {
    console.log("User clicked 'Have a Quiz!' button. Sending quiz generation prompt..."); // Debugging
    const quizPrompt = `
      Generate a quiz with 5 multiple-choice questions based on the general concepts from the user's previous learning. 
      The user cannot see the context, so the questions should test their understanding of broader topics, not specific details from the context.
      Return the questions in the following JSON format:
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
    console.log("User clicked 'Have a Quiz!' button. Sending quiz generation prompt...");
    const response = await handleSend(quizPrompt, "Generate a quiz based on the user's previous learning.", true);
    if (response) {
      try {
        const strippedResponse = stripMarkdownCodeBlock(response);
        const parsedQuizData = JSON.parse(strippedResponse);
        if (parsedQuizData.questions) {
          console.log("Quiz data parsed successfully:", parsedQuizData);
          setQuizData(parsedQuizData);
          setShowQuiz(true); // Show the quiz interface
        } else {
          console.error("Quiz data is invalid or missing questions.");
        }
      } catch (e) {
        console.error('Response is not a valid quiz:', e);
      }
    }
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
        {quizData && showQuiz && (
          <QuizInterface quizData={quizData} onQuizSubmit={handleQuizSubmit} />
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t">
        <div className="flex gap-2 w-full">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSend(userInput, "Act as a Professor , Keep in mind that user is unable to see the context , don't mention about any context provided to u here in repsonse, just assume u know that")}
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
            onClick={() => handleSend(userInput, "Act as a Professor , Keep in mind that user is unable to see the context , don't mention about any context provided to u here in repsonse, just assume u know that")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-900 transition-colors w-24"
          >
            Send
          </button>
          {!showQuiz && (
            <button
              onClick={handleQuizButtonClick}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-900 transition-colors w-24"
            >
              Have a Quiz!
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

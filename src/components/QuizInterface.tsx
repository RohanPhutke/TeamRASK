// components/QuizInterface.tsx
import React, { useState } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

interface QuizData {
  questions: QuizQuestion[];
}

interface QuizInterfaceProps {
  quizData: QuizData;
  onQuizSubmit: (score: number,userAnswers: { [key: number]: string }) => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ quizData, onQuizSubmit }) => {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerSelection = (questionIndex: number, option: string) => {
    if (!submitted) {
      setUserAnswers(prev => ({
        ...prev,
        [questionIndex]: option,
      }));
    }
  };

  const handleSubmit = () => {
    let score = 0;
    quizData.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correct_answer) {
        score++;
      }
    });
    setSubmitted(true);
    onQuizSubmit(score, userAnswers); // Pass userAnswers to handleQuizSubmit
  };
  
  const calculateScore = (): number => {
    if (!submitted || Object.keys(userAnswers).length === 0) return 0;
    
    let correctAnswers = 0;
    quizData.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });
    return Math.round((correctAnswers / quizData.questions.length) * 100);
  };

  
  return (
    <div className="quiz-container p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
      Quiz Time!
    </h2>
    <div className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
      Score: {calculateScore()}%
    </div>
  </div>

  {quizData.questions.map((question, index) => (
    <div key={index} className="quiz-question mb-6 p-4 rounded-xl bg-gray-50/50">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-start">
        <span className="mr-2 bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
          {index + 1}
        </span>
        {question.question}
      </h3>
      <div className="quiz-options space-y-2">
        {question.options.map((option, optionIndex) => {
          const isSelected = userAnswers[index] === option;
          const isCorrect = option === question.correct_answer;
          const showFeedback = submitted && (isSelected || isCorrect);

          let className = "flex items-start p-3 rounded-lg cursor-pointer transition-all";
          if (showFeedback) {
            className += isCorrect 
              ? " bg-green-50 border border-green-200 shadow-inner" 
              : isSelected 
                ? " bg-red-50 border border-red-200 shadow-inner" 
                : "";
          } else if (isSelected) {
            className += " bg-indigo-50 border border-indigo-200";
          } else {
            className += " hover:bg-gray-100/50";
          }

          return (
            <label key={optionIndex} className={className}>
              <input
                type="radio"
                name={`question-${index}`}
                value={option}
                onChange={() => handleAnswerSelection(index, option)}
                disabled={submitted}
                className="mt-1 mr-3 h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex-1">{option}</span>
              {showFeedback && (
                <span className={`ml-3 text-sm font-medium ${
                  isCorrect ? "text-green-600" : "text-red-600"
                }`}>
                  {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  ))}

  <div className="mt-6 flex justify-center">
    {!submitted ? (
      <button
        onClick={handleSubmit}
        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
      >
        Submit Quiz
      </button>
    ) : (
      <button
        onClick={() => setSubmitted(false)}
        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
      >
        Retry Quiz
      </button>
    )}
  </div>
</div>
  );
};

export default QuizInterface;
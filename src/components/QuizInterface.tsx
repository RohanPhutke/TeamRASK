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
  return (
    <div className="quiz-container p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Quiz Time!</h2>
      {quizData.questions.map((question, index) => (
        <div key={index} className="quiz-question mb-4">
          <h3 className="font-semibold mb-2">{question.question}</h3>
          <div className="quiz-options space-y-2">
            {question.options.map((option, optionIndex) => {
              const isSelected = userAnswers[index] === option;
              const isCorrect = option === question.correct_answer;
              const showFeedback = submitted && (isSelected || isCorrect);

              let className = "flex items-center space-x-2 p-2 rounded-lg";
              if (showFeedback) {
                if (isCorrect) {
                  className += " bg-green-100"; // Correct answer
                } else if (isSelected) {
                  className += " bg-red-100"; // Incorrect answer
                }
              } else if (isSelected) {
                className += " bg-indigo-100"; // Selected answer (before submission)
              }

              return (
                <label key={optionIndex} className={className}>
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={option}
                    onChange={() => handleAnswerSelection(index, option)}
                    disabled={submitted}
                    className="form-radio text-indigo-600"
                  />
                  <span>{option}</span>
                  {showFeedback && (
                    <span className="ml-2 text-sm font-semibold">
                      {isCorrect ? "✅ Correct" : "❌ Incorrect"}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-900 transition-colors"
        >
          Submit Quiz
        </button>
      ) : (
        <button
          onClick={() => setSubmitted(false)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-900 transition-colors"
        >
          Retry Quiz
        </button>
      )}
    </div>
  );
};

export default QuizInterface;
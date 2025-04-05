// components/TypewriterText.tsx
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const TypewriterText = ({ 
  content, 
  initialDisplayed = '',
  onComplete, 
  speed = 10 
}: { 
  content: string, 
  initialDisplayed?: string,
  onComplete: () => void,
  speed?: number 
}) => {
  const [displayedContent, setDisplayedContent] = useState(initialDisplayed);

  useEffect(() => {
    // If we already have the full content, just complete immediately
    if (displayedContent.length >= content.length) {
      onComplete();
      return;
    }

    // If we have some content but not all, continue from where we left off
    const startFrom = displayedContent.length;
    let i = startFrom;

    const typingInterval = setInterval(() => {
      if (i < content.length) {
        setDisplayedContent(content.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        onComplete();
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, []); // Empty dependency array means this runs only once on mount

  return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
};

export default TypewriterText;
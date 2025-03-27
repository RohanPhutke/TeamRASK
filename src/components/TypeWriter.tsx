import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const TypewriterText = ({ content, onComplete, speed = 10 }: { 
  content: string, 
  onComplete: () => void,
  speed?: number 
}) => {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    setDisplayedContent(''); // Reset when content changes
    
    let i = 0;
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
  }, [content, speed, onComplete]);

  return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
};

export default TypewriterText;
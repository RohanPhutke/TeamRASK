import { useState, useEffect, useRef } from 'react';
import UploadSection from './LandingPage/upload-section';
import SelectTextSection from './LandingPage/select-text-section';
import SnapshotSection from './LandingPage/snapshot-section';
import PersonalitySection from './LandingPage/personality-section';
import QuizSection from './LandingPage/quiz-section';
import TestimonialsSection from './LandingPage/testimonial-section';
import CTASection from './LandingPage/cta-section';
import Footer from './LandingPage/footer';
import HeroSection from './LandingPage/hero-section';

const LandingPage = () => {
  const [activeSection, setActiveSection] = useState('hero');

  const sections = [
    { id: 'upload', label: '' },
    { id: 'select-text', label: '' },
    { id: 'snapshot', label: '' },
    { id: 'personality', label: '' },
    { id: 'quiz', label: '' }
  ];

  // Handle scroll and update active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to section when timeline circle is clicked
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  // Create refs for each video
  const uploadVideoRef = useRef(null);
  const selectTextVideoRef = useRef(null);
  const snapshotVideoRef = useRef(null);
  const personalityVideoRef = useRef(null);
  const quizVideoRef = useRef(null);
  const heroVideoRef = useRef(null);

  useEffect(() => {
    // Create Intersection Observer to handle video play/pause
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5, // When 50% of the video is visible
    };

    const handleIntersection = (entries: any[], _observer: any) => {
      entries.forEach((entry: { target: any; isIntersecting: any; }) => {
        const video = entry.target;

        if (entry.isIntersecting) {
          video.play().catch((error: any) => {
            console.log("Video play failed:", error);
          });
        } else {
          // Only pause if it's not the first time seeing the video
          if (video.currentTime > 0) {
            video.pause();
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, options);

    // Observe all video elements
    const videoRefs = [
      uploadVideoRef.current,
      selectTextVideoRef.current,
      snapshotVideoRef.current,
      personalityVideoRef.current,
      quizVideoRef.current,
      heroVideoRef.current
    ];

    videoRefs.forEach(video => {
      if (video) {
        observer.observe(video);
      }
    });

    // Clean up observer when component unmounts
    return () => {
      videoRefs.forEach(video => {
        if (video) {
          observer.unobserve(video);
        }
      });
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Background Elements */}
      <div className="fixed -left-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-100/30 to-purple-100/30 blur-3xl opacity-50 -z-10"></div>
      <div className="fixed -right-40 bottom-0 w-96 h-96 rounded-full bg-gradient-to-br from-purple-100/30 to-indigo-100/30 blur-3xl opacity-50 -z-10"></div>

      {/* Timeline Navigation */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-20 hidden lg:block">
        <div className="relative">
          {sections.map((section) => (
            <div key={section.id} className="relative mb-8">
              <button
                onClick={() => {
                  scrollToSection(section.id);
                  setActiveSection(section.id);
                }}
                className="flex items-center focus:outline-none group"
              >
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${activeSection === section.id
                    ? 'bg-indigo-600 scale-150'
                    : 'bg-gray-400 group-hover:bg-indigo-400'
                  }`} />
                <span className={`ml-3 text-sm font-medium transition-all duration-300 ${activeSection === section.id
                    ? 'text-indigo-600 font-semibold'
                    : 'text-gray-500 group-hover:text-indigo-600'
                  }`}>
                  {section.label}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Main Content */}
      <div className="lg:mx-19 px-4 md:px-10"> {/* Adjusted for timeline space */}
        <HeroSection />
        <UploadSection />
        <SelectTextSection />
        <SnapshotSection />
        <PersonalitySection />
        <QuizSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
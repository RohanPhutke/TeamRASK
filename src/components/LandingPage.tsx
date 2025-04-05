import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  const scrollToSection = (sectionId: string) => {    const section = document.getElementById(sectionId);
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


  //    // Log to see if videos are properly loaded
  // videoRefs.forEach(video => {
  //   if (video) {
  //     console.log(`Video loaded: ${video.querySelector('source')?.src}`);
  //     console.log(`Video ready state: ${video.readyState}`);
  //   } else {
  //     console.log("Video ref is null");
  //   }
  // });

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
    <div className="min-h-screen bg-white relative">
      {/* Add padding to the left side of the page content to make room for timeline */}
      <div className="lg:pl-32">
        {/* Left side timeline navigation */}
        <div className="fixed left-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
          <div className="relative">
           
            {sections.map((section) => (
              <div key={section.id} className="relative mb-10">
                <button 
                  onClick={() => scrollToSection(section.id)}
                  className="flex items-center focus:outline-none group"
                >
                <div 
  className={`w-6 h-6 rounded-full border-2 border-indigo-600 transition-all duration-300 ${
    activeSection === section.id 
      ? 'bg-indigo-600 border-opacity-100' 
      : 'bg-white bg-opacity-60 border-opacity-60 hover:bg-indigo-200 hover:border-opacity-80'
  }`}
></div>
                  <span 
                    className={`ml-3 text-sm font-medium transition-all duration-300 ${
                      activeSection === section.id ? 'text-indigo-600' : 'text-gray-500 group-hover:text-indigo-600'
                    }`}
                  >
                    {section.label}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Section */}
        <section id="hero" className="pt-16 pb-16 md:pt-24 md:pb-24">          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
              <div className="flex-1 lg:pr-8">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center mb-6">
                  {/* <img src="favicon.svg" alt="Logo" width="40" height="40" style="border-radius: 50%; margin-left: 10px;" /> */}
                  <img
  src="favicon.svg"
  alt="Logo"
  width={40}
  height={40}
  
  style={{ borderRadius: '50%', marginRight: '10px', marginTop:'3px' }}
/>

                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">BookPulse</h1>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                    AI-powered book insights
                    <span className="text-indigo-600"> for deeper understanding</span>
                  </h2>
                  <p className="text-xl text-gray-600 mb-8 max-w-xl">
                    Transform how you read with AI-powered explanations, personalized insights, and interactive learning tools tailored to your reading level.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/dashboard" className="px-6 py-3 bg-indigo-600 text-white rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center">
                      Get Started Free
                      <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                    <a href="#" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Watch Demo
                    </a>
                  </div>
                </motion.div>
              </div>
              <div className="flex-1 flex justify-center">
                <motion.div 
                  className="w-full max-w-lg rounded-xl overflow-hidden bg-gray-100 aspect-video shadow-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                 <img 
  src="public/assets/home.png" 
  alt="BookPulse Hero" 
  className="w-full h-full object-cover rounded-xl"
/>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section id="upload" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">Upload Your Books</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Add your ebooks or PDFs to start your enhanced reading journey</p>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="rounded-xl overflow-hidden bg-gray-100 aspect-video shadow-lg"
                >
                              <video 
  ref={uploadVideoRef}
  className="w-full h-full object-cover"
  playsInline
  muted
  loop
  autoPlay
  preload="metadata"
>
  <source src="public/videos/upload.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
                </motion.div>
              </div>
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Simple Upload Process</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Upload your books in just a few clicks and let our AI analyze the content to provide you with insightful explanations.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Select Text Section */}
        <section id="select-text" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">Select Text For Analysis</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Highlight sections you want to understand better</p>
            </div>
            
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="flex-1">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="rounded-xl overflow-hidden bg-gray-100 aspect-video shadow-lg"
                >
                               <video 
  ref={selectTextVideoRef}
  className="w-full h-full object-cover"
  playsInline
  muted
  loop
  autoPlay
  preload="metadata"
>
  <source src="public/videos/selectText.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
                </motion.div>
              </div>
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Intuitive Text Selection</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Simply highlight any text you want to analyze and get instant AI-powered explanations and insights.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Snapshot Section */}
        <section id="snapshot" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">Get Insightful Snapshots</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">AI-generated summaries and key takeaways at your fingertips</p>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="rounded-xl overflow-hidden bg-gray-100 aspect-video shadow-lg"
                >
                <video 
  ref={snapshotVideoRef}
  className="w-full h-full object-cover"
  playsInline
  muted
  loop
  autoPlay
  preload="metadata"
>
  <source src="public/videos/snapshot-video.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
                </motion.div>
              </div>
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Quick Understanding</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Snapshots provide condensed insights about themes, characters, and key concepts in your reading materials.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Personality Section */}
        <section id="personality" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">Personalized Learning Experience</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Adaptive insights based on your reading preferences and knowledge level</p>
            </div>
            
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="flex-1">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="rounded-xl overflow-hidden bg-gray-100 aspect-video shadow-lg"
                >
                              <video 
  ref={personalityVideoRef}
  className="w-full h-full object-cover"
  playsInline
  muted
  loop
  autoPlay
  preload="metadata"
>
  <source src="public//videos/personality.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
                </motion.div>
              </div>
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Your Personal Reading Assistant</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    BookPulse learns from your reading habits and adapts to your level of understanding to provide personalized insights.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Quiz Section */}
        <section id="quiz" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">Interactive Quizzes</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Test your comprehension with AI-generated quizzes</p>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="rounded-xl overflow-hidden bg-gray-100 aspect-video shadow-lg"
                >
                               <video 
  ref={quizVideoRef}
  className="w-full h-full object-cover"
  playsInline
  muted
  loop
  autoPlay
  preload="metadata"
>
  <source src="public/videos/quiz.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
                </motion.div>
              </div>
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Reinforce Your Learning</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Challenge yourself with automatically generated quizzes to ensure you've grasped the key concepts.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">What Our Users Say</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Join hundreds of satisfied readers who have transformed their reading experience</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                   <img src="public\assets\govind.png" alt="gov" className='="round-full' />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Govind</h4>
                    <p className="text-gray-500 text-sm">Literature Student</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "BookPulse has completely changed how I approach complex literature. The AI explanations help me understand difficult passages that I would have otherwise missed."
                </p>
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>
              
              {/* Testimonial 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                   <img src="public\assets\avanish.png" alt="" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Avanish Gurjar</h4>
                    <p className="text-gray-500 text-sm">High School Teacher</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "I use BookPulse with my students to help them engage with classic literature. The quizzes and personalized insights have boosted class participation significantly."
                </p>
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>
              
              {/* Testimonial 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                    <img src="public\assets\aman.png" alt="" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Aman</h4>
                    <p className="text-gray-500 text-sm">Book Club Organizer</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "Our book club has been using BookPulse for six months now, and our discussions have become so much richer. The AI insights bring new perspectives we might have missed."
                </p>
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5" fill={star === 5 ? 'none' : 'currentColor'} stroke={star === 5 ? 'currentColor' : 'none'} viewBox="0 0 20 20">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>
            </div>
            
          
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-indigo-600 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Transform Your Reading Experience?</h2>
              <p className="text-xl mb-8 text-indigo-100">Join hundreds of readers who have already enhanced their understanding with BookPulse.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup" className="px-8 py-4 bg-white text-indigo-600 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors shadow-md">
                  Get Started Free
                </Link>
               
              </div>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {/* Company Info */}
              <div>
                <div className="flex items-center mb-4">
                <img
  src="favicon.svg"
  alt="Logo"
  width={40}
  height={40}
  
  style={{ borderRadius: '50%', marginRight: '10px', marginTop:'3px' }}
/>

                  <h3 className="text-xl font-bold">BookPulse</h3>
                </div>
                <p className="text-gray-400 mb-4">
                  AI-powered book insights for deeper understanding and enhanced learning.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.98 0a6.9 6.9 0 0 1 5.08 1.98A6.94 6.94 0 0 1 24 7.02v9.96c0 2.08-.68 3.87-1.98 5.13A7.14 7.14 0 0 1 16.94 24H7.06a7.06 7.06 0 0 1-5.03-1.89A6.96 6.96 0 0 1 0 16.94V7.02C0 2.8 2.8 0 7.02 0h9.96zm.05 2.23H7.06c-1.45 0-2.7.43-3.53 1.25a4.82 4.82 0 0 0-1.3 3.54v9.92c0 1.5.43 2.7 1.3 3.58a5 5 0 0 0 3.53 1.25h9.88a5 5 0 0 0 3.53-1.25 4.73 4.73 0 0 0 1.4-3.54V7.02a5 5 0 0 0-1.3-3.49 4.82 4.82 0 0 0-3.54-1.3zM12 5.76c3.39 0 6.2 2.8 6.2 6.2a6.2 6.2 0 0 1-12.4 0 6.2 6.2 0 0 1 6.2-6.2zm0 2.22a3.99 3.99 0 0 0-3.97 3.97A3.99 3.99 0 0 0 12 15.92a3.99 3.99 0 0 0 3.97-3.97A3.99 3.99 0 0 0 12 7.98zm6.44-3.77a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z" />
                    </svg>
                  </a>
                </div>
              </div>
              
              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                  <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                  <li><Link to="/testimonials" className="text-gray-400 hover:text-white transition-colors">Testimonials</Link></li>
                </ul>
              </div>
           
              {/* Contact */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-400">support@bookpulse.com</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-400">+91 9170743256</span>
                  </li>
                
                </ul>
              </div>
            </div>
            
            <div className="pt-8 mt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} BookPulse. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</Link>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</Link>
                <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors text-sm">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
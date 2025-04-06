// components/LandingPage/HeroSection.tsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Play } from 'lucide-react';

const HeroSection = () => {
  return (
    <section id="hero" className="pt-16 pb-16 md:pt-28 md:pb-28 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow"></div>
      
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
          {/* Text content */}
          <div className="flex-1 lg:pr-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Enhanced BookPulse Logo */}
              <motion.div 
                className="flex items-center mb-6 gap-3 group"
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative group">
                  <div className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                    {/* Core glow */}
                    <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Particles */}
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover:opacity-70"
                        initial={{ opacity: 0 }}
                        whileHover={{
                          opacity: [0, 0.7, 0],
                          y: [-5, 5],
                          x: [-5, 5],
                        }}
                        transition={{ 
                          duration: 1.5,
                          delay: i * 0.15,
                          repeat: Infinity,
                          repeatDelay: 3
                        }}
                        style={{
                          top: `${20 + Math.random() * 60}%`,
                          left: `${20 + Math.random() * 60}%`,
                        }}
                      />
                    ))}
                    <BookOpen className="h-6 w-6 text-white z-10 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  BookPulse
                </h1>
              </motion.div>

              <motion.h2 
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                AI-powered book insights
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  for deeper understanding
                </span>
              </motion.h2>

              <motion.p
                className="text-xl text-gray-600 mb-8 max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Transform how you read with AI-powered explanations, personalized insights, and interactive learning tools tailored to your reading level.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Link
                  to="/auth"
                  className="relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 shadow-lg overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
                </Link>

                <a
                  href="https://www.youtube.com/watch?v=qvDsA_jOF-0   target="_blank""
                  className="relative px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-xl text-lg font-semibold hover:bg-gray-50/50 transition-all duration-300 flex items-center group overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    <Play className="w-5 h-5 mr-2 text-indigo-600" />
                    Watch Demo
                  </span>
                  <span className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
                </a>
              </motion.div>
            </motion.div>
          </div>

          {/* Image/Video content */}
          <motion.div
            className="flex-1 flex justify-center relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, type: 'spring' }}
          >
            <div className="w-full max-w-3xl rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 aspect-video shadow-2xl border-4 border-white/20 relative group">
              <img
                src="/assets/home.png"
                alt="BookPulse Hero"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Floating elements */}
              <div className="absolute -left-4 -top-4 w-24 h-24 rounded-full bg-indigo-400/10 blur-xl -z-10"></div>
              <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full bg-purple-400/10 blur-xl -z-10"></div>

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

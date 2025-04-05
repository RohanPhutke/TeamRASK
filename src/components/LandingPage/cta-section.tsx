// components/CTASection.tsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CTASection = () => {
  return (
    <section className="relative py-28 bg-gradient-to-br from-indigo-600 to-purple-600 text-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-float-slow"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Ready to <span className="text-white/90">Transform</span> Your Reading Experience?
          </h2>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl lg:text-2xl mb-10 text-indigo-100 leading-relaxed"
          >
            Join thousands of readers who've unlocked <span className="font-medium text-white">deeper understanding</span> with BookPulse
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              to="/auth" 
              className="relative px-8 py-4 bg-white text-indigo-600 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <span className="relative z-10">Get Started Free</span>
              <span className="absolute inset-0 bg-gradient-to-r from-white to-gray-100 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl z-0"></span>
            </Link>
            
            <Link 
              to="/demo" 
              className="relative px-8 py-4 bg-transparent text-white rounded-xl text-lg font-semibold hover:bg-white/10 transition-all duration-300 border-2 border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <span className="relative z-10">Live Demo</span>
              <span className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl z-0"></span>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-8 text-indigo-200 text-sm flex flex-wrap justify-center items-center gap-4"
          >
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
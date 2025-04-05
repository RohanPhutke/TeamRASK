// components/LandingPage/TestimonialsSection.tsx
import { motion } from 'framer-motion';

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: "Govind",
      role: "Literature Student",
      content: "BookPulse has completely changed how I approach complex literature. The AI explanations help me understand difficult passages that I would have otherwise missed.",
      stars: 5,
      image: "/assets/govind.png"
    },
    {
      id: 2,
      name: "Avanish Gurjar",
      role: "High School Teacher",
      content: "I use BookPulse with my students to help them engage with classic literature. The quizzes and personalized insights have boosted class participation significantly.",
      stars: 5,
      image: "/assets/avanish.png"
    },
    {
      id: 3,
      name: "Aman",
      role: "Book Club Organizer",
      content: "Our book club has been using BookPulse for six months now, and our discussions have become so much richer. The AI insights bring new perspectives we might have missed.",
      stars: 4.5,
      image: "/assets/aman.png"
    }
  ];

  return (
    <section className="relative py-28 bg-gradient-to-br from-gray-50 to-indigo-50 overflow-hidden">
      {/* Background elements */}
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 mb-5"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <span className="text-sm font-semibold tracking-wider text-indigo-600 uppercase">
              Trusted by Readers
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl lg:text-5xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-indigo-700"
          >
            Voices of{' '}
            <span className="relative inline-block">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-indigo-700 relative z-10">
                Satisfaction
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 z-0"
                viewBox="0 0 200 15"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,8 Q100,20 200,8"
                  fill="none"
                  stroke="url(#underline-gradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="underline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </motion.h2>


          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            Join hundreds of readers who've <span className="font-medium text-indigo-600">transformed their experience</span>
          </motion.p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-white/20"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full bg-indigo-100/50 border-2 border-indigo-200 flex items-center justify-center overflow-hidden mr-5">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                  <p className="text-indigo-600 text-sm font-medium">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed relative pl-4">
                <svg className="absolute left-0 top-0 w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                {testimonial.content}
              </p>
              <div className="flex items-center">
                <div className="flex mr-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(testimonial.stars) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {testimonial.stars % 1 === 0 ? `${testimonial.stars}.0` : testimonial.stars}/5
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
// components/LandingPage/QuizSection.tsx
import { motion } from 'framer-motion';
import { useRef } from 'react';

const QuizSection = () => {
    const quizVideoRef = useRef<HTMLVideoElement>(null);

    return (
        <section id="quiz" className="relative py-28 bg-gradient-to-br from-white to-blue-50 overflow-hidden">
            {/* Background elements */}
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow"></div>

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
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        <span className="text-sm font-semibold tracking-wider text-blue-600 uppercase">
                            Active Recall
                        </span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-4xl lg:text-5xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-blue-700"
                    >
                        Interactive{' '}
                        <span className="relative inline-block">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-blue-700 relative z-10">
                                Knowledge Checks
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
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#6366F1" />
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
                        AI-generated quizzes that <span className="font-medium text-blue-600">adapt to your progress</span> and reinforce learning
                    </motion.p>
                </div>

                {/* Content grid */}
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Video container with quiz UI overlay */}
                    <div className="flex-1 relative group">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, type: 'spring' }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video shadow-2xl border border-white/20"
                        >
                            <video
                                ref={quizVideoRef}
                                className="w-full h-full object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                                playsInline
                                muted
                                loop
                                autoPlay
                                preload="auto"
                            >
                                <source src="/videos/quiz.mp4" type="video/mp4" />
                            </video>

                        </motion.div>

                        {/* Floating decorative elements */}
                        <div className="absolute -left-5 -top-5 w-24 h-24 rounded-full bg-blue-400/10 blur-xl -z-10"></div>
                        <div className="absolute -right-5 -bottom-5 w-32 h-32 rounded-full bg-indigo-400/10 blur-xl -z-10"></div>
                    </div>

                    {/* Text content */}
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="relative"
                        >
                            <div className="absolute -left-8 top-0 h-full w-0.5 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-50"></div>

                            <h3 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-blue-700">
                                Smart <span className="whitespace-nowrap">Retention Tools</span>
                            </h3>

                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                Our quizzes help cement knowledge with:
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Automatically generated questions",
                                    "Spaced repetition scheduling",
                                    "Difficulty adaptation",
                                    "Detailed answer explanations"
                                ].map((item, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: 10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 0.1 * index }}
                                        viewport={{ once: true }}
                                        className="flex items-start gap-3 text-gray-700"
                                    >
                                        <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        <span className="font-medium">{item}</span>
                                    </motion.li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                viewport={{ once: true }}
                                className="mt-10"
                            >
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default QuizSection;
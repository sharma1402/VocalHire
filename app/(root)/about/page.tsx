"use client";

import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">
      
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-4xl mx-auto"
      >
        <h1 className="text-5xl font-bold mb-6">
          About VocalHire
        </h1>

        <p className="text-lg text-gray-400">
          VocalHire is an AI-powered interview preparation platform built to help 
          candidates enhance their communication skills, build confidence, and 
          succeed in today’s competitive hiring landscape. Our intelligent system 
          simulates real interview scenarios, enabling users to practice effectively 
          and improve with actionable insights.
        </p>
      </motion.div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
        
        {[
          {
            title: "AI-Powered Mock Interviews",
            desc: "Engage in realistic interview simulations powered by advanced AI to prepare for real-world scenarios."
          },
          {
            title: "Real-Time Feedback",
            desc: "Receive instant, data-driven feedback to refine your responses and communication style."
          },
          {
            title: "Performance Tracking",
            desc: "Monitor your progress with detailed insights and continuously improve your interview readiness."
          }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ delay: i * 0.2 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/40 to-gray-900 shadow-xl"
          >
            <h3 className="text-xl font-semibold mb-3">
              {item.title}
            </h3>
            <p className="text-gray-400">
              {item.desc}
            </p>
          </motion.div>
        ))}

      </div>

      {/* CTA */}
      <motion.div
        className="mt-24 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
      >
        <h2 className="text-3xl font-bold mb-6">
          Start Your Interview Preparation Journey
        </h2>

        <a
          href="/sign-in"
          className="px-6 py-3 bg-purple-600 rounded-xl hover:bg-purple-500 transition"
        >
          Get Started
        </a>
      </motion.div>

    </div>
  );
}
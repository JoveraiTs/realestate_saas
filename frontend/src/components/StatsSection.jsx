// components/StatsSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

const StatsSection = ({ stats }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section ref={ref} className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center text-white"
            >
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center">
                  {React.cloneElement(stat.icon, { className: "w-6 h-6 text-white" })}
                </div>
              </div>
              <div className="text-3xl lg:text-4xl font-bold mb-2">
                {inView && <CountUp end={parseInt(stat.value)} duration={2.5} />}
                {stat.value.includes('+') ? '+' : stat.value.includes('%') ? '%' : ''}
              </div>
              <p className="text-blue-100 text-sm lg:text-base">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
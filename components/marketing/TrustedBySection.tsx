'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Logo {
  name: string;
  imagePath: string;
}

export const TrustedBySection: React.FC = () => {
  // Update these paths to match your actual image filenames
  const logos: Logo[] = [
    {
      name: 'Sigma Chi Eta',
      imagePath: '/chapter-logos/Beta_Theta_Pi_Coat_Arms.png', // Update with your actual filename
    },
    {
      name: 'Alpha Beta Gamma',
      imagePath: '/chapter-logos/Beta_Theta_Pi_Coat_Arms.png', // Update with your actual filename
    },
    {
      name: 'Delta Epsilon',
      imagePath: '/chapter-logos/Beta_Theta_Pi_Coat_Arms.png', // Update with your actual filename
    },
    {
      name: 'Theta Iota',
      imagePath: '/chapter-logos/Beta_Theta_Pi_Coat_Arms.png', // Update with your actual filename
    },
    {
      name: 'Kappa Lambda',
      imagePath: '/chapter-logos/Beta_Theta_Pi_Coat_Arms.png', // Update with your actual filename
    },
    {
      name: 'Mu Nu',
      imagePath: '/chapter-logos/Beta_Theta_Pi_Coat_Arms.png', // Update with your actual filename
    },
  ];

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...logos, ...logos, ...logos];

  return (
    <div className="relative w-full pt-6 md:pt-8 pb-2 md:pb-4 overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="text-center mb-6 md:mb-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xs md:text-sm font-semibold tracking-wider uppercase text-gray-500 mb-2"
          >
            Trusted By
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900"
          >
            Leading Chapters
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative mx-auto max-w-6xl"
        >
          <div className="relative rounded-xl md:rounded-2xl border border-gray-200/50 bg-white/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-navy-500/5 via-transparent to-blue-500/5" />
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(35,70,224,0.08),rgba(255,255,255,0))]" />
            
            <div className="relative py-6 md:py-8 px-4">
              <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                <motion.div
                  animate={{
                    x: [0, -1440],
                  }}
                  transition={{
                    x: {
                      repeat: Infinity,
                      repeatType: 'loop',
                      duration: 30,
                      ease: 'linear',
                    },
                  }}
                  className="flex gap-8 md:gap-16 pr-8 md:pr-16"
                >
                  {duplicatedLogos.map((logo, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-center min-w-[120px] md:min-w-[160px] group"
                    >
                      <div className="opacity-60 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center h-12 w-12 md:h-16 md:w-16">
                        <Image
                          src={logo.imagePath}
                          alt={logo.name}
                          width={64}
                          height={64}
                          className="h-12 w-12 md:h-16 md:w-16 object-contain"
                          unoptimized={false}
                        />
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          <div className="absolute -inset-1 bg-gradient-to-r from-navy-500/10 via-blue-500/10 to-navy-500/10 rounded-xl md:rounded-2xl blur-xl opacity-30 -z-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center mt-4 md:mt-6"
        >
          <p className="text-xs md:text-sm text-gray-600">
            Join thousands of chapters building stronger alumni networks
          </p>
        </motion.div>
      </div>
    </div>
  );
};
'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star as StarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Reviewer = {
  name: string;
  role: string;
  text: string;
};

const SpotlightCard: React.FC<{
  image?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ image, footer, className = '', style }) => {
  return (
    <motion.div
      className={`bg-white dark:bg-neutral-800/80 rounded-2xl shadow-md dark:shadow-neutral-800 overflow-hidden transition-colors duration-500 ${className}`}
      style={style}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {image}
      {footer}
    </motion.div>
  );
};

const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = name
    .split(' ')
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join('');

  return (
    <motion.div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-100 transition-colors duration-500 text-sm sm:text-base">
      {initials}
    </motion.div>
  );
};

const ReviewsSection: React.FC = () => {
  const t = useTranslations('Reviews');
  const [showAll, setShowAll] = useState(false);
  const reviewers = t.raw('reviewers') as Reviewer[];
  const visibleReviews = showAll ? reviewers : reviewers.slice(0, 3);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const starVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (custom: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: custom * 0.1,
        type: 'spring' as const,
        stiffness: 200,
      },
    }),
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.4,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.3 },
    },
  };

  return (
    <section
      id="reviews-section"
      className="py-12 pb-0 bg-white dark:bg-black transition-colors duration-500 overflow-hidden"
    >
      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 pb-12"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Заголовок */}
        <motion.div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={starVariants}
                whileHover={{ scale: 1.3, rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 dark:text-yellow-400 transition-colors duration-500 fill-current" />
              </motion.div>
            ))}
          </div>

          <motion.h2
            className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-500 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {t('reviewsTitle')}
          </motion.h2>
          <motion.p
            className="text-sm sm:text-base text-gray-600 dark:text-[#888888] mt-2 transition-colors duration-500 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {t('reviewsSubtitle')}
          </motion.p>
        </motion.div>

        {/* Відгуки - ВИПРАВЛЕНО */}
        <div className="relative w-full">
          <motion.div
            className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            animate={{
              height: showAll ? 'auto' : 'auto',
            }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence>
              {visibleReviews.map((r, idx) => (
                <motion.div
                  key={`${r.name}-${idx}`}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full"
                >
                  <SpotlightCard
                    className="transition hover:shadow-lg dark:hover:shadow-neutral-700 h-full"
                    image={
                      <div className="w-full h-20 sm:h-24 bg-gray-100 dark:bg-neutral-800 flex items-end p-3 sm:p-4 transition-colors duration-500">
                        <div className="flex items-center gap-2 sm:gap-3 w-full">
                          <Avatar name={r.name} />
                          <motion.div
                            className="text-left flex-1 min-w-0"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white transition-colors duration-500 truncate">
                              {r.name}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-[#888888] transition-colors duration-500 truncate">
                              {r.role}
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    }
                    footer={
                      <motion.div
                        className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 min-h-[100px] sm:min-h-[120px] flex items-start"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 transition-colors duration-500 line-clamp-4">
                          "{r.text}"
                        </p>
                      </motion.div>
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Кнопка */}
        <motion.div
          className="flex justify-center mt-6 sm:mt-8"
          variants={buttonVariants}
        >
          <motion.button
            onClick={() => setShowAll(!showAll)}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-neutral-800 dark:hover:bg-neutral-300 transition-colors duration-300 cursor-pointer text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showAll ? t('showLessReviews') : t('showMoreReviews')}
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ReviewsSection;

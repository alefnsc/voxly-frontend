import React from 'react';
import { motion } from 'framer-motion';

// Typing effect configuration
const typingVariants = {
  hidden: {
    opacity: 1,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.2,
    },
  },
};

const letterVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

type TypingTextEffectProps = {
  text: string;
};

const TypingTextEffect: React.FC<TypingTextEffectProps> = ({ text }) => {
  return (
    <motion.div
      variants={typingVariants}
      initial="hidden"
      animate="visible"
    >
      {text.split('').map((char, index) => (
        <motion.span key={index} variants={letterVariants}>
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default TypingTextEffect;
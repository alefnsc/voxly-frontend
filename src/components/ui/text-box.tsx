import React, { ReactNode } from 'react';

interface TextBoxProps {
    children: ReactNode;
    className?: string;
}

const TextBox: React.FC<TextBoxProps> = ({ children, className = '' }) => {
    return (
        <div className={`
            text-gray-700 
            bg-gray-50 
            border border-gray-200 
            rounded-lg 
            px-4 sm:px-6 
            py-4 sm:py-5 
            text-sm sm:text-base 
            leading-relaxed
            shadow-sm 
            w-full 
            overflow-hidden
            transition-colors
            hover:border-gray-300
            ${className}
        `}>
           {children}
        </div>
    );
};

export default TextBox;
import React from 'react';
import { Icons } from 'components/icons'

interface LoadingProps {
    message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
    return (
        <div 
            className="h-screen flex w-screen items-center justify-center bg-white"
            role="status"
            aria-live="polite"
            aria-label={message}
        >
            <div className="flex gap-x-2 items-center">
                <Icons.loader className="animate-spin h-6 w-6 text-gray-600" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-600">
                    {message}
                </span>
            </div>
        </div>
    )
}

export default Loading

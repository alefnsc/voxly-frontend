import React from 'react';
import { Modal } from 'components/ui/modal';
import { Button } from 'components/ui/button';
import { AlertTriangle, Info, XCircle, CheckCircle, ArrowLeft, LogOut } from 'lucide-react';

interface QuitInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuit: () => void;
    message?: string;
}

const QuitInterviewModal: React.FC<QuitInterviewModalProps> = ({
    isOpen,
    onClose,
    onQuit,
    message = "Your interview will end and you'll be redirected."
}) => {
    return (
        <Modal 
            title="Are you sure you want to quit?" 
            isOpen={isOpen} 
            onClose={onClose}
            className="max-w-md sm:max-w-lg"
        >
            <div className="p-2 sm:p-4 flex flex-col items-center">
                {/* Warning Icon */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
                </div>

                {/* Main Message */}
                <p className="text-gray-600 mb-4 sm:mb-6 text-center text-sm sm:text-base px-2">
                    {message}
                </p>

                {/* Info Box */}
                <div className="bg-gray-50 border border-gray-200 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 w-full">
                    <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-2 sm:mb-3 flex items-center">
                        <Info className="mr-2 w-4 h-4 sm:w-5 sm:h-5 text-purple-500" /> 
                        What happens if you quit
                    </h3>
                    <ul className="text-gray-600 space-y-2 text-sm">
                        <li className="flex items-start">
                            <CheckCircle className="mr-2 mt-0.5 text-green-500 flex-shrink-0 w-4 h-4" />
                            <span>If under 15 seconds, your credit will be restored</span>
                        </li>
                        <li className="flex items-start">
                            <XCircle className="mr-2 mt-0.5 text-red-500 flex-shrink-0 w-4 h-4" />
                            <span>If over 15 seconds, your credit will be consumed</span>
                        </li>
                        <li className="flex items-start">
                            <XCircle className="mr-2 mt-0.5 text-red-500 flex-shrink-0 w-4 h-4" />
                            <span>Your current progress will not be saved</span>
                        </li>
                    </ul>
                </div>

                {/* Confirmation Text */}
                <p className="text-gray-700 mb-4 sm:mb-6 text-center text-sm sm:text-base font-medium">
                    Are you sure you want to proceed?
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-3 sm:gap-4">
                    <Button
                        variant="outline"
                        size="default"
                        onClick={onClose}
                        className="w-full sm:w-auto flex items-center justify-center border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Return to Interview
                    </Button>

                    <Button
                        variant="default"
                        size="default"
                        onClick={onQuit}
                        className="w-full sm:w-auto flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <LogOut className="mr-2 w-4 h-4" />
                        Quit Anyway
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default QuitInterviewModal;
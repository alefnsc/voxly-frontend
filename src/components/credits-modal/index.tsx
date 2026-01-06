import React from 'react';
import { Modal } from 'components/ui/modal';
import { Button } from 'components/ui/button';
import { Coins, Award, RefreshCw } from 'lucide-react';
import { FREE_TRIAL_CREDITS, formatCreditsText } from 'config/credits';

interface CreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal
            title="No Interview Credits Available"
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-md sm:max-w-lg"
        >
            <div className="p-2 sm:p-4 flex flex-col items-center">
                {/* Icon */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <Coins className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" data-testid="coins-icon" />
                </div>

                {/* Main Message */}
                <p className="text-gray-600 mb-4 sm:mb-6 text-center text-sm sm:text-base px-2">
                    You currently have no interview credits available. Credits are required to start new interview sessions.
                </p>

                {/* Info Box */}
                <div className="bg-gray-50 border border-gray-200 p-3 sm:p-4 rounded-lg w-full mb-4 sm:mb-6">
                    <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-3 sm:mb-4 flex items-center">
                        <Award className="mr-2 w-4 h-4 sm:w-5 sm:h-5 text-purple-500" data-testid="award-icon" /> 
                        How to earn more credits:
                    </h3>

                    <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex items-start">
                            <RefreshCw className="mr-2 text-green-500 shrink-0 mt-0.5 w-4 h-4" data-testid="refresh-icon" />
                            <span>
                                {formatCreditsText(FREE_TRIAL_CREDITS)} {FREE_TRIAL_CREDITS === 1 ? 'is' : 'are'} automatically provided each month
                            </span>
                        </li>
                        <li className="flex items-start">
                            <Award className="mr-2 text-amber-500 shrink-0 mt-0.5 w-4 h-4" />
                            <span>Earn additional credits through community participation and contributions</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-3 sm:gap-4">
                    <Button
                        variant="outline"
                        size="default"
                        className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        onClick={onClose}
                        data-testid="close-button"
                    >
                        Close
                    </Button>

                    <Button
                        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
                        variant="default"
                        size="default"
                        onClick={() => window.open('/community', '_blank')}
                    >
                        Visit Community
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default CreditsModal;
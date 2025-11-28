import React from 'react';
import { Modal } from 'components/ui/modal';
import { Button } from 'components/ui/button';
import { Shield, InfoIcon, Users, ExternalLink } from 'lucide-react';

interface RoleRestrictionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RoleRestrictionModal: React.FC<RoleRestrictionModalProps> = ({
    isOpen,
    onClose
}) => {
    return (
        <Modal title="Access Restricted" isOpen={isOpen} onClose={onClose}>
            <div className="p-4 flex flex-col items-center">
                <Shield className="w-16 h-16 text-gray-400 mb-4" />

                <p className="text-gray-300 mb-4 text-center">
                    This application is currently available only for PSP (Programador Sem Pátria) members.
                </p>

                <div className="bg-gray-800 p-4 rounded-md mb-4 w-full">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                        <InfoIcon className="mr-2" /> About PSP Access
                    </h3>
                    <ul className="text-gray-300 space-y-2">
                        <li className="flex items-start">
                            <Users className="mr-2 mt-1 text-voxly flex-shrink-0" size={16} />
                            This is an exclusive feature for PSP community members
                        </li>
                        <li className="flex items-start">
                            <Shield className="mr-2 mt-1 text-voxly flex-shrink-0" size={16} />
                            Your account doesn't have the required PSP role
                        </li>
                    </ul>
                </div>

                <p className="text-gray-300 mb-4 text-center text-sm">
                    If you believe this is an error or you're a PSP member, please contact support.
                </p>

                <div className="flex items-center justify-center space-x-4 mt-4">
                    <Button
                        variant="outline"
                        size="default"
                        onClick={onClose}
                        className="flex items-center"
                    >
                        Close
                    </Button>

                    <Button
                        className="bg-voxly hover:bg-purple-900"
                        size="default"
                        onClick={() => window.open('https://programadorsempatria.com.br', '_blank')}
                    >
                        <ExternalLink className="mr-2" size={16} />
                        Learn about PSP
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default RoleRestrictionModal; 
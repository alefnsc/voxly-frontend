import React from 'react';
import { useNavigate } from 'react-router-dom';
import PurpleButton from 'components/ui/purple-button';
import { Plus } from 'lucide-react';

const InterviewReady: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="voxly-card bg-voxly-gradient text-white">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Ready for another practice session?</h3>
          <p className="text-purple-100 mt-1">Start a new interview to keep improving your skills.</p>
        </div>
        <PurpleButton
          variant="secondary"
          size="lg"
          onClick={() => navigate('/interview-setup')}
          className="bg-white text-voxly-purple hover:bg-gray-100 border-0"
        >
          <Plus className="w-5 h-5" />
          Start Interview
        </PurpleButton>
      </div>
    </div>
  );
};

export default InterviewReady;
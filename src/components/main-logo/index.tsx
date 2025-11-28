'use client'
import { useNavigate } from 'react-router-dom';

type MainLogoProps = {
  isMobile?: boolean
}

const MainLogo: React.FC<MainLogoProps> = ({ isMobile }) => {
  const navigate = useNavigate();

  const handleNavigateHome = () => {
    navigate('/');
  };

  const size = 100  ;

  return (
    <>
      <div className="flex h-[60px] w-full items-center">
        <div
          onClick={handleNavigateHome}
          className="flex items-center cursor-pointer"
        >
          <img src='/app-logo.png' alt="Logo" height={size} width={size} />
        </div>
      </div>
    </>
  )
}

export default MainLogo
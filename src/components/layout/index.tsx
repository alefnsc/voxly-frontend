import React from 'react';
import { Outlet } from 'react-router-dom';
import 'styles/globals.css';
import Footer from 'components/footer';
import Metadata from 'components/metadata';
import { BetaFeedbackFab } from 'components/beta-feedback';
import { isClosedBetaFeedbackEnabled } from 'config/featureFlags';

const Layout: React.FC = () => {
  const isBetaMode = isClosedBetaFeedbackEnabled();

  return (
    <div>
      <Metadata />
      <Outlet />
      <Footer />
      {/* Show Beta Feedback FAB when in beta mode */}
      {isBetaMode && <BetaFeedbackFab />}
    </div>
  );
}

export default Layout;
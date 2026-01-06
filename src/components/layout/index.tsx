import React from 'react';
import { Outlet } from 'react-router-dom';
import 'styles/globals.css';
import AppHeader from 'components/header';
import Footer from 'components/footer';
import Metadata from 'components/metadata';
import { BetaFeedbackFab } from 'components/beta-feedback';
import { isClosedBetaFeedbackEnabled } from 'config/featureFlags';
import { HEADER_OFFSET_CLASSES } from 'config/layout';

const Layout: React.FC = () => {
  const isBetaMode = isClosedBetaFeedbackEnabled();

  return (
    <div>
      <Metadata />
      <AppHeader mode="public" />
      <div className={HEADER_OFFSET_CLASSES.paddingTop}>
        <Outlet />
      </div>
      <Footer />
      {/* Show Beta Feedback FAB when in beta mode */}
      {isBetaMode && <BetaFeedbackFab />}
    </div>
  );
}

export default Layout;
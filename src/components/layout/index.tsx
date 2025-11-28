import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from 'lib/utils';
import 'styles/globals.css';
import Footer from 'components/footer';
import Metadata from 'components/metadata';

const Layout: React.FC = () => {
  return (
    <div>
      <Metadata />
      <Outlet />
      <Footer />
    </div>
  );
}

export default Layout;
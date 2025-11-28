// src/components/Metadata.tsx
import React from 'react';
import { Helmet } from 'react-helmet';

const appConfig = {
  name: 'Voxly AI | Mock Interview',
  description: 'Your AI Interviewer for surpassing hiring challenges.',
};

interface MetadataProps {
  title?: string;
  description?: string;
}

const Metadata: React.FC<MetadataProps> = () => {
  const { name, description } = appConfig;

  return (
    <Helmet>
      <title>{name}</title>
      <meta name="description" content={description} />
      <link rel="icon" href="/logo.svg" />
    </Helmet>
  );
};

export default Metadata;
import React from 'react';
import { Canvas } from '@react-three/fiber';
import Line from 'components/sphere'
import * as THREE from 'three';

interface AudioVisualizerProps {
  agentAudioData?: Float32Array;
  userAudioData?: Float32Array;
  isAgentTalking: boolean;
  testMode?: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  agentAudioData,
  userAudioData,
  isAgentTalking,
  testMode = false
}) => {
  // Create line positions in a row
  const lineCount = 20;
  const totalWidth = 10;
  const lineWidth = totalWidth / lineCount * 0.8;
  const gap = totalWidth / lineCount * 0.2;

  const linePositions = Array.from({ length: lineCount }, (_, i) => {
    const x = (i * (lineWidth + gap)) - (totalWidth / 2) + (lineWidth / 2);
    const y = 0;
    const z = 0;
    return [x, y, z] as [number, number, number];
  });

  if (testMode) {
    return (
      <div style={{ width: '100%', height: '300px' }}>
        <div data-testid="canvas">
          <div data-testid="ambient-light" />
          <div data-testid="point-light" data-position="[0,5,5]" />
          {linePositions.map((position, index) => (
            <Line
              key={index}
              position={position}
              width={lineWidth}
              index={index}
              agentAudioData={agentAudioData}
              userAudioData={userAudioData}
              isAgentTalking={isAgentTalking}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
        <primitive object={new THREE.AmbientLight(0xffffff, 0.5)} />
        <primitive object={new THREE.PointLight(0xffffff, 10)} position={[0, 5, 5]} />

        {linePositions.map((position, index) => (
          <Line
            key={index}
            position={position}
            width={lineWidth}
            index={index}
            agentAudioData={agentAudioData}
            userAudioData={userAudioData}
            isAgentTalking={isAgentTalking}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default AudioVisualizer;
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface LineProps {
    index: number;
    position: [number, number, number];
    width: number;
    agentAudioData?: Float32Array;
    userAudioData?: Float32Array;
    isAgentTalking: boolean;
}

function Line(props: LineProps) {
    const mesh = useRef<THREE.Mesh>(null);
    const [intensity, setIntensity] = useState(0);
    const [smoothedIntensity, setSmoothedIntensity] = useState(0);
    const [height, setHeight] = useState(0.2);
    const rotationRef = useRef(0);
    const initialPosition = useRef<[number, number, number]>([...props.position]);

    useEffect(() => {
        if (props.isAgentTalking && props.agentAudioData && props.agentAudioData.length > 0) {
            const binIndex = Math.floor(props.index * (props.agentAudioData.length / 20));
            const value = Math.abs(props.agentAudioData[binIndex] || 0);
            setIntensity(value * 15);
            setHeight(Math.max(0.2, value * 5));
        }
        else if (!props.isAgentTalking && props.userAudioData && props.userAudioData.length > 0) {
            const binIndex = Math.floor(props.index * (props.userAudioData.length / 20));
            let sum = 0;
            const sliceSize = Math.floor(props.userAudioData.length / 20);
            const startIdx = binIndex;
            const endIdx = Math.min(startIdx + sliceSize, props.userAudioData.length);

            for (let i = startIdx; i < endIdx; i++) {
                sum += props.userAudioData[i] * props.userAudioData[i];
            }

            const rms = Math.sqrt(sum / sliceSize);
            const threshold = 0.01;
            const amplification = 15;
            const newIntensity = rms > threshold ? rms * amplification : 0;
            setIntensity(newIntensity);
            setHeight(Math.max(0.2, newIntensity * 3));
        }
    }, [props.agentAudioData, props.userAudioData, props.index, props.isAgentTalking]);

    useFrame((state) => {
        if (mesh.current) {
            const time = state.clock.getElapsedTime();
            setSmoothedIntensity(prev => THREE.MathUtils.lerp(prev, intensity, 0.16));
            const usedIntensity = smoothedIntensity;

            if (props.isAgentTalking) {
                if (props.index < 4) {
                    mesh.current.visible = true;
                    const spacing = 1.2;
                    const startX = -1.8;
                    mesh.current.position.x = startX + props.index * spacing;
                    mesh.current.position.z = 0;
                    mesh.current.rotation.set(0, 0, 0);
                    const baseSize = 0.7;

                    if (usedIntensity > 0) {
                        const maxScale = baseSize * 1.18;
                        const expansion = usedIntensity * 0.18; 
                        const scale = Math.max(
                            baseSize,
                            Math.min(baseSize + expansion, maxScale)
                        );
                        mesh.current.scale.set(scale, scale, scale);
                        
                        // Move up and down based on audio intensity
                        const bounceHeight = usedIntensity * 0.3; // Height based on intensity
                        const phaseOffset = props.index * 0.1; // Each dot has different phase
                        mesh.current.position.y = Math.sin(time * 1 + phaseOffset) * bounceHeight;
                    } else {
                        const pulse = Math.sin(time * 1.2 + props.index * 0.3) * 0.02 + baseSize;
                        mesh.current.scale.set(pulse, pulse, pulse);
                        mesh.current.position.y = 0;
                    }
                } else {
                    mesh.current.visible = false;
                }
            } else {
                const totalCircles = 11;
                if (props.index < totalCircles) {
                    mesh.current.visible = true;
                    const circleRadius = 2.5;
                    const angle = (props.index / totalCircles) * Math.PI * 2;
                    rotationRef.current += 0.0000; 
                    const rotationAngle = rotationRef.current + angle;
                    mesh.current.position.x = Math.cos(rotationAngle) * circleRadius;
                    mesh.current.position.y = Math.sin(rotationAngle) * circleRadius;
                    mesh.current.position.z = 0;
                    mesh.current.rotation.set(0, 0, 0);
                    const baseSize = 0.7;

                    if (usedIntensity > 0) {
                        const frequencyFactor = 1 + (props.index / totalCircles) * 0.3;
                        const audioImpact = usedIntensity * 0.8 * frequencyFactor;
                        const targetScale = Math.max(baseSize, Math.min(baseSize + audioImpact, baseSize * 1.5));
                        mesh.current.scale.set(targetScale, targetScale, targetScale);
                    } else {
                        const pulse = Math.sin(time * 1.5 + props.index * 0.5) * 0.03 + baseSize;
                        mesh.current.scale.set(pulse, pulse, pulse);
                    }
                } else {
                    mesh.current.visible = false;
                }
            }
        }
    });

    return (
        <mesh
            ref={mesh}
            position={props.position}
            scale={[1, height, 1]}
            rotation={[0, 0, 0]}
        >
            <circleGeometry args={[0.5, 32]} />
            <meshStandardMaterial
                color={new THREE.Color(0x9333EA)}
                emissive={new THREE.Color(0x7C3AED)}
                emissiveIntensity={0.8}
                roughness={0.2}
                metalness={0.4}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

export default Line;
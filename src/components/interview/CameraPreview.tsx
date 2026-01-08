/**
 * CameraPreview Component
 * 
 * Displays the interviewee's camera video preview during an interview.
 * Provides toggle controls and handles error states gracefully.
 * 
 * Features:
 * - Video preview with playsInline, autoPlay, muted
 * - On/Off toggle button
 * - Status label showing current state
 * - Error states: permission denied, no camera detected
 * - Allows interview to continue even if camera access fails
 */

import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Video, VideoOff, AlertCircle } from 'lucide-react';
import { useCameraPreview, CameraPreviewError } from 'hooks/useCameraPreview';

export interface CameraPreviewProps {
  /** External stream to display (if provided, skips internal useCameraPreview) */
  stream?: MediaStream | null;
  /** Whether to auto-start the camera on mount (only used if stream not provided) */
  autoStart?: boolean;
  /** Callback when camera state changes */
  onStateChange?: (isActive: boolean) => void;
  /** Callback when error occurs */
  onError?: (error: CameraPreviewError | null) => void;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
}

export function CameraPreview({
  stream: externalStream,
  autoStart = true,
  onStateChange,
  onError,
  className = '',
  compact = false,
}: CameraPreviewProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use internal hook only if no external stream is provided
  const internal = useCameraPreview({ autoStart: externalStream === undefined ? autoStart : false });

  // Determine which stream/state to use
  const stream = externalStream !== undefined ? externalStream : internal.stream;
  const isActive = externalStream !== undefined ? !!externalStream : internal.isActive;
  const isStarting = externalStream !== undefined ? false : internal.isStarting;
  const error = externalStream !== undefined ? null : internal.error;
  const errorMessage = externalStream !== undefined ? null : internal.errorMessage;
  const toggle = internal.toggle;
  const isExternalMode = externalStream !== undefined;

  // Attach stream to video element and explicitly call play() for Safari
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      // Explicit play for Safari/iOS reliability
      video.play().catch(() => {
        // Autoplay blocked - user interaction may be required
      });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(isActive);
  }, [isActive, onStateChange]);

  // Notify parent of errors
  useEffect(() => {
    onError?.(error);
  }, [error, onError]);

  // Handle toggle click
  const handleToggle = async () => {
    await toggle();
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Video className="w-4 h-4 text-purple-600" />
          ) : (
            <VideoOff className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {t('interview.camera.title', 'Camera Preview')}
          </span>
        </div>

        {/* Toggle button - only shown when not using external stream */}
        {!isExternalMode && (
          <button
            onClick={handleToggle}
            disabled={isStarting}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isStarting
              ? t('interview.camera.starting', 'Starting...')
              : isActive
              ? t('interview.camera.turnOff', 'Turn Off')
              : t('interview.camera.turnOn', 'Turn On')}
          </button>
        )}
      </div>

      {/* Video preview area */}
      <div className={`relative bg-gray-900 ${compact ? 'aspect-[4/3]' : 'aspect-video'}`}>
        {/* Video element - always rendered for smooth transitions */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isActive && stream ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Inactive/Error overlay */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
            {error ? (
              <>
                <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-sm text-gray-300 text-center px-4">
                  {errorMessage}
                </p>
                {error === 'permission-denied' && (
                  <p className="text-xs text-gray-500 mt-2 text-center px-4">
                    {t('interview.camera.permissionHint', 'Check browser settings to allow camera access')}
                  </p>
                )}
              </>
            ) : isStarting ? (
              <>
                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm text-gray-400">
                  {t('interview.camera.starting', 'Starting...')}
                </p>
              </>
            ) : (
              <>
                <VideoOff className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-sm text-gray-400">
                  {t('interview.camera.off', 'Camera is off')}
                </p>
              </>
            )}
          </div>
        )}

        {/* Status indicator when active */}
        {isActive && stream && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white font-medium">
              {t('interview.camera.live', 'LIVE')}
            </span>
          </div>
        )}
      </div>

      {/* Info text */}
      {!compact && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {error
              ? t('interview.camera.errorNote', 'Interview can continue without camera')
              : t('interview.camera.note', 'Your video is being recorded')}
          </p>
        </div>
      )}
    </div>
  );
}

export default CameraPreview;

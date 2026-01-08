/**
 * InterviewMediaCapture Component
 * 
 * Manages video/audio recording during interviews.
 * Integrates with useMediaCapture hook for recording lifecycle.
 * 
 * @module components/interview-media-capture
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Video, VideoOff, Mic, Circle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMediaCapture, CaptureStatus } from 'hooks/use-media-capture';
import { cn } from 'lib/utils';

// ============================================
// TYPES
// ============================================

export interface RecordingMetadata {
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  durationMs: number;
}

export interface InterviewMediaCaptureProps {
  /** Whether recording is enabled */
  enabled: boolean;
  /** Whether video should be captured (vs audio-only) */
  videoEnabled?: boolean;
  /** Whether audio should be captured */
  audioEnabled?: boolean;
  /** Called when recording status changes */
  onStatusChange?: (status: CaptureStatus) => void;
  /** Called when recording is finalized with blob data */
  onFinalized?: (metadata: RecordingMetadata) => void;
  /** Called when the media stream changes (for sharing with preview) */
  onStreamChange?: (stream: MediaStream | null) => void;
  /** External trigger to start recording */
  shouldStartRecording?: boolean;
  /** External trigger to stop recording */
  shouldStopRecording?: boolean;
  /** Show camera preview */
  showPreview?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** CSS class name */
  className?: string;
}

// ============================================
// HELPER COMPONENTS
// ============================================

const RecordingTimer: React.FC<{ durationMs: number; isActive: boolean }> = ({ 
  durationMs, 
  isActive 
}) => {
  const [elapsed, setElapsed] = useState(durationMs);

  useEffect(() => {
    if (!isActive) {
      setElapsed(durationMs);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(prev => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, durationMs]);

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  return (
    <span className="font-mono tabular-nums">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
};

const StatusBadge: React.FC<{ status: CaptureStatus; error: string | null }> = ({ 
  status, 
  error 
}) => {
  const { t } = useTranslation();

  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return { 
          label: t('interview.recording.status.idle', 'Not recording'), 
          color: 'bg-gray-100 text-gray-600',
          icon: null 
        };
      case 'requesting':
        return { 
          label: t('interview.recording.status.requesting', 'Requesting...'), 
          color: 'bg-yellow-100 text-yellow-700',
          icon: null 
        };
      case 'ready':
        return { 
          label: t('interview.recording.status.ready', 'Ready'), 
          color: 'bg-blue-100 text-blue-700',
          icon: <CheckCircle2 className="w-3 h-3" /> 
        };
      case 'recording':
        return { 
          label: t('interview.recording.status.recording', 'Recording'), 
          color: 'bg-red-100 text-red-700',
          icon: <Circle className="w-3 h-3 fill-current animate-pulse" /> 
        };
      case 'stopping':
        return { 
          label: t('interview.recording.status.stopping', 'Stopping...'), 
          color: 'bg-orange-100 text-orange-700',
          icon: null 
        };
      case 'finalized':
        return { 
          label: t('interview.recording.status.saved', 'Saved'), 
          color: 'bg-green-100 text-green-700',
          icon: <CheckCircle2 className="w-3 h-3" /> 
        };
      case 'error':
        return { 
          label: error || t('interview.recording.status.error', 'Error'), 
          color: 'bg-red-100 text-red-700',
          icon: <AlertCircle className="w-3 h-3" /> 
        };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-600', icon: null };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      config.color
    )}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const InterviewMediaCapture: React.FC<InterviewMediaCaptureProps> = ({
  enabled,
  videoEnabled = true,
  audioEnabled = false,
  onStatusChange,
  onFinalized,
  onStreamChange,
  shouldStartRecording = false,
  shouldStopRecording = false,
  showPreview = false,
  compact = false,
  className,
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasStartedRef = useRef(false);
  const hasStoppedRef = useRef(false);

  const {
    status,
    error,
    mediaStream,
    blob,
    mimeType,
    sizeBytes,
    durationMs,
    isRecordingSupported,
    requestPermissions,
    startCapture,
    stopCapture,
  } = useMediaCapture({ videoEnabled, audioEnabled });

  // Notify parent of status changes
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // Notify parent when media stream changes (for sharing with preview)
  useEffect(() => {
    onStreamChange?.(mediaStream);
  }, [mediaStream, onStreamChange]);

  // Notify parent when recording is finalized
  useEffect(() => {
    if (status === 'finalized' && blob && mimeType) {
      onFinalized?.({
        blob,
        mimeType,
        sizeBytes,
        durationMs,
      });
    }
  }, [status, blob, mimeType, sizeBytes, durationMs, onFinalized]);

  // Set video preview source
  useEffect(() => {
    if (videoRef.current && mediaStream && showPreview) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, showPreview]);

  // Request permissions when enabled
  useEffect(() => {
    if (enabled && status === 'idle' && isRecordingSupported) {
      requestPermissions();
    }
  }, [enabled, status, isRecordingSupported, requestPermissions]);

  // Handle external start trigger
  useEffect(() => {
    if (shouldStartRecording && status === 'ready' && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startCapture();
    }
  }, [shouldStartRecording, status, startCapture]);

  // Handle external stop trigger
  useEffect(() => {
    if (shouldStopRecording && status === 'recording' && !hasStoppedRef.current) {
      hasStoppedRef.current = true;
      stopCapture();
    }
  }, [shouldStopRecording, status, stopCapture]);

  // Reset refs when status changes back to ready
  useEffect(() => {
    if (status === 'ready') {
      hasStartedRef.current = false;
      hasStoppedRef.current = false;
    }
  }, [status]);

  // Don't render if recording not supported
  if (!isRecordingSupported) {
    return (
      <div className={cn('text-sm text-gray-500', className)}>
        <div className="flex items-center gap-2">
          <VideoOff className="w-4 h-4" />
          <span>{t('interview.recording.notSupported', 'Recording not supported')}</span>
        </div>
      </div>
    );
  }

  // Don't render if not enabled
  if (!enabled) {
    return null;
  }

  return (
    <div className={cn(
      'rounded-xl border border-gray-200 bg-white overflow-hidden',
      compact ? 'p-3' : 'p-4',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {videoEnabled ? (
            <Video className="w-4 h-4 text-purple-600" />
          ) : (
            <Mic className="w-4 h-4 text-purple-600" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {videoEnabled 
              ? t('interview.recording.title', 'Recording') 
              : t('interview.recording.audioOnly', 'Audio Recording')}
          </span>
        </div>
        <StatusBadge status={status} error={error} />
      </div>

      {/* Video Preview */}
      {showPreview && videoEnabled && mediaStream && (
        <div className="relative mb-3 rounded-lg overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {status === 'recording' && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
              <Circle className="w-2 h-2 fill-current animate-pulse" />
              <span>REC</span>
            </div>
          )}
        </div>
      )}

      {/* Recording Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3 text-gray-600">
          {status === 'recording' && (
            <div className="flex items-center gap-1.5">
              <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" />
              <RecordingTimer durationMs={0} isActive={true} />
            </div>
          )}
          {status === 'finalized' && (
            <span className="text-gray-500">
              {Math.round(durationMs / 1000)}s / {(sizeBytes / (1024 * 1024)).toFixed(1)}MB
            </span>
          )}
        </div>

        {/* Retention notice */}
        {(status === 'ready' || status === 'recording') && (
          <span className="text-xs text-gray-400">
            {t('interview.recording.retention', 'Stored for 30 days')}
          </span>
        )}
      </div>

      {/* Error message */}
      {error && status === 'error' && (
        <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewMediaCapture;

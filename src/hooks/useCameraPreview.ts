/**
 * useCameraPreview Hook
 * 
 * Manages camera-only video preview for the interview page.
 * This hook provides a video stream for preview purposes without audio
 * to avoid conflicts with the Retell call audio.
 * 
 * Features:
 * - Video-only stream (audio: false)
 * - Toggle on/off without breaking the interview call
 * - Graceful error handling for permission denied / no camera
 * - Automatic cleanup on unmount
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export type CameraPreviewError = 
  | 'permission-denied'
  | 'no-camera'
  | 'not-supported'
  | 'unknown';

export interface UseCameraPreviewOptions {
  /** Whether to start the preview automatically on mount */
  autoStart?: boolean;
  /** Video constraints (default: { facingMode: 'user' }) */
  videoConstraints?: MediaTrackConstraints;
}

export interface UseCameraPreviewReturn {
  /** The camera MediaStream, null if not active */
  stream: MediaStream | null;
  /** Whether the camera preview is currently active */
  isActive: boolean;
  /** Whether the camera is currently starting */
  isStarting: boolean;
  /** Error state with specific error type */
  error: CameraPreviewError | null;
  /** Human-readable error message */
  errorMessage: string | null;
  /** Start the camera preview */
  start: () => Promise<boolean>;
  /** Stop the camera preview */
  stop: () => void;
  /** Toggle the camera preview on/off */
  toggle: () => Promise<boolean>;
}

/**
 * Get human-readable error message for camera preview errors
 */
function getErrorMessage(error: CameraPreviewError): string {
  switch (error) {
    case 'permission-denied':
      return 'Camera permission not granted';
    case 'no-camera':
      return 'No camera detected';
    case 'not-supported':
      return 'Camera not supported in this browser';
    case 'unknown':
    default:
      return 'Unable to access camera';
  }
}

/**
 * Parse MediaDevices error into specific error type
 */
function parseError(err: unknown): CameraPreviewError {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'permission-denied';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'no-camera';
      case 'NotSupportedError':
        return 'not-supported';
      default:
        return 'unknown';
    }
  }
  return 'unknown';
}

export function useCameraPreview(options: UseCameraPreviewOptions = {}): UseCameraPreviewReturn {
  const { autoStart = false, videoConstraints = { facingMode: 'user' } } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<CameraPreviewError | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Store stream ref for cleanup
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Stop all tracks and clean up the stream
   */
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  /**
   * Stop the camera preview
   */
  const stop = useCallback(() => {
    stopTracks();
    if (isMountedRef.current) {
      setStream(null);
      setIsActive(false);
      setError(null);
    }
  }, [stopTracks]);

  /**
   * Start the camera preview
   */
  const start = useCallback(async (): Promise<boolean> => {
    // Check browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      if (isMountedRef.current) {
        setError('not-supported');
        setIsActive(false);
      }
      return false;
    }

    // Stop existing stream if any
    stopTracks();

    if (isMountedRef.current) {
      setIsStarting(true);
      setError(null);
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false, // Never request audio - handled by Retell call
      });

      if (!isMountedRef.current) {
        // Component unmounted during async operation
        mediaStream.getTracks().forEach(track => track.stop());
        return false;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
      setIsStarting(false);
      return true;
    } catch (err) {
      console.error('[useCameraPreview] Failed to start camera:', err);
      
      if (isMountedRef.current) {
        const errorType = parseError(err);
        setError(errorType);
        setIsActive(false);
        setIsStarting(false);
      }
      return false;
    }
  }, [videoConstraints, stopTracks]);

  /**
   * Toggle camera preview on/off
   */
  const toggle = useCallback(async (): Promise<boolean> => {
    if (isActive) {
      stop();
      return false;
    } else {
      return start();
    }
  }, [isActive, start, stop]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart, start]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      stopTracks();
    };
  }, [stopTracks]);

  return {
    stream,
    isActive,
    isStarting,
    error,
    errorMessage: error ? getErrorMessage(error) : null,
    start,
    stop,
    toggle,
  };
}

export default useCameraPreview;

/**
 * useMediaCapture Hook
 * 
 * Handles browser audio/video capture using MediaRecorder API.
 * Negotiates mime types for cross-browser compatibility.
 * 
 * @module hooks/use-media-capture
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// ============================================
// TYPES
// ============================================

export type CaptureStatus = 
  | 'idle'           // Initial state, no stream
  | 'requesting'     // Requesting permissions
  | 'ready'          // Stream acquired, ready to record
  | 'recording'      // Recording in progress
  | 'stopping'       // Stopping recording
  | 'finalized'      // Recording complete, blob ready
  | 'error';         // Error occurred

export interface MediaCaptureOptions {
  videoEnabled?: boolean;
  audioEnabled?: boolean;
}

export interface UseMediaCaptureResult {
  status: CaptureStatus;
  error: string | null;
  mediaStream: MediaStream | null;
  blob: Blob | null;
  mimeType: string | null;
  sizeBytes: number;
  durationMs: number;
  isRecordingSupported: boolean;
  
  requestPermissions: () => Promise<boolean>;
  startCapture: () => void;
  stopCapture: () => Promise<Blob | null>;
  reset: () => void;
}

// ============================================
// MIME TYPE NEGOTIATION
// ============================================

const VIDEO_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

const AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

function getSupportedMimeType(preferVideo: boolean): string | null {
  if (typeof MediaRecorder === 'undefined') {
    return null;
  }

  // Try video types first if video is preferred
  if (preferVideo) {
    for (const type of VIDEO_MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
  }

  // Fall back to audio-only
  for (const type of AUDIO_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return null;
}

function isMediaRecorderSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && 
         typeof navigator.mediaDevices?.getUserMedia === 'function';
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useMediaCapture(options: MediaCaptureOptions = {}): UseMediaCaptureResult {
  const { videoEnabled = true, audioEnabled = true } = options;

  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [sizeBytes, setSizeBytes] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const stopResolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  // Check if recording is supported
  const isRecordingSupported = isMediaRecorderSupported();

  /**
   * Request camera/microphone permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isRecordingSupported) {
      setError('MediaRecorder is not supported in this browser');
      setStatus('error');
      return false;
    }

    setStatus('requesting');
    setError(null);

    try {
      // Determine what to request
      const constraints: MediaStreamConstraints = {};
      
      if (audioEnabled) {
        constraints.audio = true;
      }
      
      if (videoEnabled) {
        constraints.video = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        };
      }

      // If neither is enabled, we can't record
      if (!constraints.audio && !constraints.video) {
        setError('At least audio or video must be enabled');
        setStatus('error');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);

      // Determine supported mime type
      const hasVideo = stream.getVideoTracks().length > 0;
      const supportedMime = getSupportedMimeType(hasVideo);
      
      if (!supportedMime) {
        // Close stream if we can't record
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setError('No supported recording format found');
        setStatus('error');
        return false;
      }

      setMimeType(supportedMime);
      setStatus('ready');
      return true;
    } catch (err: any) {
      console.error('[useMediaCapture] Permission error:', err);
      
      let errorMessage = 'Failed to access camera/microphone';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone permission denied';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone is in use by another application';
      }

      setError(errorMessage);
      setStatus('error');
      return false;
    }
  }, [audioEnabled, videoEnabled, isRecordingSupported]);

  /**
   * Start recording
   */
  const startCapture = useCallback(() => {
    if (!mediaStream || !mimeType) {
      console.warn('[useMediaCapture] Cannot start capture: no stream or mime type');
      return;
    }

    if (status !== 'ready' && status !== 'finalized') {
      console.warn('[useMediaCapture] Cannot start capture from status:', status);
      return;
    }

    try {
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      const recorder = new MediaRecorder(mediaStream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000,  // 128 kbps
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const duration = Date.now() - startTimeRef.current;
        setDurationMs(duration);

        const recordedBlob = new Blob(chunksRef.current, { type: mimeType });
        setSizeBytes(recordedBlob.size);
        setBlob(recordedBlob);
        setStatus('finalized');

        // Resolve the stop promise if waiting
        if (stopResolveRef.current) {
          stopResolveRef.current(recordedBlob);
          stopResolveRef.current = null;
        }
      };

      recorder.onerror = (event: any) => {
        console.error('[useMediaCapture] Recording error:', event);
        setError('Recording failed');
        setStatus('error');
        
        if (stopResolveRef.current) {
          stopResolveRef.current(null);
          stopResolveRef.current = null;
        }
      };

      // Start recording with 1-second chunks
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setStatus('recording');

      console.log('[useMediaCapture] Recording started', { mimeType });
    } catch (err: any) {
      console.error('[useMediaCapture] Failed to start recording:', err);
      setError(err.message || 'Failed to start recording');
      setStatus('error');
    }
  }, [mediaStream, mimeType, status]);

  /**
   * Stop recording and return the blob
   */
  const stopCapture = useCallback(async (): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current;
    
    if (!recorder || recorder.state === 'inactive') {
      return blob;
    }

    setStatus('stopping');

    return new Promise((resolve) => {
      stopResolveRef.current = resolve;
      recorder.stop();
    });
  }, [blob]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    // Stop any active recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Stop all tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }

    // Reset state
    setMediaStream(null);
    setBlob(null);
    setMimeType(null);
    setSizeBytes(0);
    setDurationMs(0);
    setError(null);
    setStatus('idle');
    chunksRef.current = [];
    startTimeRef.current = 0;
  }, [mediaStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  return {
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
    reset,
  };
}

export default useMediaCapture;

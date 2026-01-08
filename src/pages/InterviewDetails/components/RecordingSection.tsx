'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Video, Download, Play, Pause, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';
import apiService from 'services/APIService';

interface MediaInfo {
  id: string;
  status: 'UPLOADING' | 'AVAILABLE' | 'FAILED';
  mimeType: string;
  sizeBytes: number;
  durationSec: number | null;
  downloadUrl?: string;
  createdAt: string;
}

interface RecordingSectionProps {
  interviewId: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Format duration from seconds to mm:ss
const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function RecordingSection({ interviewId }: RecordingSectionProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // Fetch media info
  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const mediaInfo = await apiService.getInterviewMedia(interviewId);
      setMedia(mediaInfo);
    } catch (err: any) {
      console.error('Failed to fetch media info:', err);
      setError(err.message || 'Failed to load recording');
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Get the active media element (video or audio)
  const getMediaElement = (): HTMLVideoElement | HTMLAudioElement | null => {
    if (media?.mimeType.startsWith('video/')) {
      return videoRef.current;
    }
    return audioRef.current;
  };

  // Handle play/pause
  const togglePlay = () => {
    const el = getMediaElement();
    if (!el) return;

    if (isPlaying) {
      el.pause();
    } else {
      el.play();
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    const el = getMediaElement();
    if (el) {
      setCurrentTime(el.currentTime);
    }
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    const el = getMediaElement();
    if (el) {
      setDuration(el.duration);
    }
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = getMediaElement();
    const time = parseFloat(e.target.value);
    if (el) {
      el.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!media) return;

    try {
      setDownloading(true);
      const downloadUrl = await apiService.getMediaDownloadUrl(interviewId);

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `interview-recording-${interviewId.slice(0, 8)}.${media.mimeType.includes('video') ? 'webm' : 'webm'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Failed to download recording:', err);
      setError(err.message || 'Failed to download');
    } finally {
      setDownloading(false);
    }
  };

  // No recording available
  if (!loading && !media) {
    return null; // Don't show section if no recording
  }

  // Loading state
  if (loading) {
    return (
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Video className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">
            {t('interviewDetails.recording.title', 'Recording')}
          </h2>
        </div>
        <div className="p-6 bg-white border border-zinc-200 rounded-xl">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Video className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">
            {t('interviewDetails.recording.title', 'Recording')}
          </h2>
        </div>
        <div className="p-6 bg-white border border-zinc-200 rounded-xl">
          <div className="text-center py-6">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-zinc-600 mb-3">{error}</p>
            <button
              onClick={fetchMedia}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('interviewDetails.recording.retry', 'Retry')}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Media still uploading
  if (media?.status === 'UPLOADING') {
    return (
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Video className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">
            {t('interviewDetails.recording.title', 'Recording')}
          </h2>
        </div>
        <div className="p-6 bg-white border border-zinc-200 rounded-xl">
          <div className="flex items-center justify-center gap-3 py-6">
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-zinc-600">
              {t('interviewDetails.recording.processing', 'Processing recording...')}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Media upload failed
  if (media?.status === 'FAILED') {
    return (
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Video className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">
            {t('interviewDetails.recording.title', 'Recording')}
          </h2>
        </div>
        <div className="p-6 bg-white border border-zinc-200 rounded-xl">
          <div className="text-center py-6">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-zinc-600 mb-2">
              {t('interviewDetails.recording.uploadFailed', 'Recording upload failed')}
            </p>
            <p className="text-zinc-500 text-sm mb-4">
              {t('interviewDetails.recording.uploadFailedHint', 'The recording could not be saved. Please contact support if this issue persists.')}
            </p>
            <button
              onClick={fetchMedia}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('interviewDetails.recording.checkStatus', 'Check Status')}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Available recording
  const isVideo = media?.mimeType.startsWith('video/');

  return (
    <motion.div variants={itemVariants}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">
            {t('interviewDetails.recording.title', 'Recording')}
          </h2>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? t('interviewDetails.recording.downloading', 'Downloading...') : t('interviewDetails.recording.download', 'Download')}
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {/* Video/Audio Player */}
        {isVideo ? (
          <div className="relative bg-zinc-900 aspect-video">
            <video
              ref={videoRef}
              src={media.downloadUrl}
              className="w-full h-full"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              playsInline
            />
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 py-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-purple-200 flex items-center justify-center">
                <Volume2 className="w-10 h-10 text-purple-600" />
              </div>
              <audio
                ref={audioRef}
                src={media.downloadUrl}
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            {/* Time */}
            <span className="text-sm font-mono text-zinc-600 w-20">
              {formatDuration(currentTime)} / {formatDuration(duration || media.durationSec || 0)}
            </span>

            {/* Progress bar */}
            <input
              type="range"
              min={0}
              max={duration || media.durationSec || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-zinc-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600"
            />
          </div>

          {/* Info row */}
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            <span>{isVideo ? 'Video' : 'Audio'}</span>
            <span>•</span>
            <span>{formatFileSize(media.sizeBytes)}</span>
            {media.durationSec && (
              <>
                <span>•</span>
                <span>{formatDuration(media.durationSec)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default RecordingSection;

import { useEffect, useRef, useState } from 'react';
import { Button, Slider, Space, Typography } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CloseOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import Hls from 'hls.js';
import './MiniPlayer.css';

const { Text } = Typography;

const CDN_URL = import.meta.env.VITE_CDN_URL || 'http://localhost:8080';

interface MiniPlayerProps {
  audioUrl: string;
  title: string;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function MiniPlayer({ audioUrl, title, onClose }: MiniPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const fullUrl = `${CDN_URL}/${audioUrl}`;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(fullUrl);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audio.play().then(() => setIsPlaying(true)).catch((error: Error) => {
          console.error('Failed to play audio:', error.message);
        });
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS error:', data);
        }
      });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      audio.src = fullUrl;
      audio.addEventListener('loadedmetadata', () => {
        audio.play().then(() => setIsPlaying(true)).catch((error: Error) => {
          console.error('Failed to play audio:', error.message);
        });
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((error: Error) => {
        console.error('Failed to play audio:', error.message);
      });
    }
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value;
    setVolume(value);
  };

  const handleClose = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    onClose();
  };

  return (
    <div className="mini-player">
      <audio ref={audioRef} />

      <div className="player-content">
        <div className="player-info">
          <Text strong ellipsis className="player-title">{title}</Text>
          <Text type="secondary" className="player-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </div>

        <div className="player-controls">
          <Button
            type="text"
            size="large"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={togglePlay}
            className="play-button"
          />

          <Slider
            className="progress-slider"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            tooltip={{ formatter: (value) => formatTime(value || 0) }}
          />

          <Space className="volume-control">
            <SoundOutlined />
            <Slider
              className="volume-slider"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={handleVolumeChange}
              tooltip={{ formatter: (value) => `${Math.round((value || 0) * 100)}%` }}
            />
          </Space>

          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={handleClose}
            className="close-button"
          />
        </div>
      </div>
    </div>
  );
}

export default MiniPlayer;

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface VoiceMessageProps {
  voiceUrl: string;
  duration: number;
  isSender: boolean;
}

export default function VoiceMessage({ voiceUrl, duration, isSender }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${isSender ? 'bg-primary' : 'bg-muted'}`}>
      <Button
        size="sm"
        variant="ghost"
        onClick={togglePlay}
        className={isSender ? 'text-primary-foreground hover:bg-primary-foreground/20' : ''}
      >
        {isPlaying ? <Icon name="Pause" size={20} /> : <Icon name="Play" size={20} />}
      </Button>

      <div className="flex-1">
        <div className="h-1 bg-background/30 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${isSender ? 'bg-primary-foreground' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <span className={`text-xs ${isSender ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
        {formatTime(isPlaying ? currentTime : duration)}
      </span>

      <audio ref={audioRef} src={voiceUrl} />
    </div>
  );
}

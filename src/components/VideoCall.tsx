import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  isInitiator: boolean;
}

export default function VideoCall({ isOpen, onClose, recipientName, isInitiator }: VideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      startCall();
    } else {
      endCall();
    }

    return () => {
      endCall();
    };
  }, [isOpen]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setTimeout(() => {
        setCallStatus('connected');
      }, 2000);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setCallStatus('ended');
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setCallStatus('ended');
    onClose();
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[600px] p-0">
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white shadow-lg"
          />

          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${callStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-white font-medium">
                {callStatus === 'connecting' && 'Соединение...'}
                {callStatus === 'connected' && recipientName}
                {callStatus === 'ended' && 'Звонок завершён'}
              </span>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
            <Button
              size="lg"
              variant={isAudioEnabled ? 'secondary' : 'destructive'}
              onClick={toggleAudio}
              className="rounded-full w-14 h-14"
            >
              <Icon name={isAudioEnabled ? 'Mic' : 'MicOff'} size={24} />
            </Button>

            <Button
              size="lg"
              variant={isVideoEnabled ? 'secondary' : 'destructive'}
              onClick={toggleVideo}
              className="rounded-full w-14 h-14"
            >
              <Icon name={isVideoEnabled ? 'Video' : 'VideoOff'} size={24} />
            </Button>

            <Button
              size="lg"
              variant="destructive"
              onClick={endCall}
              className="rounded-full w-14 h-14"
            >
              <Icon name="PhoneOff" size={24} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { API_URLS, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useProfile(currentUser: User | null, setCurrentUser: (user: User) => void, users: User[]) {
  const { toast } = useToast();
  const [showProfile, setShowProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callRecipient, setCallRecipient] = useState<User | null>(null);

  const handleViewProfile = (user: User) => {
    setProfileUser(user);
    setShowProfile(true);
  };

  const handleUpdateProfile = async (bio: string, avatarUrl: string) => {
    if (!currentUser) return;
    try {
      await fetch(API_URLS.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          user_id: currentUser.id,
          avatar_url: avatarUrl,
          bio: bio,
        }),
      });
      setCurrentUser({ ...currentUser, avatar_url: avatarUrl, bio });
      toast({ title: 'Профиль обновлён!' });
      setShowProfile(false);
    } catch (error) {
      toast({ title: 'Ошибка обновления профиля', variant: 'destructive' });
    }
  };

  const handleReport = async (reportedUserId: number) => {
    if (!currentUser) return;
    try {
      await fetch(API_URLS.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_user',
          reporter_id: currentUser.id,
          reported_user_id: reportedUserId,
          reason: 'Пользователь пожаловался через интерфейс',
        }),
      });
      
      const snosUser = users.find(u => u.username === 'Snos');
      if (snosUser) {
        await fetch(API_URLS.messages, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send',
            sender_id: currentUser.id,
            receiver_id: snosUser.id,
            content: `⚠️ Жалоба: пользователь ${currentUser.username} (ID: ${currentUser.id}) пожаловался на пользователя ID ${reportedUserId}`,
          }),
        });
      }
      
      toast({ title: 'Жалоба отправлена' });
      setShowProfile(false);
    } catch (error) {
      toast({ title: 'Ошибка отправки жалобы', variant: 'destructive' });
    }
  };

  const handleStartCall = (user: User) => {
    setCallRecipient(user);
    setShowVideoCall(true);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    try {
      const avatarUrl = await uploadFile(file);
      
      await fetch(API_URLS.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          user_id: currentUser.id,
          avatar_url: avatarUrl,
          bio: currentUser.bio,
        }),
      });
      
      setCurrentUser({ ...currentUser, avatar_url: avatarUrl });
      toast({
        title: 'Аватар обновлён!',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить аватар',
        variant: 'destructive',
      });
    }
  };

  return {
    showProfile,
    setShowProfile,
    profileUser,
    isRecordingVoice,
    setIsRecordingVoice,
    showVideoCall,
    setShowVideoCall,
    callRecipient,
    handleViewProfile,
    handleUpdateProfile,
    handleReport,
    handleStartCall,
    handleAvatarUpload
  };
}

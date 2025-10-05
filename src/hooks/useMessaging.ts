import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URLS, User, Message, GroupMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useMessaging(
  currentUser: User | null,
  selectedChat: User | null,
  selectedGroup: any | null,
  chatType: 'users' | 'groups'
) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastMessageCount = useRef(0);

  useEffect(() => {
    if (selectedChat && currentUser && chatType === 'users') {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat, currentUser, chatType]);

  useEffect(() => {
    if (selectedGroup && currentUser && chatType === 'groups') {
      loadGroupMessages();
      const interval = setInterval(loadGroupMessages, 3000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, currentUser, chatType]);

  const loadMessages = async () => {
    if (!selectedChat || !currentUser) return;
    try {
      const response = await fetch(
        `${API_URLS.messages}?user_id=${currentUser.id}&contact_id=${selectedChat.id}`
      );
      const data = await response.json();
      
      if (data.messages.length > lastMessageCount.current && lastMessageCount.current > 0) {
        playNotificationSound();
      }
      lastMessageCount.current = data.messages.length;
      
      setMessages(data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadGroupMessages = async () => {
    if (!selectedGroup || !currentUser) return;
    try {
      const response = await fetch(API_URLS.groups, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_messages',
          group_id: selectedGroup.id,
          user_id: currentUser.id,
        }),
      });
      const data = await response.json();
      
      if (data.messages.length > lastMessageCount.current && lastMessageCount.current > 0) {
        playNotificationSound();
      }
      lastMessageCount.current = data.messages.length;
      
      setGroupMessages(data.messages);
    } catch (error) {
      console.error('Error loading group messages:', error);
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.src = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';
      audioRef.current.play().catch(() => {});
    }
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    setUploadingFile(true);
    try {
      const fileUrl = await uploadFile(file);
      
      if (chatType === 'users' && selectedChat) {
        await fetch(API_URLS.messages, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send',
            sender_id: currentUser.id,
            receiver_id: selectedChat.id,
            content: file.type.startsWith('image/') ? '🖼️ Изображение' : '📎 Файл',
            file_url: fileUrl,
            file_name: file.name,
          }),
        });
        loadMessages();
      } else if (chatType === 'groups' && selectedGroup) {
        await fetch(API_URLS.groups, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_message',
            group_id: selectedGroup.id,
            sender_id: currentUser.id,
            content: file.type.startsWith('image/') ? '🖼️ Изображение' : '📎 Файл',
            file_url: fileUrl,
            file_name: file.name,
          }),
        });
        loadGroupMessages();
      }
      
      toast({
        title: 'Файл отправлен!',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить файл',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVoiceSend = async (audioBlob: Blob, duration: number) => {
    if (!currentUser) return;
    try {
      const file = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });
      const voiceUrl = await uploadFile(file);
      
      if (chatType === 'users' && selectedChat) {
        await fetch(API_URLS.messages, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send',
            sender_id: currentUser.id,
            receiver_id: selectedChat.id,
            content: '🎤 Голосовое сообщение',
            voice_url: voiceUrl,
            voice_duration: duration,
          }),
        });
        loadMessages();
      } else if (chatType === 'groups' && selectedGroup) {
        await fetch(API_URLS.groups, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_message',
            group_id: selectedGroup.id,
            sender_id: currentUser.id,
            content: '🎤 Голосовое сообщение',
            voice_url: voiceUrl,
            voice_duration: duration,
          }),
        });
        loadGroupMessages();
      }
    } catch (error) {
      toast({ title: 'Ошибка отправки голосового сообщения', variant: 'destructive' });
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !currentUser) return;
    
    try {
      if (chatType === 'users' && selectedChat) {
        await fetch(API_URLS.messages, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send',
            sender_id: currentUser.id,
            receiver_id: selectedChat.id,
            content: messageText,
          }),
        });
        setMessageText('');
        loadMessages();
      } else if (chatType === 'groups' && selectedGroup) {
        await fetch(API_URLS.groups, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_message',
            group_id: selectedGroup.id,
            sender_id: currentUser.id,
            content: messageText,
          }),
        });
        setMessageText('');
        loadGroupMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return {
    messages,
    groupMessages,
    messageText,
    setMessageText,
    uploadingFile,
    fileInputRef,
    audioRef,
    loadMessages,
    loadGroupMessages,
    sendMessage,
    handleFileSelect,
    handleVoiceSend
  };
}
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_URLS, User, Message, Group, GroupMessage } from '@/lib/types';
import AuthForm from '@/components/auth/AuthForm';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import CreateGroupModal from '@/components/chat/CreateGroupModal';
import GroupSettingsModal from '@/components/chat/GroupSettingsModal';

const Index = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [chatType, setChatType] = useState<'users' | 'groups'>('users');
  
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastMessageCount = useRef(0);
  
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [groupMembers, setGroupMembers] = useState<User[]>([]);

  const handleChatTypeChange = (newType: 'users' | 'groups') => {
    setChatType(newType);
    setSelectedChat(null);
    setSelectedGroup(null);
  };

  useEffect(() => {
    if (currentUser) {
      loadUsers();
      loadGroups();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedChat && currentUser && chatType === 'users') {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (selectedGroup && currentUser && chatType === 'groups') {
      loadGroupMessages();
      const interval = setInterval(loadGroupMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedGroup]);

  const loadUsers = async () => {
    try {
      const response = await fetch(
        `${API_URLS.users}${searchQuery ? `?search=${searchQuery}` : ''}`
      );
      const data = await response.json();
      setUsers(data.users.filter((u: User) => u.id !== currentUser?.id));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

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

  const loadGroups = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_URLS.groups}?user_id=${currentUser.id}`);
      const data = await response.json();
      setGroups(data.groups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadGroupMessages = async () => {
    if (!selectedGroup) return;
    try {
      const response = await fetch(API_URLS.groups, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_messages',
          group_id: selectedGroup.id,
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

  const createGroup = async () => {
    if (!newGroupName.trim() || !currentUser) return;
    try {
      const response = await fetch(API_URLS.groups, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: newGroupName,
          description: newGroupDesc,
          created_by: currentUser.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        const groupId = data.group.id;
        
        for (const userId of selectedUsers) {
          await fetch(API_URLS.groups, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add_member',
              group_id: groupId,
              user_id: userId,
            }),
          });
        }
        
        toast({
          title: 'Группа создана!',
          description: `Группа "${newGroupName}" с ${selectedUsers.length + 1} участниками`,
        });
        setNewGroupName('');
        setNewGroupDesc('');
        setSelectedUsers([]);
        setShowCreateGroup(false);
        loadGroups();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const loadGroupMembers = async (groupId: number) => {
    try {
      const response = await fetch(`${API_URLS.groups}?action=get_members&group_id=${groupId}`);
      const data = await response.json();
      if (data.success) {
        setGroupMembers(data.members);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const openGroupSettings = (group: Group) => {
    setEditGroupName(group.name);
    setEditGroupDesc(group.description || '');
    setShowGroupSettings(true);
    loadGroupMembers(group.id);
  };

  const updateGroup = async () => {
    if (!selectedGroup || !editGroupName.trim()) return;
    try {
      await fetch(API_URLS.groups, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          group_id: selectedGroup.id,
          name: editGroupName,
          description: editGroupDesc,
        }),
      });
      toast({
        title: 'Группа обновлена!',
      });
      setShowGroupSettings(false);
      loadGroups();
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  const removeMember = async (userId: number) => {
    if (!selectedGroup) return;
    try {
      await fetch(API_URLS.groups, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_member',
          group_id: selectedGroup.id,
          user_id: userId,
        }),
      });
      toast({
        title: 'Участник удален',
      });
      loadGroupMembers(selectedGroup.id);
    } catch (error) {
      console.error('Error removing member:', error);
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

  const handleSelectUser = (user: User) => {
    setSelectedChat(user);
    setSelectedGroup(null);
  };

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setSelectedChat(null);
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!currentUser) {
    return <AuthForm onAuthSuccess={setCurrentUser} />;
  }

  return (
    <div className="h-screen flex bg-background">
      <Sidebar
        currentUser={currentUser}
        chatType={chatType}
        onChatTypeChange={handleChatTypeChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={loadUsers}
        users={users}
        groups={groups}
        selectedChat={selectedChat}
        selectedGroup={selectedGroup}
        onSelectUser={handleSelectUser}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={() => setShowCreateGroup(true)}
        onAvatarUpload={handleAvatarUpload}
      />

      <div className="flex-1 flex flex-col">
        <ChatWindow
          currentUser={currentUser}
          chatType={chatType}
          selectedChat={selectedChat}
          selectedGroup={selectedGroup}
          messages={messages}
          groupMessages={groupMessages}
          messageText={messageText}
          onMessageChange={setMessageText}
          onSendMessage={sendMessage}
          onFileSelect={() => fileInputRef.current?.click()}
          uploadingFile={uploadingFile}
          onOpenGroupSettings={openGroupSettings}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.gif"
        className="hidden"
        onChange={handleFileSelect}
      />

      <audio ref={audioRef} />

      <CreateGroupModal
        show={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        newGroupName={newGroupName}
        onGroupNameChange={setNewGroupName}
        newGroupDesc={newGroupDesc}
        onGroupDescChange={setNewGroupDesc}
        users={users}
        selectedUsers={selectedUsers}
        onToggleUser={toggleUserSelection}
        onCreateGroup={createGroup}
      />

      <GroupSettingsModal
        show={showGroupSettings}
        onClose={() => setShowGroupSettings(false)}
        selectedGroup={selectedGroup}
        editGroupName={editGroupName}
        onGroupNameChange={setEditGroupName}
        editGroupDesc={editGroupDesc}
        onGroupDescChange={setEditGroupDesc}
        groupMembers={groupMembers}
        currentUserId={currentUser?.id}
        onRemoveMember={removeMember}
        onUpdateGroup={updateGroup}
      />
    </div>
  );
};

export default Index;
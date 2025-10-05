import { useState } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import CreateGroupModal from '@/components/chat/CreateGroupModal';
import GroupSettingsModal from '@/components/chat/GroupSettingsModal';
import UserProfile from '@/components/UserProfile';
import VoiceRecorder from '@/components/VoiceRecorder';
import VideoCall from '@/components/VideoCall';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { useMessaging } from '@/hooks/useMessaging';
import { useGroups } from '@/hooks/useGroups';
import { useProfile } from '@/hooks/useProfile';

interface IndexProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const Index = ({ theme, setTheme }: IndexProps) => {
  const [chatType, setChatType] = useState<'users' | 'groups'>('users');

  const { currentUser, setCurrentUser, handleLogout } = useAuth();

  const {
    users,
    selectedChat,
    setSelectedChat,
    searchQuery,
    setSearchQuery,
    loadUsers,
    handleSelectUser
  } = useUsers(currentUser);

  const {
    groups,
    selectedGroup,
    setSelectedGroup,
    showCreateGroup,
    setShowCreateGroup,
    newGroupName,
    setNewGroupName,
    newGroupDesc,
    setNewGroupDesc,
    selectedUsers,
    showGroupSettings,
    setShowGroupSettings,
    editGroupName,
    setEditGroupName,
    editGroupDesc,
    setEditGroupDesc,
    groupMembers,
    createGroup,
    openGroupSettings,
    updateGroup,
    removeMember,
    handleSelectGroup,
    toggleUserSelection
  } = useGroups(currentUser);

  const {
    messages,
    groupMessages,
    messageText,
    setMessageText,
    uploadingFile,
    fileInputRef,
    audioRef,
    sendMessage,
    handleFileSelect,
    handleVoiceSend
  } = useMessaging(currentUser, selectedChat, selectedGroup, chatType);

  const {
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
  } = useProfile(currentUser, setCurrentUser, users);

  const handleChatTypeChange = (newType: 'users' | 'groups') => {
    setChatType(newType);
    setSelectedChat(null);
    setSelectedGroup(null);
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
      
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewProfile(currentUser)}
        >
          <Icon name="User" size={18} />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleLogout}
        >
          <Icon name="LogOut" size={18} />
        </Button>
      </div>

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
          onViewProfile={handleViewProfile}
          onStartCall={handleStartCall}
          onStartVoiceRecord={() => setIsRecordingVoice(true)}
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

      {profileUser && (
        <UserProfile
          user={profileUser}
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          isOwnProfile={profileUser.id === currentUser.id}
          onUpdateProfile={handleUpdateProfile}
          onReport={() => handleReport(profileUser.id)}
          currentUserPremium={currentUser.is_premium}
        />
      )}

      {showVideoCall && callRecipient && (
        <VideoCall
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          recipientName={callRecipient.username}
          isInitiator={true}
        />
      )}

      {isRecordingVoice && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-96 z-50">
          <VoiceRecorder
            onSend={handleVoiceSend}
            onCancel={() => setIsRecordingVoice(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Index;

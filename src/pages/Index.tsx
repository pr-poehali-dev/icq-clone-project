import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  status: string;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

interface Group {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
  member_count: number;
}

interface GroupMessage {
  id: number;
  sender_id: number;
  content: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

const API_URLS = {
  auth: 'https://functions.poehali.dev/2a65d178-004e-4fc0-bca2-100aa5710b02',
  users: 'https://functions.poehali.dev/8e70d82c-fbb1-4fb6-ae51-95989346899d',
  messages: 'https://functions.poehali.dev/69c0a3aa-a913-4b9b-9fda-07225fd45f9b',
  groups: 'https://functions.poehali.dev/41f03a2b-d2d2-4c00-9dcc-1cf268f31388',
};

const Index = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  
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
      setGroupMessages(data.messages);
    } catch (error) {
      console.error('Error loading group messages:', error);
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
        toast({
          title: 'Группа создана!',
          description: `Группа "${newGroupName}" успешно создана`,
        });
        setNewGroupName('');
        setNewGroupDesc('');
        setShowCreateGroup(false);
        loadGroups();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleAuth = async () => {
    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          username,
          password,
          bio: isLogin ? undefined : bio,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentUser(data.user);
        toast({
          title: isLogin ? 'Добро пожаловать!' : 'Регистрация успешна!',
          description: `Привет, ${data.user.username}!`,
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
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

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-primary mb-2">AnonimMes</h1>
            <p className="text-muted-foreground">Анонимный мессенджер</p>
          </div>
          
          <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <Input
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button className="w-full" onClick={handleAuth}>
                Войти
              </Button>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <Input
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                placeholder="О себе"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <Button className="w-full" onClick={handleAuth}>
                Создать аккаунт
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={currentUser.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {currentUser.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold">{currentUser.username}</div>
              <div className="text-xs text-muted-foreground">{currentUser.bio}</div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Icon name="Circle" size={8} className="mr-1 fill-green-700" />
              Online
            </Badge>
          </div>
          
          <Tabs value={chatType} onValueChange={(v) => handleChatTypeChange(v as 'users' | 'groups')} className="mb-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">
                <Icon name="User" size={16} className="mr-2" />
                Пользователи
              </TabsTrigger>
              <TabsTrigger value="groups">
                <Icon name="Users" size={16} className="mr-2" />
                Группы
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {chatType === 'users' ? (
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="pl-9"
              />
            </div>
          ) : (
            <Button onClick={() => setShowCreateGroup(true)} className="w-full">
              <Icon name="Plus" size={16} className="mr-2" />
              Создать группу
            </Button>
          )}
        </div>
        
        <ScrollArea className="flex-1">
          {chatType === 'users' ? (
            users.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedChat(user)}
              className={`p-4 border-b cursor-pointer transition-colors hover:bg-accent/50 ${
                selectedChat?.id === user.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{user.username}</div>
                  <div className="text-sm text-muted-foreground truncate">{user.bio}</div>
                </div>
                {user.status === 'online' && (
                  <Icon name="Circle" size={8} className="text-green-500 fill-green-500" />
                )}
              </div>
            </div>
            ))
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                onClick={() => {
                  setSelectedGroup(group);
                  setSelectedChat(null);
                }}
                className={`p-4 border-b cursor-pointer transition-colors hover:bg-accent/50 ${
                  selectedGroup?.id === group.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={group.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Icon name="Users" size={20} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{group.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {group.member_count} участников
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b bg-card flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedChat.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedChat.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{selectedChat.username}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  {selectedChat.status === 'online' ? (
                    <>
                      <Icon name="Circle" size={6} className="text-green-500 fill-green-500" />
                      Онлайн
                    </>
                  ) : (
                    'Не в сети'
                  )}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-2xl px-4 py-2`}>
                        <div className="text-sm">{msg.content}</div>
                        <div className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-card">
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="shrink-0">
                  <Icon name="Paperclip" size={20} />
                </Button>
                <Input
                  placeholder="Введите сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="icon" className="shrink-0">
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : selectedGroup ? (
          <>
            <div className="p-4 border-b bg-card flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedGroup.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Icon name="Users" size={20} />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{selectedGroup.name}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedGroup.member_count} участников
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {groupMessages.map((msg) => {
                  const isOwn = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {!isOwn && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.sender_avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {msg.sender_name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-md ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-2xl px-4 py-2`}>
                        {!isOwn && <div className="text-xs font-semibold mb-1">{msg.sender_name}</div>}
                        <div className="text-sm">{msg.content}</div>
                        <div className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-card">
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="shrink-0">
                  <Icon name="Paperclip" size={20} />
                </Button>
                <Input
                  placeholder="Введите сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="icon" className="shrink-0">
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon name="MessageCircle" size={64} className="mx-auto mb-4 opacity-20" />
              <div className="text-lg">Выберите чат для начала общения</div>
            </div>
          </div>
        )}
      </div>

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-2xl font-bold mb-4">Создание группы</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Название группы</label>
                <Input
                  placeholder="Моя классная группа"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Описание</label>
                <Input
                  placeholder="О чем эта группа?"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createGroup} className="flex-1">
                  <Icon name="Check" size={16} className="mr-2" />
                  Создать
                </Button>
                <Button onClick={() => setShowCreateGroup(false)} variant="outline" className="flex-1">
                  Отмена
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;
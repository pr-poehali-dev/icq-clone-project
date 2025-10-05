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

const API_URLS = {
  auth: 'https://functions.poehali.dev/2a65d178-004e-4fc0-bca2-100aa5710b02',
  users: 'https://functions.poehali.dev/8e70d82c-fbb1-4fb6-ae51-95989346899d',
  messages: 'https://functions.poehali.dev/69c0a3aa-a913-4b9b-9fda-07225fd45f9b',
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

  useEffect(() => {
    if (currentUser) {
      loadUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedChat && currentUser) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

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
    if (!messageText.trim() || !selectedChat || !currentUser) return;
    
    try {
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
        </div>
        
        <ScrollArea className="flex-1">
          {users.map((user) => (
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
          ))}
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
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon name="MessageCircle" size={64} className="mx-auto mb-4 opacity-20" />
              <div className="text-lg">Выберите чат для начала общения</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

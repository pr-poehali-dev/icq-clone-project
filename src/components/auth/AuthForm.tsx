import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { API_URLS, User } from '@/lib/types';

interface AuthFormProps {
  onAuthSuccess: (user: User) => void;
}

const AuthForm = ({ onAuthSuccess }: AuthFormProps) => {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');

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
        onAuthSuccess(data.user);
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
};

export default AuthForm;

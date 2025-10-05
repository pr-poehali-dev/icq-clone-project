import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface User {
  id: number;
  username: string;
  avatar_url?: string;
  bio?: string;
  status?: string;
  is_premium?: number;
}

interface UserProfileProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  isOwnProfile: boolean;
  onUpdateProfile?: (bio: string, avatarUrl: string) => void;
  onReport?: () => void;
  currentUserPremium?: number;
}

export default function UserProfile({
  user,
  isOpen,
  onClose,
  isOwnProfile,
  onUpdateProfile,
  onReport,
  currentUserPremium
}: UserProfileProps) {
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');

  const handleSave = () => {
    if (onUpdateProfile) {
      onUpdateProfile(bio, avatarUrl);
    }
    setEditMode(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Профиль пользователя</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <img
              src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt={user.username}
              className="w-24 h-24 rounded-full"
            />
            {user.is_premium === 1 && (
              <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full p-1">
                <Icon name="Crown" size={16} />
              </div>
            )}
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold">{user.username}</h3>
            {user.is_premium === 1 && (
              <span className="text-sm text-yellow-500 font-semibold">⭐ Премиум подписчик</span>
            )}
          </div>

          {editMode && isOwnProfile ? (
            <div className="w-full space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">URL аватара</label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">О себе</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о себе..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  <Icon name="Check" size={16} className="mr-2" />
                  Сохранить
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">О себе:</p>
                <p className="text-sm">{bio || 'Не указано'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Статус:</p>
                <p className="text-sm">{user.status || 'offline'}</p>
              </div>

              <div className="flex gap-2 pt-2">
                {isOwnProfile && (
                  <Button onClick={() => setEditMode(true)} className="flex-1">
                    <Icon name="Edit" size={16} className="mr-2" />
                    Редактировать
                  </Button>
                )}
                {!isOwnProfile && onReport && (
                  <Button variant="destructive" onClick={onReport} className="flex-1">
                    <Icon name="Flag" size={16} className="mr-2" />
                    Пожаловаться
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

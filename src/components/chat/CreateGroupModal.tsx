import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { User } from '@/lib/types';

interface CreateGroupModalProps {
  show: boolean;
  onClose: () => void;
  newGroupName: string;
  onGroupNameChange: (name: string) => void;
  newGroupDesc: string;
  onGroupDescChange: (desc: string) => void;
  users: User[];
  selectedUsers: number[];
  onToggleUser: (userId: number) => void;
  onCreateGroup: () => void;
}

const CreateGroupModal = ({
  show,
  onClose,
  newGroupName,
  onGroupNameChange,
  newGroupDesc,
  onGroupDescChange,
  users,
  selectedUsers,
  onToggleUser,
  onCreateGroup,
}: CreateGroupModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 m-4">
        <h2 className="text-2xl font-bold mb-4">Создание группы</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Название группы</label>
            <Input
              placeholder="Моя классная группа"
              value={newGroupName}
              onChange={(e) => onGroupNameChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Описание</label>
            <Input
              placeholder="О чем эта группа?"
              value={newGroupDesc}
              onChange={(e) => onGroupDescChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Добавить участников</label>
            <ScrollArea className="h-40 border rounded-md p-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => onToggleUser(user.id)}
                  className={`p-2 rounded cursor-pointer mb-1 flex items-center gap-2 ${
                    selectedUsers.includes(user.id) ? 'bg-primary/20' : 'hover:bg-muted'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.username}</span>
                  {selectedUsers.includes(user.id) && (
                    <Icon name="Check" size={16} className="ml-auto text-primary" />
                  )}
                </div>
              ))}
            </ScrollArea>
            <div className="text-xs text-muted-foreground mt-1">
              Выбрано: {selectedUsers.length} человек
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onCreateGroup} className="flex-1">
              <Icon name="Check" size={16} className="mr-2" />
              Создать
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Отмена
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreateGroupModal;

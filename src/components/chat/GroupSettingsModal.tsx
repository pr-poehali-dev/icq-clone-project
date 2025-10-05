import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { User, Group } from '@/lib/types';

interface GroupSettingsModalProps {
  show: boolean;
  onClose: () => void;
  selectedGroup: Group | null;
  editGroupName: string;
  onGroupNameChange: (name: string) => void;
  editGroupDesc: string;
  onGroupDescChange: (desc: string) => void;
  groupMembers: User[];
  currentUserId: number | undefined;
  onRemoveMember: (userId: number) => void;
  onUpdateGroup: () => void;
}

const GroupSettingsModal = ({
  show,
  onClose,
  selectedGroup,
  editGroupName,
  onGroupNameChange,
  editGroupDesc,
  onGroupDescChange,
  groupMembers,
  currentUserId,
  onRemoveMember,
  onUpdateGroup,
}: GroupSettingsModalProps) => {
  if (!show || !selectedGroup) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Настройки группы</h3>
          <Button onClick={onClose} variant="ghost" size="icon">
            <Icon name="X" size={20} />
          </Button>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Название</label>
          <Input
            placeholder="Название группы"
            value={editGroupName}
            onChange={(e) => onGroupNameChange(e.target.value)}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Описание</label>
          <Input
            placeholder="О чем эта группа?"
            value={editGroupDesc}
            onChange={(e) => onGroupDescChange(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Участники</label>
          <ScrollArea className="h-48 border rounded-md p-2">
            {groupMembers.map((member) => (
              <div
                key={member.id}
                className="p-2 rounded mb-1 flex items-center gap-2 hover:bg-muted"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {member.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm flex-1">{member.username}</span>
                {member.id !== currentUserId && (
                  <Button
                    onClick={() => onRemoveMember(member.id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Icon name="UserMinus" size={16} className="text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>

        <div className="flex gap-2">
          <Button onClick={onUpdateGroup} className="flex-1">
            <Icon name="Check" size={16} className="mr-2" />
            Сохранить
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default GroupSettingsModal;

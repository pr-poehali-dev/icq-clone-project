import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User, Group } from '@/lib/types';

interface SidebarProps {
  currentUser: User;
  chatType: 'users' | 'groups';
  onChatTypeChange: (type: 'users' | 'groups') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  users: User[];
  groups: Group[];
  selectedChat: User | null;
  selectedGroup: Group | null;
  onSelectUser: (user: User) => void;
  onSelectGroup: (group: Group) => void;
  onCreateGroup: () => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Sidebar = ({
  currentUser,
  chatType,
  onChatTypeChange,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  users,
  groups,
  selectedChat,
  selectedGroup,
  onSelectUser,
  onSelectGroup,
  onCreateGroup,
  onAvatarUpload,
}: SidebarProps) => {
  return (
    <div className="w-80 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative group">
            <Avatar className="h-12 w-12 cursor-pointer">
              <AvatarImage src={currentUser.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {currentUser.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Icon name="Camera" size={20} className="text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarUpload}
              />
            </label>
          </div>
          <div className="flex-1">
            <div className="font-semibold">{currentUser.username}</div>
            <div className="text-xs text-muted-foreground">{currentUser.bio}</div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Icon name="Circle" size={8} className="mr-1 fill-green-700" />
            Online
          </Badge>
        </div>
        
        <Tabs value={chatType} onValueChange={(v) => onChatTypeChange(v as 'users' | 'groups')} className="mb-3">
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
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
              className="pl-9"
            />
          </div>
        ) : (
          <Button onClick={onCreateGroup} className="w-full">
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
              onClick={() => onSelectUser(user)}
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
              onClick={() => onSelectGroup(group)}
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
  );
};

export default Sidebar;

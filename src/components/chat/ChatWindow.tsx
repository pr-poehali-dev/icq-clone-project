import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { User, Group, Message, GroupMessage } from '@/lib/types';

interface ChatWindowProps {
  currentUser: User;
  chatType: 'users' | 'groups';
  selectedChat: User | null;
  selectedGroup: Group | null;
  messages: Message[];
  groupMessages: GroupMessage[];
  messageText: string;
  onMessageChange: (text: string) => void;
  onSendMessage: () => void;
  onFileSelect: () => void;
  uploadingFile: boolean;
  onOpenGroupSettings: (group: Group) => void;
}

const ChatWindow = ({
  currentUser,
  chatType,
  selectedChat,
  selectedGroup,
  messages,
  groupMessages,
  messageText,
  onMessageChange,
  onSendMessage,
  onFileSelect,
  uploadingFile,
  onOpenGroupSettings,
}: ChatWindowProps) => {
  if (!selectedChat && !selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Icon name="MessageCircle" size={64} className="mx-auto mb-4 opacity-20" />
          <div className="text-lg">Выберите чат для начала общения</div>
        </div>
      </div>
    );
  }

  if (chatType === 'users' && selectedChat) {
    return (
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
              const hasFile = msg.file_url && msg.file_name;
              const isImage = hasFile && (msg.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || msg.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
              
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-2xl px-4 py-2`}>
                    {isImage ? (
                      <img src={msg.file_url || ''} alt={msg.file_name || ''} className="rounded-lg max-w-xs mb-2" />
                    ) : hasFile ? (
                      <a href={msg.file_url || ''} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mb-2 underline">
                        <Icon name="Paperclip" size={16} />
                        {msg.file_name}
                      </a>
                    ) : null}
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
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0"
              onClick={onFileSelect}
              disabled={uploadingFile}
            >
              <Icon name={uploadingFile ? "Loader2" : "Paperclip"} size={20} className={uploadingFile ? "animate-spin" : ""} />
            </Button>
            <Input
              placeholder="Введите сообщение..."
              value={messageText}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
              className="flex-1"
            />
            <Button onClick={onSendMessage} size="icon" className="shrink-0">
              <Icon name="Send" size={20} />
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (chatType === 'groups' && selectedGroup) {
    return (
      <>
        <div className="p-4 border-b bg-card flex items-center gap-3">
          <Avatar>
            <AvatarImage src={selectedGroup.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <Icon name="Users" size={20} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold">{selectedGroup.name}</div>
            <div className="text-sm text-muted-foreground">
              {selectedGroup.member_count} участников
            </div>
          </div>
          <Button
            onClick={() => onOpenGroupSettings(selectedGroup)}
            variant="ghost"
            size="icon"
          >
            <Icon name="Settings" size={20} />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {groupMessages.map((msg) => {
              const isOwn = msg.sender_id === currentUser.id;
              const hasFile = msg.file_url && msg.file_name;
              const isImage = hasFile && (msg.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || msg.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
              
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
                    {isImage ? (
                      <img src={msg.file_url || ''} alt={msg.file_name || ''} className="rounded-lg max-w-xs mb-2" />
                    ) : hasFile ? (
                      <a href={msg.file_url || ''} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mb-2 underline">
                        <Icon name="Paperclip" size={16} />
                        {msg.file_name}
                      </a>
                    ) : null}
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
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0"
              onClick={onFileSelect}
              disabled={uploadingFile}
            >
              <Icon name={uploadingFile ? "Loader2" : "Paperclip"} size={20} className={uploadingFile ? "animate-spin" : ""} />
            </Button>
            <Input
              placeholder="Введите сообщение..."
              value={messageText}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
              className="flex-1"
            />
            <Button onClick={onSendMessage} size="icon" className="shrink-0">
              <Icon name="Send" size={20} />
            </Button>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default ChatWindow;

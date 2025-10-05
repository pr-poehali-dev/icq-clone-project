import { useState, useEffect } from 'react';
import { API_URLS, User, Group } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useGroups(currentUser: User | null) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [groupMembers, setGroupMembers] = useState<User[]>([]);

  const loadGroups = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(API_URLS.groups, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_groups',
          user_id: currentUser.id,
        }),
      });
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadGroups();
    }
  }, [currentUser]);

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
      
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setSelectedUsers([]);
      loadGroups();
      toast({
        title: 'Группа создана!',
      });
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const loadGroupMembers = async (groupId: number) => {
    try {
      const response = await fetch(API_URLS.groups, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_members',
          group_id: groupId,
        }),
      });
      const data = await response.json();
      setGroupMembers(data.members || []);
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  const openGroupSettings = (group: Group) => {
    setSelectedGroup(group);
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
      setShowGroupSettings(false);
      loadGroups();
      toast({
        title: 'Группа обновлена!',
      });
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

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return {
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
    loadGroups,
    createGroup,
    openGroupSettings,
    updateGroup,
    removeMember,
    handleSelectGroup,
    toggleUserSelection
  };
}

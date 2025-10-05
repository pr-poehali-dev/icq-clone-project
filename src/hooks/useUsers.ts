import { useState, useEffect } from 'react';
import { API_URLS, User } from '@/lib/types';

export function useUsers(currentUser: User | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(
        `${API_URLS.users}${searchQuery ? `?search=${searchQuery}` : ''}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.users) {
        setUsers(data.users.filter((u: User) => u.id !== currentUser?.id));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleSelectUser = (user: User) => {
    setSelectedChat(user);
  };

  return {
    users,
    selectedChat,
    setSelectedChat,
    searchQuery,
    setSearchQuery,
    loadUsers,
    handleSelectUser
  };
}
import { useState, useEffect } from 'react';
import { API_URLS, User } from '@/lib/types';

export function useUsers(currentUser: User | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    if (currentUser) {
      loadUsers();
    }
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

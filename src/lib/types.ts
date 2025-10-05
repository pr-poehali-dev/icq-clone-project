export interface User {
  id: number;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  status: string;
}

export interface Message {
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

export interface Group {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
  member_count: number;
}

export interface GroupMessage {
  id: number;
  sender_id: number;
  content: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

export const API_URLS = {
  auth: 'https://functions.poehali.dev/2a65d178-004e-4fc0-bca2-100aa5710b02',
  users: 'https://functions.poehali.dev/8e70d82c-fbb1-4fb6-ae51-95989346899d',
  messages: 'https://functions.poehali.dev/69c0a3aa-a913-4b9b-9fda-07225fd45f9b',
  groups: 'https://functions.poehali.dev/41f03a2b-d2d2-4c00-9dcc-1cf268f31388',
};

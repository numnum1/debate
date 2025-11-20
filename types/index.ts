export interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
}

export interface Debate {
  id: string;
  title: string;
  description: string;
  createdBy: User;
  participants: User[];
  createdAt: Date;
  status: 'active' | 'completed' | 'pending';
  messages: DebateMessage[];
}

export interface DebateMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  stance: 'pro' | 'contra' | 'neutral';
}


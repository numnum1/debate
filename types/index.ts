export interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
}

export interface Position {
  id: string;
  name: string;
  color: string;
  participants: User[];
}

export interface Debate {
  id: string;
  title: string;
  description: string;
  createdBy: User;
  positions: Position[];
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
  positionId?: string;
}


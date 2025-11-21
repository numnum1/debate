export interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
}

export interface Slot {
  id: string;
  type: 'open' | 'invited' | 'ai';
  participant?: User; // Set when type is 'invited' and user has joined, or for 'ai'
  aiConfig?: {
    model: string;
    personality?: string;
  };
}

export interface Position {
  id: string;
  name: string;
  description: string;
  color: string;
  slots: Slot[];
}

export interface Debate {
  id: string;
  title: string;
  description: string;
  createdBy: User;
  positions: Position[];
  createdAt: Date | string; // Can be string when coming from API/WebSocket
  status: 'active' | 'completed' | 'pending';
  messages: DebateMessage[];
}

export interface DebateMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date | string; // Can be string when coming from API/WebSocket
  positionId?: string;
  slotId?: string;
}


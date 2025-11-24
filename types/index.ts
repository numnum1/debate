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
  status: 'active' | 'completed' | 'pending' | 'archived';
  isPublic: boolean; // true = public, false = private
  messages: DebateMessage[];
  tags?: string[];
  moderators?: User[]; // Moderatoren der Debatte (dürfen keine Position vertreten)
}

export interface DebateMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date | string; // Can be string when coming from API/WebSocket
  positionId?: string; // Null if message is from moderator
  slotId?: string;     // Null if message is from moderator
  isModerator?: boolean; // True if message is from moderator
}

export interface AiModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  available: boolean;
}


import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Debate, User } from '../types';
import { useAuth } from './AuthContext';

interface DebateContextType {
  debates: Debate[];
  currentDebate: Debate | null;
  currentUser: User;
  setCurrentDebate: (debate: Debate | null) => void;
  addDebate: (debate: Debate) => void;
  inviteUserToDebate: (debateId: string, user: User) => void;
  addMessageToDebate: (debateId: string, message: any) => void;
}

const DebateContext = createContext<DebateContextType | undefined>(undefined);

export function DebateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [debates, setDebates] = useState<Debate[]>([]);
  const [currentDebate, setCurrentDebate] = useState<Debate | null>(null);
  
  // Update debates when user changes
  React.useEffect(() => {
    if (user) {
      // Mock debates - mit dynamischem User
      const mockDebates: Debate[] = [
        {
          id: '1',
          title: 'Künstliche Intelligenz in der Bildung',
          description: 'Sollte KI stärker in Schulen eingesetzt werden?',
          createdBy: user,
          participants: [
            user,
            { id: '2', name: 'Anna Schmidt', email: 'anna@example.com' },
          ],
          createdAt: new Date('2024-11-18'),
          status: 'active',
          messages: [
            {
              id: '1',
              userId: user.id,
              userName: user.name,
              text: 'KI kann personalisiertes Lernen ermöglichen und Lehrer entlasten.',
              timestamp: new Date('2024-11-18T10:00:00'),
              stance: 'pro',
            },
            {
              id: '2',
              userId: '2',
              userName: 'Anna Schmidt',
              text: 'Aber es besteht die Gefahr, dass soziale Kompetenzen vernachlässigt werden.',
              timestamp: new Date('2024-11-18T10:15:00'),
              stance: 'contra',
            },
          ],
        },
        {
          id: '2',
          title: 'Homeoffice vs. Büro',
          description: 'Was ist produktiver für moderne Teams?',
          createdBy: { id: '2', name: 'Anna Schmidt', email: 'anna@example.com' },
          participants: [
            user,
            { id: '2', name: 'Anna Schmidt', email: 'anna@example.com' },
            { id: '3', name: 'Peter Müller', email: 'peter@example.com' },
          ],
          createdAt: new Date('2024-11-19'),
          status: 'active',
          messages: [],
        },
        {
          id: '3',
          title: 'Elektroautos: Die Zukunft?',
          description: 'Sind Elektroautos wirklich umweltfreundlicher?',
          createdBy: user,
          participants: [user],
          createdAt: new Date('2024-11-20'),
          status: 'pending',
          messages: [],
        },
      ];
      
      setDebates(mockDebates);
      setCurrentDebate(mockDebates[0] || null);
    } else {
      setDebates([]);
      setCurrentDebate(null);
    }
  }, [user]);
  
  if (!user) {
    throw new Error('DebateProvider requires authenticated user');
  }

  const currentUser = user;

  const addDebate = (debate: Debate) => {
    setDebates([debate, ...debates]);
  };

  const inviteUserToDebate = (debateId: string, user: User) => {
    setDebates(debates.map(debate => 
      debate.id === debateId 
        ? { ...debate, participants: [...debate.participants, user] }
        : debate
    ));
  };

  const addMessageToDebate = (debateId: string, message: any) => {
    setDebates(debates.map(debate => 
      debate.id === debateId 
        ? { ...debate, messages: [...debate.messages, message] }
        : debate
    ));
  };

  return (
    <DebateContext.Provider
      value={{
        debates,
        currentDebate,
        currentUser,
        setCurrentDebate,
        addDebate,
        inviteUserToDebate,
        addMessageToDebate,
      }}
    >
      {children}
    </DebateContext.Provider>
  );
}

export function useDebate() {
  const context = useContext(DebateContext);
  if (!context) {
    throw new Error('useDebate must be used within DebateProvider');
  }
  return context;
}


import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Debate, Position, Slot, User } from '../types';
import { useAuth } from './AuthContext';

interface DebateContextType {
  debates: Debate[];
  currentDebate: Debate | null;
  currentUser: User;
  setCurrentDebate: (debate: Debate | null) => void;
  addDebate: (debate: Debate) => void;
  updateDebate: (debateId: string, updates: Partial<Debate>) => void;
  addPosition: (debateId: string, position: Position) => void;
  updatePosition: (debateId: string, positionId: string, updates: Partial<Position>) => void;
  removePosition: (debateId: string, positionId: string) => void;
  addSlotToPosition: (debateId: string, positionId: string, slot: Slot) => void;
  updateSlot: (debateId: string, positionId: string, slotId: string, updates: Partial<Slot>) => void;
  removeSlot: (debateId: string, positionId: string, slotId: string) => void;
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
          positions: [
            {
              id: 'pos1',
              name: 'Pro',
              description: 'Argumente für den Einsatz von KI in der Bildung',
              color: '#10b981',
              slots: [
                {
                  id: 'slot1',
                  type: 'invited',
                  participant: user,
                },
              ],
            },
            {
              id: 'pos2',
              name: 'Contra',
              description: 'Kritische Bedenken zum KI-Einsatz in Schulen',
              color: '#ef4444',
              slots: [
                {
                  id: 'slot2',
                  type: 'invited',
                  participant: { id: '2', name: 'Anna Schmidt', email: 'anna@example.com' },
                },
                {
                  id: 'slot3',
                  type: 'open',
                },
              ],
            },
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
              positionId: 'pos1',
              slotId: 'slot1',
            },
            {
              id: '2',
              userId: '2',
              userName: 'Anna Schmidt',
              text: 'Aber es besteht die Gefahr, dass soziale Kompetenzen vernachlässigt werden.',
              timestamp: new Date('2024-11-18T10:15:00'),
              positionId: 'pos2',
              slotId: 'slot2',
            },
          ],
        },
        {
          id: '2',
          title: 'Homeoffice vs. Büro',
          description: 'Was ist produktiver für moderne Teams?',
          createdBy: { id: '2', name: 'Anna Schmidt', email: 'anna@example.com' },
          positions: [
            {
              id: 'pos1',
              name: 'Homeoffice',
              description: 'Vorteile von flexibler Arbeit von Zuhause',
              color: '#3b82f6',
              slots: [
                {
                  id: 'slot1',
                  type: 'invited',
                  participant: user,
                },
              ],
            },
            {
              id: 'pos2',
              name: 'Büro',
              description: 'Argumente für Präsenzarbeit im Büro',
              color: '#f59e0b',
              slots: [
                {
                  id: 'slot2',
                  type: 'invited',
                  participant: { id: '2', name: 'Anna Schmidt', email: 'anna@example.com' },
                },
                {
                  id: 'slot3',
                  type: 'ai',
                  participant: { id: 'ai1', name: 'KI Assistent', email: 'ai@debate.app' },
                  aiConfig: {
                    model: 'gpt-4',
                  },
                },
              ],
            },
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
          positions: [],
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

  const updateDebate = (debateId: string, updates: Partial<Debate>) => {
    setDebates(debates.map(debate => 
      debate.id === debateId 
        ? { ...debate, ...updates }
        : debate
    ));
    if (currentDebate?.id === debateId) {
      setCurrentDebate({ ...currentDebate, ...updates });
    }
  };

  const addPosition = (debateId: string, position: Position) => {
    const updatedDebates = debates.map(debate => 
      debate.id === debateId 
        ? { ...debate, positions: [...debate.positions, position] }
        : debate
    );
    setDebates(updatedDebates);
    if (currentDebate?.id === debateId) {
      setCurrentDebate({ ...currentDebate, positions: [...currentDebate.positions, position] });
    }
  };

  const updatePosition = (debateId: string, positionId: string, updates: Partial<Position>) => {
    const updatedDebates = debates.map(debate => 
      debate.id === debateId 
        ? { 
            ...debate, 
            positions: debate.positions.map(pos => 
              pos.id === positionId ? { ...pos, ...updates } : pos
            )
          }
        : debate
    );
    setDebates(updatedDebates);
    if (currentDebate?.id === debateId) {
      setCurrentDebate({
        ...currentDebate,
        positions: currentDebate.positions.map(pos => 
          pos.id === positionId ? { ...pos, ...updates } : pos
        )
      });
    }
  };

  const removePosition = (debateId: string, positionId: string) => {
    const updatedDebates = debates.map(debate => 
      debate.id === debateId 
        ? { ...debate, positions: debate.positions.filter(pos => pos.id !== positionId) }
        : debate
    );
    setDebates(updatedDebates);
    if (currentDebate?.id === debateId) {
      setCurrentDebate({
        ...currentDebate,
        positions: currentDebate.positions.filter(pos => pos.id !== positionId)
      });
    }
  };

  const addSlotToPosition = (debateId: string, positionId: string, slot: Slot) => {
    const updatedDebates = debates.map(debate => 
      debate.id === debateId 
        ? { 
            ...debate, 
            positions: debate.positions.map(pos => 
              pos.id === positionId 
                ? { ...pos, slots: [...pos.slots, slot] }
                : pos
            )
          }
        : debate
    );
    setDebates(updatedDebates);
    if (currentDebate?.id === debateId) {
      setCurrentDebate({
        ...currentDebate,
        positions: currentDebate.positions.map(pos => 
          pos.id === positionId 
            ? { ...pos, slots: [...pos.slots, slot] }
            : pos
        )
      });
    }
  };

  const updateSlot = (debateId: string, positionId: string, slotId: string, updates: Partial<Slot>) => {
    const updatedDebates = debates.map(debate => 
      debate.id === debateId 
        ? { 
            ...debate, 
            positions: debate.positions.map(pos => 
              pos.id === positionId 
                ? { 
                    ...pos, 
                    slots: pos.slots.map(slot => 
                      slot.id === slotId ? { ...slot, ...updates } : slot
                    )
                  }
                : pos
            )
          }
        : debate
    );
    setDebates(updatedDebates);
    if (currentDebate?.id === debateId) {
      setCurrentDebate({
        ...currentDebate,
        positions: currentDebate.positions.map(pos => 
          pos.id === positionId 
            ? { 
                ...pos, 
                slots: pos.slots.map(slot => 
                  slot.id === slotId ? { ...slot, ...updates } : slot
                )
              }
            : pos
        )
      });
    }
  };

  const removeSlot = (debateId: string, positionId: string, slotId: string) => {
    const updatedDebates = debates.map(debate => 
      debate.id === debateId 
        ? { 
            ...debate, 
            positions: debate.positions.map(pos => 
              pos.id === positionId 
                ? { ...pos, slots: pos.slots.filter(slot => slot.id !== slotId) }
                : pos
            )
          }
        : debate
    );
    setDebates(updatedDebates);
    if (currentDebate?.id === debateId) {
      setCurrentDebate({
        ...currentDebate,
        positions: currentDebate.positions.map(pos => 
          pos.id === positionId 
            ? { ...pos, slots: pos.slots.filter(slot => slot.id !== slotId) }
            : pos
        )
      });
    }
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
        updateDebate,
        addPosition,
        updatePosition,
        removePosition,
        addSlotToPosition,
        updateSlot,
        removeSlot,
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


/**
 * Custom hook for grouping debates
 */

import { useMemo } from 'react';
import { Debate } from '../types';
import { isParticipant } from '../utils/helpers';

export interface DebateGroups {
  pending: Debate[];
  active: Debate[];
  observer: Debate[];
  completed: Debate[];
  archived: Debate[];
}

export function useDebateGroups(debates: Debate[], currentUserId: string): DebateGroups {
  return useMemo(() => {
    const pendingDebates = debates.filter(d => 
      d.status === 'pending' || d.status === 'awaiting_acceptance'
    );
    
    const activeDebates = debates.filter(d => 
      d.status === 'active' && isParticipant(d, currentUserId)
    );
    
    const observerDebates = debates.filter(d => 
      d.status === 'active' && !isParticipant(d, currentUserId)
    );
    
    const completedDebates = debates.filter(d => 
      d.status === 'completed'
    );
    
    const archivedDebates = debates.filter(d => 
      d.status === 'archived'
    );

    return {
      pending: pendingDebates,
      active: activeDebates,
      observer: observerDebates,
      completed: completedDebates,
      archived: archivedDebates,
    };
  }, [debates, currentUserId]);
}


/**
 * Custom hook for handling debate invitations
 */

import { useDebate } from '../context/DebateContext';
import { Debate } from '../types';

export function useDebateInvitations() {
  const { 
    acceptInvitation, 
    declineInvitation, 
    hasUserPendingInvitation,
    currentUser 
  } = useDebate();

  const handleAcceptInvitation = async (debate: Debate, e?: any) => {
    if (e) e.stopPropagation();
    
    // Find the slot for current user
    for (const position of debate.positions) {
      const slot = position.slots.find(
        s => s.type === 'invited' && 
             s.participant?.id === currentUser.id && 
             s.invitationAccepted === false
      );
      if (slot) {
        try {
          await acceptInvitation(debate.id, position.id, slot.id);
        } catch (err) {
          console.error('Error accepting invitation:', err);
        }
        return;
      }
    }
  };

  const handleDeclineInvitation = async (debate: Debate, e?: any) => {
    if (e) e.stopPropagation();
    
    // Find the slot for current user
    for (const position of debate.positions) {
      const slot = position.slots.find(
        s => s.type === 'invited' && 
             s.participant?.id === currentUser.id && 
             s.invitationAccepted === false
      );
      if (slot) {
        try {
          await declineInvitation(debate.id, position.id, slot.id);
        } catch (err) {
          console.error('Error declining invitation:', err);
        }
        return;
      }
    }
  };

  return {
    handleAcceptInvitation,
    handleDeclineInvitation,
    hasUserPendingInvitation,
    currentUser,
  };
}


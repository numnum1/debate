/**
 * Common utility functions used throughout the app
 */

import { Debate } from '../types';

/**
 * Format a date for display
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Ungültiges Datum';
  }
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - dateObj.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
};

/**
 * Format timestamp for messages
 */
export const formatTimestamp = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '--:--';
  }
  
  return dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Get status color based on debate status
 */
export const getStatusColor = (status: Debate['status'], colors: any): string => {
  switch (status) {
    case 'active': return colors.success;
    case 'completed': return colors.primary;
    case 'pending': return colors.warning;
    case 'awaiting_acceptance': return colors.info;
    case 'archived': return colors.textSecondary;
    default: return colors.textSecondary;
  }
};

/**
 * Get readable status label
 */
export const getStatusLabel = (
  status: Debate['status'], 
  debate: Debate,
  hasUserPendingInvitation?: boolean
): string => {
  // Check if the current user has a pending invitation
  if (status === 'awaiting_acceptance' && hasUserPendingInvitation) {
    return 'Wartet auf Antwort';
  }
  
  // Check if debate is ready to start (pending + all slots filled/accepted)
  if (status === 'pending') {
    const hasAtLeast2Positions = debate.positions && debate.positions.length >= 2;
    const allPositionsHaveSlots = debate.positions?.every(pos => pos.slots && pos.slots.length > 0);
    const allInvitedAccepted = debate.positions
      ?.flatMap(pos => pos.slots)
      .filter(slot => slot.type === 'invited')
      .every(slot => slot.invitationAccepted === true);
    
    if (hasAtLeast2Positions && allPositionsHaveSlots && allInvitedAccepted) {
      return 'Bereit zum Starten';
    }
    return 'Noch nicht gestartet';
  }
  
  switch (status) {
    case 'active': return 'Aktiv';
    case 'completed': return 'Beendet';
    case 'awaiting_acceptance': return 'Warte auf Teilnehmer';
    case 'archived': return 'Archiviert';
    default: return status;
  }
};

/**
 * Check if user is participant in debate
 */
export const isParticipant = (debate: Debate, userId: string): boolean => {
  return debate.positions.some(position => 
    position.slots.some(slot => 
      slot.participant && slot.participant.id === userId
    )
  );
};

/**
 * Count participants in debate
 */
export const countParticipants = (debate: Debate): number => {
  return debate.positions.reduce(
    (sum, pos) => sum + pos.slots.filter(s => s.participant).length, 
    0
  );
};

/**
 * Predefined colors for positions
 */
export const POSITION_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
];


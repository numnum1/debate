import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { websocket } from '../services/websocket';
import { Debate, DebateMessage, Position, Slot, User } from '../types';
import { useAuth } from './AuthContext';

interface TypingUser {
  userId: string;
  userName: string;
}

interface DebateContextType {
  debates: Debate[];
  currentDebate: Debate | null;
  currentUser: User;
  isLoading: boolean;
  error: string | null;
  typingUsers: TypingUser[];
  setCurrentDebate: (debate: Debate | null) => void;
  addDebate: (debate: Debate) => Promise<Debate>;
  updateDebate: (debateId: string, updates: Partial<Debate>) => Promise<void>;
  deleteDebate: (debateId: string) => Promise<void>;
  closeDebate: (debateId: string) => Promise<void>;
  addPosition: (debateId: string, position: Position) => Promise<void>;
  updatePosition: (debateId: string, positionId: string, updates: Partial<Position>) => Promise<void>;
  removePosition: (debateId: string, positionId: string) => Promise<void>;
  addSlotToPosition: (debateId: string, positionId: string, slot: Slot) => Promise<void>;
  updateSlot: (debateId: string, positionId: string, slotId: string, updates: Partial<Slot>) => Promise<void>;
  removeSlot: (debateId: string, positionId: string, slotId: string) => Promise<void>;
  addMessageToDebate: (debateId: string, message: DebateMessage) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
  refreshDebates: () => Promise<void>;
  refreshCurrentDebate: () => Promise<void>;
  addModerator: (debateId: string, moderator: User) => Promise<void>;
  removeModerator: (debateId: string, userId: string) => Promise<void>;
  isModerator: (debateId: string, userId: string) => Promise<boolean>;
}

const DebateContext = createContext<DebateContextType | undefined>(undefined);

export function DebateProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, refreshAccessToken } = useAuth();
  
  const [debates, setDebates] = useState<Debate[]>([]);
  const [currentDebate, setCurrentDebate] = useState<Debate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  
  // Initialize API and WebSocket with access token
  useEffect(() => {
    if (accessToken) {
      console.log('[DebateContext] Setting access token for API and WebSocket');
      api.setAccessToken(accessToken);
      api.setRefreshTokenCallback(refreshAccessToken);
      websocket.setAccessToken(accessToken);
      websocket.connect();
    } else {
      websocket.disconnect();
    }

    return () => {
      websocket.disconnect();
    };
  }, [accessToken, refreshAccessToken]);

  // Load debates when user logs in
  useEffect(() => {
    if (user && accessToken) {
      refreshDebates();
    } else {
      setDebates([]);
      setCurrentDebate(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  // Listen for real-time messages
  useEffect(() => {
    const unsubscribe = websocket.onMessage((message: DebateMessage) => {
      console.log('[DebateContext] Real-time message received:', message);
      
      // Add message to current debate - use callback to always get fresh state
      setCurrentDebate(prev => {
        if (!prev || !message.id) return prev;
        
        // Avoid duplicates
        const messageExists = prev.messages.some(m => m.id === message.id);
        if (messageExists) {
          console.log('[DebateContext] Message already exists, skipping:', message.id);
          return prev;
        }
        
        return {
          ...prev,
          messages: [...prev.messages, message],
        };
      });
      
      // Also update the debates list for sidebar
      setDebates(prev => prev.map(d => {
        if (!d.id || !message.id) return d;
        
        // Find the debate this message belongs to
        // We need to check if this is the current debate from WebSocket context
        const currentDebateId = websocket.getCurrentDebateId();
        if (d.id !== currentDebateId) return d;
        
        // Avoid duplicates
        const messageExists = d.messages.some(m => m.id === message.id);
        if (messageExists) return d;
        
        return {
          ...d,
          messages: [...d.messages, message],
        };
      }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for typing indicators
  useEffect(() => {
    const unsubscribe = websocket.onTyping((data) => {
      console.log('[DebateContext] Typing indicator:', data);
      
      if (data.isTyping) {
        // Add user to typing list if not already there
        setTypingUsers(prev => {
          const exists = prev.some(u => u.userId === data.userId);
          if (exists) return prev;
          return [...prev, { userId: data.userId, userName: data.userName }];
        });
        
        // Auto-remove after 3 seconds (in case we don't receive isTyping: false)
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }, 3000);
      } else {
        // Remove user from typing list
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for debate updates (positions, slots, status changes, etc.)
  useEffect(() => {
    const unsubscribe = websocket.onDebateUpdate((updatedDebate: Debate) => {
      console.log('='.repeat(60));
      console.log('[DebateContext] ✓ Debate updated via WebSocket:', updatedDebate.id);
      console.log('[DebateContext] Updated debate has', updatedDebate.positions?.length || 0, 'positions');
      console.log('[DebateContext] Current debate ID:', currentDebate?.id);
      console.log('='.repeat(60));
      
      // Update the debates list
      setDebates(prev => prev.map(d => 
        d.id === updatedDebate.id ? updatedDebate : d
      ));
      
      // Update current debate if it's the one that was updated
      setCurrentDebate(prev => {
        if (prev && prev.id === updatedDebate.id) {
          console.log('[DebateContext] ✓ Updating current debate with new data');
          return updatedDebate;
        }
        return prev;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Join/leave debate room when current debate changes
  useEffect(() => {
    const previousDebateId = websocket.getCurrentDebateId();
    
    // Clear typing users when changing debates
    setTypingUsers([]);
    
    if (currentDebate?.id) {
      if (previousDebateId && previousDebateId !== currentDebate.id) {
        console.log('[DebateContext] Leaving previous debate:', previousDebateId);
        websocket.leaveDebate(previousDebateId);
      }
      console.log('[DebateContext] Joining debate room:', currentDebate.id);
      websocket.joinDebate(currentDebate.id);
    } else if (previousDebateId) {
      console.log('[DebateContext] Leaving debate:', previousDebateId);
      websocket.leaveDebate(previousDebateId);
    }
  }, [currentDebate?.id]);
  
  if (!user) {
    throw new Error('DebateProvider requires authenticated user');
  }

  const currentUser = user;

  /**
   * Refresh all debates from backend
   */
  const refreshDebates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedDebates = await api.getDebates();
      console.log('[DebateContext] ✓ Debates loaded:', fetchedDebates.length);
      setDebates(fetchedDebates);
      
      // If no current debate, select first one
      if (!currentDebate && fetchedDebates.length > 0) {
        setCurrentDebate(fetchedDebates[0]);
      }
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Laden der Debatten';
      console.error('[DebateContext] ✗ Error loading debates:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh current debate from backend
   */
  const refreshCurrentDebate = async () => {
    if (!currentDebate) return;

    try {
      setIsLoading(true);
      setError(null);
      const updated = await api.getDebate(currentDebate.id);
      console.log('[DebateContext] ✓ Debate refreshed:', updated.id);
      setCurrentDebate(updated);
      
      // Also update in debates list
      setDebates(prev => 
        prev.map(d => d.id === updated.id ? updated : d)
      );
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Aktualisieren der Debatte';
      console.error('[DebateContext] ✗ Error refreshing debate:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add new debate
   */
  const addDebate = async (debate: Debate): Promise<Debate> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Store the temporary ID to update currentDebate later
      const tempId = debate.id;
      
      // Optimistic update
      setDebates(prev => [debate, ...prev]);
      
      // API call
      const created = await api.createDebate(debate);
      console.log('[DebateContext] ✓ Debate created with ID:', created.id, '(was:', tempId, ')');
      
      // Update with server response
      setDebates(prev => prev.map(d => d.id === tempId ? created : d));
      
      // If this was the current debate, update it with the new data (including new ID)
      setCurrentDebate(prev => {
        if (prev && prev.id === tempId) {
          console.log('[DebateContext] ✓ Updating currentDebate with new ID:', created.id);
          return created;
        }
        return prev;
      });
      
      return created;
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Erstellen der Debatte';
      console.error('[DebateContext] ✗ Error creating debate:', errorMsg);
      setError(errorMsg);
      
      // Rollback optimistic update
      setDebates(prev => prev.filter(d => d.id !== debate.id));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update debate
   */
  const updateDebate = async (debateId: string, updates: Partial<Debate>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // No optimistic update - wait for WebSocket broadcast
      
      // API call
      const updated = await api.updateDebate(debateId, updates);
      console.log('[DebateContext] ✓ Debate updated:', updated.id);
      
      // The WebSocket broadcast will update the state automatically
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Aktualisieren der Debatte';
      console.error('[DebateContext] ✗ Error updating debate:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete debate
   */
  const deleteDebate = async (debateId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Optimistic update
      const updatedDebates = debates.filter(d => d.id !== debateId);
      setDebates(updatedDebates);
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate(updatedDebates.length > 0 ? updatedDebates[0] : null);
      }
      
      // API call
      await api.deleteDebate(debateId);
      console.log('[DebateContext] ✓ Debate deleted:', debateId);
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Löschen der Debatte';
      console.error('[DebateContext] ✗ Error deleting debate:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Close debate and archive it (only owner can do this)
   */
  const closeDebate = async (debateId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // No optimistic update - wait for WebSocket broadcast
      
      // API call
      const archived = await api.closeDebate(debateId);
      console.log('[DebateContext] ✓ Debate closed and archived:', archived.id);
      
      // The WebSocket broadcast will update the state automatically
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Schließen der Debatte';
      console.error('[DebateContext] ✗ Error closing debate:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add position to debate
   */
  const addPosition = async (debateId: string, position: Position) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Optimistic update - add position immediately to UI
      const optimisticPosition = { ...position };
      
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        return {
          ...prev,
          positions: [...prev.positions, optimisticPosition],
        };
      });
      
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { ...d, positions: [...d.positions, optimisticPosition] }
          : d
      ));
      
      // API call
      const created = await api.addPosition(debateId, position);
      console.log('[DebateContext] ✓ Position added:', created.id);
      
      // Update with server response (replace optimistic position with actual position)
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        return {
          ...prev,
          positions: prev.positions.map(p => p.id === position.id ? created : p),
        };
      });
      
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { ...d, positions: d.positions.map(p => p.id === position.id ? created : p) }
          : d
      ));
      
      // The WebSocket broadcast will also update the state for other clients
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Hinzufügen der Position';
      console.error('[DebateContext] ✗ Error adding position:', errorMsg);
      setError(errorMsg);
      
      // Rollback optimistic update on error
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        return {
          ...prev,
          positions: prev.positions.filter(p => p.id !== position.id),
        };
      });
      
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { ...d, positions: d.positions.filter(p => p.id !== position.id) }
          : d
      ));
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update position
   */
  const updatePosition = async (debateId: string, positionId: string, updates: Partial<Position>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Optimistic update - apply changes immediately to UI
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        return {
          ...prev,
          positions: prev.positions.map(p => 
            p.id === positionId ? { ...p, ...updates } : p
          ),
        };
      });
      
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { 
              ...d, 
              positions: d.positions.map(p => 
                p.id === positionId ? { ...p, ...updates } : p
              )
            }
          : d
      ));
      
      // API call
      const updated = await api.updatePosition(debateId, positionId, updates);
      console.log('[DebateContext] ✓ Position updated:', updated.id);
      
      // Update with server response
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        return {
          ...prev,
          positions: prev.positions.map(p => p.id === positionId ? updated : p),
        };
      });
      
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { ...d, positions: d.positions.map(p => p.id === positionId ? updated : p) }
          : d
      ));
      
      // The WebSocket broadcast will also update the state for other clients
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Aktualisieren der Position';
      console.error('[DebateContext] ✗ Error updating position:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Remove position from debate
   */
  const removePosition = async (debateId: string, positionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Store removed position for rollback
      let removedPosition: Position | null = null;
      
      // Optimistic update - remove position immediately from UI
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        const positionToRemove = prev.positions.find(p => p.id === positionId);
        if (positionToRemove) {
          removedPosition = positionToRemove; // Store for rollback
        }
        
        return {
          ...prev,
          positions: prev.positions.filter(p => p.id !== positionId),
        };
      });
      
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { ...d, positions: d.positions.filter(p => p.id !== positionId) }
          : d
      ));
      
      // API call
      await api.removePosition(debateId, positionId);
      console.log('[DebateContext] ✓ Position removed:', positionId);
      
      // The WebSocket broadcast will also update the state for other clients
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Entfernen der Position';
      console.error('[DebateContext] ✗ Error removing position:', errorMsg);
      setError(errorMsg);
      
      // Rollback optimistic update on error
      if (removedPosition) {
        setCurrentDebate(prev => {
          if (!prev || prev.id !== debateId) return prev;
          
          return {
            ...prev,
            positions: [...prev.positions, removedPosition],
          };
        });
        
        setDebates(prev => prev.map(d => 
          d.id === debateId 
            ? { ...d, positions: [...d.positions, removedPosition] }
            : d
        ));
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add slot to position
   */
  const addSlotToPosition = async (debateId: string, positionId: string, slot: Slot) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Optimistic update - add slot immediately to UI
      const optimisticSlot = { ...slot };
      
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        return {
          ...prev,
          positions: prev.positions.map(pos => 
            pos.id === positionId 
              ? { ...pos, slots: [...pos.slots, optimisticSlot] }
              : pos
          ),
        };
      });
      
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? {
              ...d,
              positions: d.positions.map(pos => 
                pos.id === positionId 
                  ? { ...pos, slots: [...pos.slots, optimisticSlot] }
                  : pos
              ),
            }
          : d
      ));
      
      // API call
      const created = await api.addSlot(debateId, positionId, slot);
      console.log('[DebateContext] ✓ Slot added:', created.id);
      
      // Update with server response (replace optimistic slot with actual slot)
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        return {
          ...prev,
          positions: prev.positions.map(pos => 
            pos.id === positionId 
              ? { 
                  ...pos, 
                  slots: pos.slots.map(s => s.id === slot.id ? created : s)
                }
              : pos
          ),
        };
      });
      
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? {
              ...d,
              positions: d.positions.map(pos => 
                pos.id === positionId 
                  ? { 
                      ...pos, 
                      slots: pos.slots.map(s => s.id === slot.id ? created : s)
                    }
                  : pos
              ),
            }
          : d
      ));
      
      // The WebSocket broadcast will also update the state for other clients
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Hinzufügen des Slots';
      console.error('[DebateContext] ✗ Error adding slot:', errorMsg);
      setError(errorMsg);
      
      // Rollback optimistic update on error
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        return {
          ...prev,
          positions: prev.positions.map(pos => 
            pos.id === positionId 
              ? { ...pos, slots: pos.slots.filter(s => s.id !== slot.id) }
              : pos
          ),
        };
      });
      
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? {
              ...d,
              positions: d.positions.map(pos => 
                pos.id === positionId 
                  ? { ...pos, slots: pos.slots.filter(s => s.id !== slot.id) }
                  : pos
              ),
            }
          : d
      ));
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update slot
   */
  const updateSlot = async (debateId: string, positionId: string, slotId: string, updates: Partial<Slot>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Store original slot for rollback
      let originalSlot: Slot | null = null;
      
      // Optimistic update - apply changes immediately to UI
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        return {
          ...prev,
          positions: prev.positions.map(pos => {
            if (pos.id === positionId) {
              return {
                ...pos,
                slots: pos.slots.map(s => {
                  if (s.id === slotId) {
                    originalSlot = s; // Store for rollback
                    return { ...s, ...updates };
                  }
                  return s;
                }),
              };
            }
            return pos;
          }),
        };
      });
      
      setDebates(prev => prev.map(d => {
        if (d.id === debateId) {
          return {
            ...d,
            positions: d.positions.map(pos => {
              if (pos.id === positionId) {
                return {
                  ...pos,
                  slots: pos.slots.map(s => 
                    s.id === slotId ? { ...s, ...updates } : s
                  ),
                };
              }
              return pos;
            }),
          };
        }
        return d;
      }));
      
      // API call
      const updated = await api.updateSlot(debateId, positionId, slotId, updates);
      console.log('[DebateContext] ✓ Slot updated:', updated.id);
      
      // Update with server response
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        return {
          ...prev,
          positions: prev.positions.map(pos => 
            pos.id === positionId 
              ? { 
                  ...pos, 
                  slots: pos.slots.map(s => s.id === slotId ? updated : s)
                }
              : pos
          ),
        };
      });
      
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? {
              ...d,
              positions: d.positions.map(pos => 
                pos.id === positionId 
                  ? { 
                      ...pos, 
                      slots: pos.slots.map(s => s.id === slotId ? updated : s)
                    }
                  : pos
              ),
            }
          : d
      ));
      
      // The WebSocket broadcast will also update the state for other clients
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Aktualisieren des Slots';
      console.error('[DebateContext] ✗ Error updating slot:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Remove slot from position
   */
  const removeSlot = async (debateId: string, positionId: string, slotId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Store removed slot for rollback
      let removedSlot: Slot | null = null;
      
      // Optimistic update - remove slot immediately from UI
      setCurrentDebate(prev => {
        if (!prev || prev.id !== debateId) return prev;
        
        return {
          ...prev,
          positions: prev.positions.map(pos => {
            if (pos.id === positionId) {
              const slotToRemove = pos.slots.find(s => s.id === slotId);
              if (slotToRemove) {
                removedSlot = slotToRemove; // Store for rollback
              }
              return {
                ...pos,
                slots: pos.slots.filter(s => s.id !== slotId),
              };
            }
            return pos;
          }),
        };
      });
      
      setDebates(prev => prev.map(d => {
        if (d.id === debateId) {
          return {
            ...d,
            positions: d.positions.map(pos => 
              pos.id === positionId 
                ? { ...pos, slots: pos.slots.filter(s => s.id !== slotId) }
                : pos
            ),
          };
        }
        return d;
      }));
      
      // API call
      await api.removeSlot(debateId, positionId, slotId);
      console.log('[DebateContext] ✓ Slot removed:', slotId);
      
      // The WebSocket broadcast will also update the state for other clients
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Entfernen des Slots';
      console.error('[DebateContext] ✗ Error removing slot:', errorMsg);
      setError(errorMsg);
      
      // Rollback optimistic update on error
      if (removedSlot) {
        setCurrentDebate(prev => {
          if (!prev || prev.id !== debateId) return prev;
          
          return {
            ...prev,
            positions: prev.positions.map(pos => 
              pos.id === positionId 
                ? { ...pos, slots: [...pos.slots, removedSlot] }
                : pos
            ),
          };
        });
        
        setDebates(prev => prev.map(d => 
          d.id === debateId 
            ? {
                ...d,
                positions: d.positions.map(pos => 
                  pos.id === positionId 
                    ? { ...pos, slots: [...pos.slots, removedSlot] }
                    : pos
                ),
              }
            : d
        ));
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add message to debate (with real-time sync)
   */
  const addMessageToDebate = async (debateId: string, message: DebateMessage) => {
    try {
      setError(null);
      
      // Send via WebSocket only - server will save and broadcast
      // The message will appear via the WebSocket listener (lines 67-89)
      if (websocket.isConnected()) {
        websocket.sendMessage(debateId, message);
        console.log('[DebateContext] ✓ Message sent via WebSocket');
      } else {
        throw new Error('WebSocket ist nicht verbunden');
      }
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Senden der Nachricht';
      console.error('[DebateContext] ✗ Error sending message:', errorMsg);
      setError(errorMsg);
      throw err;
    }
  };

  /**
   * Send typing indicator for current debate
   */
  const sendTypingIndicator = (isTyping: boolean) => {
    if (currentDebate?.id && websocket.isConnected()) {
      websocket.sendTyping(currentDebate.id, isTyping);
    }
  };

  /**
   * Add moderator to debate
   */
  const addModerator = async (debateId: string, moderator: User) => {
    try {
      setError(null);
      const updatedDebate = await api.addModerator(debateId, moderator);
      
      // Update local state
      setDebates(prev => prev.map(d => d.id === debateId ? updatedDebate : d));
      if (currentDebate?.id === debateId) {
        setCurrentDebate(updatedDebate);
      }
      
      console.log('[DebateContext] ✓ Moderator added:', moderator.id);
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Hinzufügen des Moderators';
      console.error('[DebateContext] ✗ Error adding moderator:', errorMsg);
      setError(errorMsg);
      throw err;
    }
  };

  /**
   * Remove moderator from debate
   */
  const removeModerator = async (debateId: string, userId: string) => {
    try {
      setError(null);
      const updatedDebate = await api.removeModerator(debateId, userId);
      
      // Update local state
      setDebates(prev => prev.map(d => d.id === debateId ? updatedDebate : d));
      if (currentDebate?.id === debateId) {
        setCurrentDebate(updatedDebate);
      }
      
      console.log('[DebateContext] ✓ Moderator removed:', userId);
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Entfernen des Moderators';
      console.error('[DebateContext] ✗ Error removing moderator:', errorMsg);
      setError(errorMsg);
      throw err;
    }
  };

  /**
   * Check if user is moderator
   */
  const isModerator = async (debateId: string, userId: string): Promise<boolean> => {
    try {
      return await api.isModerator(debateId, userId);
    } catch (err: any) {
      console.error('[DebateContext] ✗ Error checking moderator:', err);
      return false;
    }
  };

  return (
    <DebateContext.Provider
      value={{
        debates,
        currentDebate,
        currentUser,
        isLoading,
        error,
        typingUsers,
        setCurrentDebate,
        addDebate,
        updateDebate,
        deleteDebate,
        closeDebate,
        addPosition,
        updatePosition,
        removePosition,
        addSlotToPosition,
        updateSlot,
        removeSlot,
        addMessageToDebate,
        sendTypingIndicator,
        refreshDebates,
        refreshCurrentDebate,
        addModerator,
        removeModerator,
        isModerator,
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


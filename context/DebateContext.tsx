import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { websocket } from '../services/websocket';
import { Debate, DebateMessage, Position, Slot, User } from '../types';
import { useAuth } from './AuthContext';

interface DebateContextType {
  debates: Debate[];
  currentDebate: Debate | null;
  currentUser: User;
  isLoading: boolean;
  error: string | null;
  setCurrentDebate: (debate: Debate | null) => void;
  addDebate: (debate: Debate) => Promise<void>;
  updateDebate: (debateId: string, updates: Partial<Debate>) => Promise<void>;
  deleteDebate: (debateId: string) => Promise<void>;
  addPosition: (debateId: string, position: Position) => Promise<void>;
  updatePosition: (debateId: string, positionId: string, updates: Partial<Position>) => Promise<void>;
  removePosition: (debateId: string, positionId: string) => Promise<void>;
  addSlotToPosition: (debateId: string, positionId: string, slot: Slot) => Promise<void>;
  updateSlot: (debateId: string, positionId: string, slotId: string, updates: Partial<Slot>) => Promise<void>;
  removeSlot: (debateId: string, positionId: string, slotId: string) => Promise<void>;
  addMessageToDebate: (debateId: string, message: DebateMessage) => Promise<void>;
  refreshDebates: () => Promise<void>;
  refreshCurrentDebate: () => Promise<void>;
}

const DebateContext = createContext<DebateContextType | undefined>(undefined);

export function DebateProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, refreshAccessToken } = useAuth();
  
  const [debates, setDebates] = useState<Debate[]>([]);
  const [currentDebate, setCurrentDebate] = useState<Debate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // Join/leave debate room when current debate changes
  useEffect(() => {
    const previousDebateId = websocket.getCurrentDebateId();
    
    if (currentDebate?.id) {
      if (previousDebateId && previousDebateId !== currentDebate.id) {
        websocket.leaveDebate(previousDebateId);
      }
      websocket.joinDebate(currentDebate.id);
    } else if (previousDebateId) {
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
  const addDebate = async (debate: Debate) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Optimistic update
      setDebates(prev => [debate, ...prev]);
      
      // API call
      const created = await api.createDebate(debate);
      console.log('[DebateContext] ✓ Debate created:', created.id);
      
      // Update with server response
      setDebates(prev => prev.map(d => d.id === debate.id ? created : d));
      
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
      
      // Optimistic update
      setDebates(prev => prev.map(d => 
        d.id === debateId ? { ...d, ...updates } : d
      ));
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate({ ...currentDebate, ...updates });
      }
      
      // API call
      const updated = await api.updateDebate(debateId, updates);
      console.log('[DebateContext] ✓ Debate updated:', updated.id);
      
      // Update with server response
      setDebates(prev => prev.map(d => d.id === updated.id ? updated : d));
      if (currentDebate?.id === debateId) {
        setCurrentDebate(updated);
      }
      
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
   * Add position to debate
   */
  const addPosition = async (debateId: string, position: Position) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Optimistic update
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { ...d, positions: [...d.positions, position] }
          : d
      ));
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate({
          ...currentDebate,
          positions: [...currentDebate.positions, position]
        });
      }
      
      // API call
      const created = await api.addPosition(debateId, position);
      console.log('[DebateContext] ✓ Position added:', created.id);
      
      // Update with server response
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { 
              ...d, 
              positions: d.positions.map(p => p.id === position.id ? created : p)
            }
          : d
      ));
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate({
          ...currentDebate,
          positions: currentDebate.positions.map(p => p.id === position.id ? created : p)
        });
      }
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Hinzufügen der Position';
      console.error('[DebateContext] ✗ Error adding position:', errorMsg);
      setError(errorMsg);
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
      
      // Optimistic update
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
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate({
          ...currentDebate,
          positions: currentDebate.positions.map(p => 
            p.id === positionId ? { ...p, ...updates } : p
          )
        });
      }
      
      // API call
      const updated = await api.updatePosition(debateId, positionId, updates);
      console.log('[DebateContext] ✓ Position updated:', updated.id);
      
      // Update with server response
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { 
              ...d, 
              positions: d.positions.map(p => p.id === updated.id ? updated : p)
            }
          : d
      ));
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate({
          ...currentDebate,
          positions: currentDebate.positions.map(p => p.id === updated.id ? updated : p)
        });
      }
      
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
      
      // Optimistic update
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { ...d, positions: d.positions.filter(p => p.id !== positionId) }
          : d
      ));
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate({
          ...currentDebate,
          positions: currentDebate.positions.filter(p => p.id !== positionId)
        });
      }
      
      // API call
      await api.removePosition(debateId, positionId);
      console.log('[DebateContext] ✓ Position removed:', positionId);
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Entfernen der Position';
      console.error('[DebateContext] ✗ Error removing position:', errorMsg);
      setError(errorMsg);
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
      
      // Optimistic update
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { 
              ...d, 
              positions: d.positions.map(p => 
                p.id === positionId 
                  ? { ...p, slots: [...p.slots, slot] }
                  : p
              )
            }
          : d
      ));
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate({
          ...currentDebate,
          positions: currentDebate.positions.map(p => 
            p.id === positionId 
              ? { ...p, slots: [...p.slots, slot] }
              : p
          )
        });
      }
      
      // API call
      const created = await api.addSlot(debateId, positionId, slot);
      console.log('[DebateContext] ✓ Slot added:', created.id);
      
      // Update with server response
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { 
              ...d, 
              positions: d.positions.map(p => 
                p.id === positionId 
                  ? { 
                      ...p, 
                      slots: p.slots.map(s => s.id === slot.id ? created : s)
                    }
                  : p
              )
            }
          : d
      ));
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate({
          ...currentDebate,
          positions: currentDebate.positions.map(p => 
            p.id === positionId 
              ? { 
                  ...p, 
                  slots: p.slots.map(s => s.id === slot.id ? created : s)
                }
              : p
          )
        });
      }
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Hinzufügen des Slots';
      console.error('[DebateContext] ✗ Error adding slot:', errorMsg);
      setError(errorMsg);
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
      
      // Optimistic update
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { 
              ...d, 
              positions: d.positions.map(p => 
                p.id === positionId 
                  ? { 
                      ...p, 
                      slots: p.slots.map(s => 
                        s.id === slotId ? { ...s, ...updates } : s
                      )
                    }
                  : p
              )
            }
          : d
      ));
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate({
          ...currentDebate,
          positions: currentDebate.positions.map(p => 
            p.id === positionId 
              ? { 
                  ...p, 
                  slots: p.slots.map(s => 
                    s.id === slotId ? { ...s, ...updates } : s
                  )
                }
              : p
          )
        });
      }
      
      // API call
      const updated = await api.updateSlot(debateId, positionId, slotId, updates);
      console.log('[DebateContext] ✓ Slot updated:', updated.id);
      
      // Update with server response
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { 
              ...d, 
              positions: d.positions.map(p => 
                p.id === positionId 
                  ? { 
                      ...p, 
                      slots: p.slots.map(s => s.id === updated.id ? updated : s)
                    }
                  : p
              )
            }
          : d
      ));
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate({
          ...currentDebate,
          positions: currentDebate.positions.map(p => 
            p.id === positionId 
              ? { 
                  ...p, 
                  slots: p.slots.map(s => s.id === updated.id ? updated : s)
                }
              : p
          )
        });
      }
      
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
      
      // Optimistic update
      setDebates(prev => prev.map(d => 
        d.id === debateId 
          ? { 
              ...d, 
              positions: d.positions.map(p => 
                p.id === positionId 
                  ? { ...p, slots: p.slots.filter(s => s.id !== slotId) }
                  : p
              )
            }
          : d
      ));
      
      if (currentDebate?.id === debateId) {
        setCurrentDebate({
          ...currentDebate,
          positions: currentDebate.positions.map(p => 
            p.id === positionId 
              ? { ...p, slots: p.slots.filter(s => s.id !== slotId) }
              : p
          )
        });
      }
      
      // API call
      await api.removeSlot(debateId, positionId, slotId);
      console.log('[DebateContext] ✓ Slot removed:', slotId);
      
    } catch (err: any) {
      const errorMsg = (err as ApiError).message || 'Fehler beim Entfernen des Slots';
      console.error('[DebateContext] ✗ Error removing slot:', errorMsg);
      setError(errorMsg);
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

  return (
    <DebateContext.Provider
      value={{
        debates,
        currentDebate,
        currentUser,
        isLoading,
        error,
        setCurrentDebate,
        addDebate,
        updateDebate,
        deleteDebate,
        addPosition,
        updatePosition,
        removePosition,
        addSlotToPosition,
        updateSlot,
        removeSlot,
        addMessageToDebate,
        refreshDebates,
        refreshCurrentDebate,
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


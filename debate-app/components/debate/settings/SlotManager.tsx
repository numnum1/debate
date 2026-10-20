/**
 * Slot management component for positions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { Position, User } from '../../../types';
import { useDebate } from '../../../context/DebateContext';
import { InviteParticipantModal } from '../../InviteParticipantModal';
import { AiModelSelector } from '../../AiModelSelector';

interface SlotManagerProps {
  position: Position;
  debateId: string;
  isOwner: boolean;
}

export function SlotManager({ position, debateId, isOwner }: SlotManagerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    addSlotToPosition,
    updateSlot,
    removeSlot,
    currentDebate,
  } = useDebate();
  
  const [showSlotMenu, setShowSlotMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ slotId: string; currentModel: string } | null>(null);

  const handleAddSlot = (type: 'open' | 'invited' | 'ai') => {
    if (type === 'invited') {
      setShowInviteModal(true);
      setShowSlotMenu(false);
      return;
    }

    const newSlot = {
      id: Date.now().toString(),
      type,
      ...(type === 'ai' && {
        participant: { 
          id: `ai-${Date.now()}`, 
          name: 'KI Teilnehmer', 
          email: 'ai@debate.app' 
        },
        aiConfig: {
          model: 'gpt-4',
        },
      }),
    };

    addSlotToPosition(debateId, position.id, newSlot);
    setShowSlotMenu(false);
  };

  const handleSelectUserForInvite = (user: User) => {
    if (!currentDebate) return;

    const isOwner = user.id === currentDebate.createdBy.id;
    const newSlot = {
      id: Date.now().toString(),
      type: 'invited' as const,
      participant: user,
      invitationAccepted: isOwner,
    };

    addSlotToPosition(debateId, position.id, newSlot);
    setShowInviteModal(false);
  };

  const handleOpenModelSelector = (slotId: string, currentModel: string) => {
    setEditingSlot({ slotId, currentModel });
    setShowModelSelector(true);
  };

  const handleSelectModel = async (modelId: string) => {
    if (!editingSlot) return;

    try {
      await updateSlot(debateId, position.id, editingSlot.slotId, {
        aiConfig: {
          model: modelId,
        },
      });
    } catch (err) {
      console.error('Error updating model:', err);
    }
  };

  return (
    <View style={styles.container}>
      {position.slots.length === 0 ? (
        <Text style={[styles.noSlotsText, { color: colors.textSecondary }]}>
          Keine Slots
        </Text>
      ) : (
        position.slots.map((slot) => (
          <View
            key={slot.id}
            style={[
              styles.slotCard,
              { backgroundColor: colors.surface, borderColor: position.color + '50' },
            ]}
          >
            <View style={styles.slotContent}>
              {slot.type === 'open' && (
                <>
                  <View style={[styles.slotIcon, { backgroundColor: position.color + '20' }]}>
                    <Ionicons name="lock-open-outline" size={20} color={position.color} />
                  </View>
                  <View style={styles.slotInfo}>
                    <Text style={[styles.slotType, { color: colors.text }]}>Offener Slot</Text>
                    <Text style={[styles.slotDescription, { color: colors.textSecondary }]}>
                      Jeder kann beitreten
                    </Text>
                  </View>
                </>
              )}
              {slot.type === 'invited' && (
                <>
                  <View style={[styles.slotIcon, { backgroundColor: position.color + '20' }]}>
                    <Ionicons 
                      name={slot.participant ? "person" : "person-add-outline"} 
                      size={20} 
                      color={position.color} 
                    />
                  </View>
                  <View style={styles.slotInfo}>
                    {slot.participant ? (
                      <>
                        <View style={styles.participantRow}>
                          <Text style={[styles.slotType, { color: colors.text }]}>
                            {slot.participant.name}
                          </Text>
                          {slot.invitationAccepted ? (
                            <View style={[styles.acceptedBadge, { backgroundColor: colors.success + '20' }]}>
                              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                              <Text style={[styles.badgeText, { color: colors.success }]}>Akzeptiert</Text>
                            </View>
                          ) : (
                            <View style={[styles.pendingBadge, { backgroundColor: colors.warning + '20' }]}>
                              <Ionicons name="time-outline" size={14} color={colors.warning} />
                              <Text style={[styles.badgeText, { color: colors.warning }]}>Ausstehend</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.slotDescription, { color: colors.textSecondary }]}>
                          {slot.participant.email}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.slotType, { color: colors.text }]}>Einladung ausstehend</Text>
                        <Text style={[styles.slotDescription, { color: colors.textSecondary }]}>
                          Teilnehmer einladen
                        </Text>
                      </>
                    )}
                  </View>
                </>
              )}
              {slot.type === 'ai' && (
                <>
                  <View style={[styles.slotIcon, { backgroundColor: position.color + '20' }]}>
                    <Ionicons name="sparkles" size={20} color={position.color} />
                  </View>
                  <View style={styles.slotInfo}>
                    <Text style={[styles.slotType, { color: colors.text }]}>
                      {slot.participant?.name || 'KI'}
                    </Text>
                    <Text style={[styles.slotDescription, { color: colors.textSecondary }]}>
                      {slot.aiConfig?.model || 'KI-Assistent'}
                    </Text>
                  </View>
                  {isOwner && (
                    <TouchableOpacity
                      style={[styles.editModelButton, { backgroundColor: colors.primary + '20' }]}
                      onPress={() => handleOpenModelSelector(slot.id, slot.aiConfig?.model || 'gpt-4')}
                    >
                      <Ionicons name="settings-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
            {isOwner && (
              <TouchableOpacity
                style={styles.removeSlotButton}
                onPress={() => removeSlot(debateId, position.id, slot.id)}
              >
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
      
      {/* Add Slot Menu */}
      {isOwner && showSlotMenu ? (
        <View style={[styles.slotMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.slotMenuOption, { borderBottomColor: colors.border }]}
            onPress={() => handleAddSlot('open')}
          >
            <Ionicons name="lock-open-outline" size={20} color={colors.text} />
            <View style={styles.slotMenuOptionText}>
              <Text style={[styles.slotMenuTitle, { color: colors.text }]}>Offener Slot</Text>
              <Text style={[styles.slotMenuDescription, { color: colors.textSecondary }]}>
                Jeder kann beitreten
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.slotMenuOption, { borderBottomColor: colors.border }]}
            onPress={() => handleAddSlot('invited')}
          >
            <Ionicons name="person-add-outline" size={20} color={colors.text} />
            <View style={styles.slotMenuOptionText}>
              <Text style={[styles.slotMenuTitle, { color: colors.text }]}>Teilnehmer einladen</Text>
              <Text style={[styles.slotMenuDescription, { color: colors.textSecondary }]}>
                Spezifischen Nutzer einladen
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.slotMenuOption}
            onPress={() => handleAddSlot('ai')}
          >
            <Ionicons name="sparkles" size={20} color={colors.text} />
            <View style={styles.slotMenuOptionText}>
              <Text style={[styles.slotMenuTitle, { color: colors.text }]}>KI hinzufügen</Text>
              <Text style={[styles.slotMenuDescription, { color: colors.textSecondary }]}>
                KI-Teilnehmer zur Debatte hinzufügen
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : isOwner ? (
        <TouchableOpacity
          style={[styles.addSlotButton, { borderColor: position.color }]}
          onPress={() => setShowSlotMenu(true)}
        >
          <Ionicons name="add" size={16} color={position.color} />
          <Text style={[styles.addSlotButtonText, { color: position.color }]}>
            Slot hinzufügen
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Modals */}
      <InviteParticipantModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSelectUser={handleSelectUserForInvite}
      />

      <AiModelSelector
        visible={showModelSelector}
        currentModel={editingSlot?.currentModel || 'gpt-4'}
        onSelect={handleSelectModel}
        onClose={() => {
          setShowModelSelector(false);
          setEditingSlot(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  noSlotsText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  slotIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotInfo: {
    flex: 1,
  },
  slotType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  slotDescription: {
    fontSize: 12,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  removeSlotButton: {
    padding: 4,
  },
  editModelButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addSlotButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  slotMenu: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  slotMenuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  slotMenuOptionText: {
    flex: 1,
  },
  slotMenuTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  slotMenuDescription: {
    fontSize: 12,
  },
});


import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDebate } from '../context/DebateContext';
import { Colors } from '../constants/Colors';
import { DebateMessage, User } from '../types';
import { InviteParticipantModal } from './InviteParticipantModal';
import { AiModelSelector } from './AiModelSelector';
import { ModeratorManager } from './ModeratorManager';

export function DebateView() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { 
    currentDebate, 
    currentUser, 
    typingUsers,
    addMessageToDebate, 
    updateDebate,
    deleteDebate,
    closeDebate,
    addPosition,
    updatePosition,
    removePosition,
    addSlotToPosition,
    updateSlot,
    removeSlot,
    sendTypingIndicator,
    addModerator,
    removeModerator
  } = useDebate();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Settings state for pending debates
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionColor, setNewPositionColor] = useState('#3b82f6');
  const [showSlotMenu, setShowSlotMenu] = useState<string | null>(null); // positionId
  
  // Invite participant modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitePositionId, setInvitePositionId] = useState<string | null>(null);
  
  // AI Model selector state
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ positionId: string; slotId: string; currentModel: string } | null>(null);
  
  // Moderator manager state
  const [showModeratorManager, setShowModeratorManager] = useState(false);

  // Initialize edit fields when debate changes
  React.useEffect(() => {
    if (currentDebate) {
      setEditTitle(currentDebate.title);
      setEditDescription(currentDebate.description || '');
      setEditTags(currentDebate.tags || []);
    }
  }, [currentDebate?.id]);

  // Debug: Log modal state changes
  React.useEffect(() => {
    console.log('[DebateView] Modal state changed:', { showInviteModal, invitePositionId });
  }, [showInviteModal, invitePositionId]);

  // Handle typing indicator with debounce
  React.useEffect(() => {
    if (messageText.trim() && !isTyping) {
      // User started typing
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Set timeout to stop typing indicator after 2 seconds of no typing
    const timeout = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(false);
      }
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [messageText, isTyping, sendTypingIndicator]);

  // Reset typing indicator when message is sent or debate changes
  React.useEffect(() => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDebate?.id]);

  if (!currentDebate) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Wählen Sie eine Debatte aus oder erstellen Sie eine neue
        </Text>
      </View>
    );
  }

  // Find the position and slot of the current user in this debate
  const getUserPositionAndSlot = () => {
    for (const position of currentDebate.positions) {
      const slot = position.slots.find(
        s => s.participant?.id === currentUser.id
      );
      if (slot) {
        return { positionId: position.id, slotId: slot.id };
      }
    }
    return { positionId: undefined, slotId: undefined };
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const { positionId, slotId } = getUserPositionAndSlot();

    const newMessage: DebateMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: messageText.trim(),
      timestamp: new Date(),
      positionId,
      slotId,
    };

    addMessageToDebate(currentDebate.id, newMessage);
    setMessageText('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
    }
  };

  const formatTimestamp = (date: Date | string) => {
    // Konvertiere String zu Date, falls nötig
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Prüfe ob das Date-Objekt gültig ist
    if (isNaN(dateObj.getTime())) {
      return '--:--';
    }
    
    return dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveSettings = () => {
    updateDebate(currentDebate.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      tags: editTags,
    });
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !editTags.includes(trimmedTag)) {
      const updatedTags = [...editTags, trimmedTag];
      setEditTags(updatedTags);
      setNewTag('');
      updateDebate(currentDebate.id, { tags: updatedTags });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = editTags.filter(tag => tag !== tagToRemove);
    setEditTags(updatedTags);
    updateDebate(currentDebate.id, { tags: updatedTags });
  };

  const handleStartDebate = () => {
    updateDebate(currentDebate.id, {
      status: 'active',
    });
  };

  // Check if all positions have at least one slot
  const allPositionsHaveSlots = () => {
    return currentDebate.positions.every(position => 
      position.slots && position.slots.length > 0
    );
  };

  const canStartDebate = () => {
    return currentDebate.positions.length >= 2 && allPositionsHaveSlots();
  };

  const handleDeleteDebate = () => {
    if (currentDebate && currentDebate.createdBy.id === currentUser.id) {
      deleteDebate(currentDebate.id);
    }
  };

  const handleCloseDebate = () => {
    if (currentDebate && currentDebate.createdBy.id === currentUser.id) {
      closeDebate(currentDebate.id);
    }
  };

  const handleAddPosition = async () => {
    if (!newPositionName.trim()) return;

    // Prüfe, ob die Farbe bereits von einer anderen Position verwendet wird
    const colorExists = currentDebate.positions.some(
      position => position.color.toLowerCase() === newPositionColor.toLowerCase()
    );

    if (colorExists) {
      alert('Diese Farbe wird bereits von einer anderen Position verwendet. Bitte wählen Sie eine andere Farbe.');
      return;
    }

    const newPosition = {
      id: Date.now().toString(),
      name: newPositionName.trim(),
      description: '',
      color: newPositionColor,
      slots: [],
    };

    try {
      await addPosition(currentDebate.id, newPosition);
      setNewPositionName('');
      setNewPositionColor('#3b82f6');
    } catch (error: any) {
      // Error is already handled by context, but we can show a user-friendly message
      if (error?.message?.includes('Farbe')) {
        alert(error.message);
      }
    }
  };

  const handleAddSlot = (positionId: string, type: 'open' | 'invited' | 'ai') => {
    console.log('[DebateView] handleAddSlot called:', { positionId, type });
    
    // For invited slots, open the invite modal
    if (type === 'invited') {
      console.log('[DebateView] Opening invite modal for position:', positionId);
      setInvitePositionId(positionId);
      setShowInviteModal(true);
      setShowSlotMenu(null);
      return;
    }

    // For other slot types, create immediately
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

    addSlotToPosition(currentDebate.id, positionId, newSlot);
    setShowSlotMenu(null);
  };

  const handleSelectUserForInvite = (user: User) => {
    console.log('[DebateView] User selected for invite:', user);
    if (!invitePositionId) {
      console.log('[DebateView] Warning: No invitePositionId set');
      return;
    }

    // Create invited slot with selected user
    const newSlot = {
      id: Date.now().toString(),
      type: 'invited' as const,
      participant: user,
    };

    console.log('[DebateView] Creating invited slot:', newSlot);
    addSlotToPosition(currentDebate.id, invitePositionId, newSlot);
    
    // Reset state
    setInvitePositionId(null);
  };

  const handleCancelInvite = () => {
    console.log('[DebateView] Invite cancelled');
    setShowInviteModal(false);
    setInvitePositionId(null);
  };

  const handleOpenModelSelector = (positionId: string, slotId: string, currentModel: string) => {
    console.log('[DebateView] Opening model selector for slot:', { positionId, slotId, currentModel });
    setEditingSlot({ positionId, slotId, currentModel });
    setShowModelSelector(true);
  };

  const handleSelectModel = async (modelId: string) => {
    console.log('[DebateView] Model selected:', modelId);
    if (!editingSlot) return;

    try {
      await updateSlot(currentDebate.id, editingSlot.positionId, editingSlot.slotId, {
        aiConfig: {
          model: modelId,
        },
      });
      console.log('[DebateView] ✓ Model updated successfully');
    } catch (err) {
      console.error('[DebateView] ✗ Error updating model:', err);
    }
  };

  const handleCloseModelSelector = () => {
    setShowModelSelector(false);
    setEditingSlot(null);
  };

  // Moderator management handlers
  const handleOpenModeratorManager = () => {
    setShowModeratorManager(true);
  };

  const handleAddModeratorUser = async (user: User) => {
    try {
      await addModerator(currentDebate.id, user);
      console.log('[DebateView] ✓ Moderator added:', user.name);
    } catch (err: any) {
      console.error('[DebateView] ✗ Error adding moderator:', err);
      alert(err.message || 'Fehler beim Hinzufügen des Moderators');
    }
  };

  const handleRemoveModeratorUser = async (userId: string) => {
    try {
      await removeModerator(currentDebate.id, userId);
      console.log('[DebateView] ✓ Moderator removed:', userId);
    } catch (err: any) {
      console.error('[DebateView] ✗ Error removing moderator:', err);
      alert(err.message || 'Fehler beim Entfernen des Moderators');
    }
  };

  const predefinedColors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Render Settings View for pending debates
  if (currentDebate.status === 'pending') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={[styles.title, { color: colors.text }]}>Debatte einrichten</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: colors.warning }]}>
                  Noch nicht gestartet
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Content */}
        <ScrollView style={styles.settingsContainer} contentContainerStyle={styles.settingsContent}>
          {/* Title Section */}
          <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingsSectionHeader}>
              <Ionicons name="text-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Titel</Text>
            </View>
            <TextInput
              style={[
                styles.settingsInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Debattentitel"
              placeholderTextColor={colors.textSecondary}
              value={editTitle}
              onChangeText={setEditTitle}
              onBlur={handleSaveSettings}
            />
          </View>

          {/* Description Section */}
          <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingsSectionHeader}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Beschreibung</Text>
            </View>
            <TextInput
              style={[
                styles.settingsInput,
                styles.settingsTextArea,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Worum geht es in dieser Debatte?"
              placeholderTextColor={colors.textSecondary}
              value={editDescription}
              onChangeText={setEditDescription}
              onBlur={handleSaveSettings}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Visibility Section */}
          <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingsSectionHeader}>
              <Ionicons name="eye-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Sichtbarkeit</Text>
            </View>
            <View style={styles.visibilityToggleContainer}>
              <View style={styles.visibilityInfo}>
                <Text style={[styles.visibilityLabel, { color: colors.text }]}>
                  {currentDebate.isPublic ? 'Öffentlich' : 'Privat'}
                </Text>
                <Text style={[styles.visibilityDescription, { color: colors.textSecondary }]}>
                  {currentDebate.isPublic 
                    ? 'Diese Debatte ist für alle sichtbar'
                    : 'Nur eingeladene Teilnehmer können diese Debatte sehen'}
                </Text>
              </View>
              <Switch
                value={currentDebate.isPublic}
                onValueChange={(value) => {
                  updateDebate(currentDebate.id, { isPublic: value });
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Tags Section */}
          <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingsSectionHeader}>
              <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Tags</Text>
            </View>
            <Text style={[styles.settingsHint, { color: colors.textSecondary }]}>
              Fügen Sie Tags hinzu, um Ihre Debatte leichter auffindbar zu machen.
            </Text>
            
            {/* Tag Input */}
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[
                  styles.tagInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Tag hinzufügen (z.B. politik)"
                placeholderTextColor={colors.textSecondary}
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity
                style={[
                  styles.addTagButton,
                  { backgroundColor: colors.primary },
                  !newTag.trim() && { opacity: 0.5 },
                ]}
                onPress={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Existing Tags */}
            {editTags.length > 0 && (
              <View style={styles.tagsContainer}>
                {editTags.map((tag) => (
                  <View 
                    key={tag} 
                    style={[styles.tagChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                  >
                    <Text style={[styles.tagChipText, { color: colors.primary }]}>#{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                      <Ionicons name="close-circle" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Positions Section */}
          <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingsSectionHeader}>
              <Ionicons name="flag-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Positionen</Text>
            </View>
            <Text style={[styles.settingsHint, { color: colors.textSecondary }]}>
              Erstellen Sie Positionen für Ihre Debatte (z.B. "Pro", "Contra", etc.) und laden Sie Teilnehmer zu jeder Position ein.
            </Text>
            
            {/* Add New Position */}
            <View style={styles.addPositionContainer}>
              <TextInput
                style={[
                  styles.positionNameInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Positionsname (z.B. Pro)"
                placeholderTextColor={colors.textSecondary}
                value={newPositionName}
                onChangeText={setNewPositionName}
              />
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.colorPickerContainer}
              >
                {predefinedColors.map((color) => {
                  const isUsed = currentDebate.positions.some(p => p.color === color);
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newPositionColor === color && styles.colorOptionSelected,
                        isUsed && styles.colorOptionDisabled,
                      ]}
                      onPress={() => !isUsed && setNewPositionColor(color)}
                      disabled={isUsed}
                    >
                      {newPositionColor === color && !isUsed && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                      {isUsed && (
                        <View style={styles.colorStrikethrough} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={[
                  styles.addPositionButton,
                  { backgroundColor: colors.primary },
                  !newPositionName.trim() && { opacity: 0.5 },
                ]}
                onPress={handleAddPosition}
                disabled={!newPositionName.trim()}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addPositionButtonText}>Position hinzufügen</Text>
              </TouchableOpacity>
            </View>

            {/* Existing Positions */}
            <View style={styles.positionsList}>
              {currentDebate.positions.map((position) => (
                <View
                  key={position.id}
                  style={[
                    styles.positionCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.positionHeader}>
                    <View style={styles.positionTitleRow}>
                      <View style={[styles.positionColorDot, { backgroundColor: position.color }]} />
                      <Text style={[styles.positionName, { color: colors.text }]}>
                        {position.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removePosition(currentDebate.id, position.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  {/* Position Description */}
                  <TextInput
                    style={[
                      styles.positionDescriptionInput,
                      {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Beschreibung dieser Position (optional)"
                    placeholderTextColor={colors.textSecondary}
                    value={position.description}
                    onChangeText={(text) => 
                      updatePosition(currentDebate.id, position.id, { description: text })
                    }
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />

                  {/* Slots in this position */}
                  <View style={styles.slotsContainer}>
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
                                      <Text style={[styles.slotType, { color: colors.text }]}>
                                        {slot.participant.name}
                                      </Text>
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
                                <TouchableOpacity
                                  style={[styles.editModelButton, { backgroundColor: colors.primary + '20' }]}
                                  onPress={() => handleOpenModelSelector(position.id, slot.id, slot.aiConfig?.model || 'gpt-4')}
                                >
                                  <Ionicons name="settings-outline" size={16} color={colors.primary} />
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                          <TouchableOpacity
                            style={styles.removeSlotButton}
                            onPress={() => removeSlot(currentDebate.id, position.id, slot.id)}
                          >
                            <Ionicons name="close-circle" size={20} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                    
                    {/* Add Slot Menu */}
                    {showSlotMenu === position.id ? (
                      <View style={[styles.slotMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <TouchableOpacity
                          style={[styles.slotMenuOption, { borderBottomColor: colors.border }]}
                          onPress={() => handleAddSlot(position.id, 'open')}
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
                          onPress={() => handleAddSlot(position.id, 'invited')}
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
                          onPress={() => handleAddSlot(position.id, 'ai')}
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
                    ) : (
                      <TouchableOpacity
                        style={[styles.addSlotButton, { borderColor: position.color }]}
                        onPress={() => setShowSlotMenu(position.id)}
                      >
                        <Ionicons name="add" size={16} color={position.color} />
                        <Text style={[styles.addSlotButtonText, { color: position.color }]}>
                          Slot hinzufügen
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Start Debate Section */}
          <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingsSectionHeader}>
              <Ionicons name="rocket-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Debatte starten</Text>
            </View>
            <Text style={[styles.settingsHint, { color: colors.textSecondary }]}>
              Sobald Sie die Debatte starten, können Teilnehmer Beiträge verfassen und die Diskussion beginnt.
            </Text>
            {currentDebate.positions.length < 2 && (
              <View style={[styles.warningBox, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                <Ionicons name="warning-outline" size={18} color={colors.warning} />
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  Sie benötigen mindestens 2 Positionen, um die Debatte zu starten
                </Text>
              </View>
            )}
            {currentDebate.positions.length >= 2 && !allPositionsHaveSlots() && (
              <View style={[styles.warningBox, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                <Ionicons name="warning-outline" size={18} color={colors.warning} />
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  Jede Position muss mindestens einen Slot haben, um die Debatte zu starten
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.startButton, 
                { 
                  backgroundColor: canStartDebate() ? colors.success : colors.textSecondary,
                  opacity: canStartDebate() ? 1 : 0.5,
                }
              ]}
              onPress={handleStartDebate}
              disabled={!canStartDebate()}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Debatte jetzt starten</Text>
            </TouchableOpacity>
          </View>

          {/* Delete Debate Section - Only for creator */}
          {currentDebate.createdBy.id === currentUser.id && (
            <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.settingsSectionHeader}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Debatte löschen</Text>
              </View>
              <Text style={[styles.settingsHint, { color: colors.textSecondary }]}>
                Diese Aktion kann nicht rückgängig gemacht werden. Die Debatte wird dauerhaft gelöscht.
              </Text>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.error }]}
                onPress={handleDeleteDebate}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>Debatte löschen</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Invite Participant Modal */}
        <InviteParticipantModal
          visible={showInviteModal}
          onClose={handleCancelInvite}
          onSelectUser={handleSelectUserForInvite}
        />

        {/* AI Model Selector Modal */}
        <AiModelSelector
          visible={showModelSelector}
          currentModel={editingSlot?.currentModel || 'gpt-4'}
          onSelect={handleSelectModel}
          onClose={handleCloseModelSelector}
        />
      </View>
    );
  }

  // Render Chat View for active/completed debates
  // Show archived message if debate is archived
  if (currentDebate.status === 'archived') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={[styles.title, { color: colors.text }]}>{currentDebate.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>
                  Archiviert
                </Text>
              </View>
            </View>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {currentDebate.description}
            </Text>
          </View>
        </View>

        {/* Archived Message */}
        <View style={styles.emptyContainer}>
          <Ionicons name="archive-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Diese Debatte wurde geschlossen und archiviert
          </Text>
          <Text style={[styles.emptyMessagesSubtext, { color: colors.textSecondary, marginTop: 8 }]}>
            Erstellt von {currentDebate.createdBy.name}
          </Text>
        </View>

        {/* Invite Participant Modal */}
        <InviteParticipantModal
          visible={showInviteModal}
          onClose={handleCancelInvite}
          onSelectUser={handleSelectUserForInvite}
        />

        {/* AI Model Selector Modal */}
        <AiModelSelector
          visible={showModelSelector}
          currentModel={editingSlot?.currentModel || 'gpt-4'}
          onSelect={handleSelectModel}
          onClose={handleCloseModelSelector}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.text }]}>{currentDebate.title}</Text>
            <View style={styles.headerActions}>
              {/* Moderator Manager Button - Only for owner */}
              {currentDebate.createdBy.id === currentUser.id && (
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={handleOpenModeratorManager}
                >
                  <Ionicons name="people-outline" size={20} color="#ff6347" />
                </TouchableOpacity>
              )}
              {/* Close Debate Button - Only for owner on active/completed debates */}
              {currentDebate.createdBy.id === currentUser.id && 
               (currentDebate.status === 'active' || currentDebate.status === 'completed') && (
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={handleCloseDebate}
                >
                  <Ionicons name="archive-outline" size={20} color={colors.warning} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="person-add-outline" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {currentDebate.description}
          </Text>
          
          {/* Tags */}
          {currentDebate.tags && currentDebate.tags.length > 0 && (
            <View style={[styles.tagsContainer, { marginBottom: 8 }]}>
              {currentDebate.tags.map((tag) => (
                <View 
                  key={tag} 
                  style={[styles.tagChipSmall, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                >
                  <Text style={[styles.tagChipTextSmall, { color: colors.primary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Positions */}
          <View style={styles.participants}>
            <Ionicons name="flag" size={16} color={colors.textSecondary} />
            <Text style={[styles.participantsText, { color: colors.textSecondary }]}>
              Positionen: {currentDebate.positions.map(p => p.name).join(', ') || 'Keine Positionen'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {currentDebate.messages.length === 0 ? (
          <View style={styles.emptyMessages}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyMessagesText, { color: colors.textSecondary }]}>
              Noch keine Nachrichten
            </Text>
            <Text style={[styles.emptyMessagesSubtext, { color: colors.textSecondary }]}>
              Starten Sie die Debatte mit Ihrem ersten Beitrag
            </Text>
          </View>
        ) : (
          currentDebate.messages.map((message) => {
            const isOwn = message.userId === currentUser.id;
            const isModerator = message.isModerator === true;
            const position = !isModerator ? currentDebate.positions.find(p => p.id === message.positionId) : null;
            const moderatorColor = '#ff6347'; // rot-orangig (tomato red)
            
            // Bestimme die Farbe der Nachricht basierend auf der Position
            const messageColor = isModerator ? moderatorColor : (position?.color || colors.primary);
            
            return (
              <View
                key={message.id}
                style={[
                  styles.message,
                  isOwn && styles.ownMessage,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    { backgroundColor: messageColor },
                    isModerator && { 
                      borderWidth: 2,
                      borderColor: moderatorColor,
                    },
                  ]}
                >
                  <View style={styles.messageHeader}>
                    <Text
                      style={[
                        styles.messageSender,
                        { color: '#fff' },
                      ]}
                    >
                      {message.userName}
                    </Text>
                    {isModerator ? (
                      <View
                        style={[
                          styles.stanceBadge,
                          { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stanceText,
                            { color: '#fff' },
                          ]}
                        >
                          MODERATOR
                        </Text>
                      </View>
                    ) : position && (
                      <View
                        style={[
                          styles.stanceBadge,
                          { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stanceText,
                            { color: '#fff' },
                          ]}
                        >
                          {position.name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.messageText,
                      { color: '#fff' },
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      { color: 'rgba(255, 255, 255, 0.7)' },
                    ]}
                  >
                    {formatTimestamp(message.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <View style={[styles.typingIndicator, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={[styles.typingText, { color: colors.textSecondary }]}>
            {typingUsers.length === 1
              ? `${typingUsers[0].userName} schreibt...`
              : typingUsers.length === 2
              ? `${typingUsers[0].userName} und ${typingUsers[1].userName} schreiben...`
              : `${typingUsers[0].userName} und ${typingUsers.length - 1} weitere schreiben...`}
          </Text>
        </View>
      )}

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Geben Sie Ihren Beitrag ein..."
            placeholderTextColor={colors.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              !messageText.trim() && { opacity: 0.5 },
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Invite Participant Modal */}
      <InviteParticipantModal
        visible={showInviteModal}
        onClose={handleCancelInvite}
        onSelectUser={handleSelectUserForInvite}
      />

      {/* AI Model Selector Modal */}
      <AiModelSelector
        visible={showModelSelector}
        currentModel={editingSlot?.currentModel || 'gpt-4'}
        onSelect={handleSelectModel}
        onClose={handleCloseModelSelector}
      />

      {/* Moderator Manager Modal */}
      <ModeratorManager
        visible={showModeratorManager}
        moderators={currentDebate.moderators || []}
        currentUserId={currentUser.id}
        onClose={() => setShowModeratorManager(false)}
        onAddModerator={handleAddModeratorUser}
        onRemoveModerator={handleRemoveModeratorUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    marginRight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantsText: {
    fontSize: 13,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyMessagesText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyMessagesSubtext: {
    marginTop: 4,
    fontSize: 14,
  },
  message: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  messageSender: {
    fontSize: 13,
    fontWeight: '600',
  },
  stanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stanceText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 16,
  },
  stanceSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  stanceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  stanceButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Settings View Styles
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  settingsContainer: {
    flex: 1,
  },
  settingsContent: {
    padding: 20,
    gap: 20,
  },
  settingsSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  settingsInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  settingsTextArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  settingsHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  visibilityToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  visibilityInfo: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  visibilityDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Tag Styles
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagChipSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagChipTextSmall: {
    fontSize: 11,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantsList: {
    gap: 10,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 12,
  },
  creatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  creatorBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Position Management Styles
  addPositionContainer: {
    gap: 12,
    marginTop: 8,
  },
  positionNameInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorOptionDisabled: {
    opacity: 0.4,
  },
  colorStrikethrough: {
    position: 'absolute',
    width: 40,
    height: 2,
    backgroundColor: '#fff',
    transform: [{ rotate: '-45deg' }],
  },
  addPositionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addPositionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  positionsList: {
    gap: 12,
    marginTop: 12,
  },
  positionCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  positionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  positionColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  positionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  positionDescriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 60,
    marginBottom: 12,
  },
  // Slots Styles
  slotsContainer: {
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
});


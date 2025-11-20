import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDebate } from '../context/DebateContext';
import { Colors } from '../constants/Colors';
import { DebateMessage } from '../types';

export function DebateView() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { 
    currentDebate, 
    currentUser, 
    addMessageToDebate, 
    updateDebate,
    addPosition,
    updatePosition,
    removePosition,
    addUserToPosition,
    removeUserFromPosition 
  } = useDebate();
  const [messageText, setMessageText] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState<string | undefined>(undefined);
  
  // Settings state for pending debates
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionColor, setNewPositionColor] = useState('#3b82f6');

  // Initialize edit fields when debate changes
  React.useEffect(() => {
    if (currentDebate) {
      setEditTitle(currentDebate.title);
      setEditDescription(currentDebate.description || '');
    }
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

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage: DebateMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: messageText.trim(),
      timestamp: new Date(),
      positionId: selectedPositionId,
    };

    addMessageToDebate(currentDebate.id, newMessage);
    setMessageText('');
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveSettings = () => {
    updateDebate(currentDebate.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
    });
  };

  const handleStartDebate = () => {
    updateDebate(currentDebate.id, {
      status: 'active',
    });
  };

  const handleAddPosition = () => {
    if (!newPositionName.trim()) return;

    const newPosition = {
      id: Date.now().toString(),
      name: newPositionName.trim(),
      color: newPositionColor,
      participants: [],
    };

    addPosition(currentDebate.id, newPosition);
    setNewPositionName('');
    setNewPositionColor('#3b82f6');
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
                {predefinedColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newPositionColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewPositionColor(color)}
                  >
                    {newPositionColor === color && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
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

                  {/* Participants in this position */}
                  <View style={styles.positionParticipants}>
                    {position.participants.length === 0 ? (
                      <Text style={[styles.noParticipantsText, { color: colors.textSecondary }]}>
                        Keine Teilnehmer
                      </Text>
                    ) : (
                      position.participants.map((participant) => (
                        <View
                          key={participant.id}
                          style={[
                            styles.participantChip,
                            { backgroundColor: position.color + '20', borderColor: position.color },
                          ]}
                        >
                          <Text style={[styles.participantChipText, { color: position.color }]}>
                            {participant.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => removeUserFromPosition(currentDebate.id, position.id, participant.id)}
                          >
                            <Ionicons name="close" size={16} color={position.color} />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                    <TouchableOpacity
                      style={[styles.addParticipantButton, { borderColor: position.color }]}
                    >
                      <Ionicons name="person-add-outline" size={16} color={position.color} />
                      <Text style={[styles.addParticipantButtonText, { color: position.color }]}>
                        Einladen
                      </Text>
                    </TouchableOpacity>
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
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: colors.success }]}
              onPress={handleStartDebate}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Debatte jetzt starten</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Render Chat View for active debates
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.text }]}>{currentDebate.title}</Text>
            <View style={styles.headerActions}>
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
            const position = currentDebate.positions.find(p => p.id === message.positionId);
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
                    { backgroundColor: colors.surface },
                    isOwn && { backgroundColor: colors.primary },
                  ]}
                >
                  <View style={styles.messageHeader}>
                    <Text
                      style={[
                        styles.messageSender,
                        { color: isOwn ? '#fff' : colors.text },
                      ]}
                    >
                      {message.userName}
                    </Text>
                    {position && (
                      <View
                        style={[
                          styles.stanceBadge,
                          { backgroundColor: position.color + '30' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stanceText,
                            { color: isOwn ? '#fff' : position.color },
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
                      { color: isOwn ? '#fff' : colors.text },
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      { color: isOwn ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary },
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

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Position Selector */}
        {currentDebate.positions.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.positionSelector}
          >
            {currentDebate.positions.map((position) => (
              <TouchableOpacity
                key={position.id}
                style={[
                  styles.positionButton,
                  { borderColor: colors.border },
                  selectedPositionId === position.id && {
                    backgroundColor: position.color + '20',
                    borderColor: position.color,
                  },
                ]}
                onPress={() => setSelectedPositionId(position.id)}
              >
                <View style={[styles.positionButtonDot, { backgroundColor: position.color }]} />
                <Text
                  style={[
                    styles.positionButtonText,
                    { color: colors.textSecondary },
                    selectedPositionId === position.id && { 
                      color: position.color,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {position.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

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
  positionParticipants: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noParticipantsText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  participantChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  addParticipantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addParticipantButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Position Selector in Input Area
  positionSelector: {
    marginBottom: 12,
  },
  positionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  positionButtonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  positionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
});


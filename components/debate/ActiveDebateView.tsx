/**
 * Active/Completed debate view - chat interface
 */

import React, { useState, useEffect } from 'react';
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
import { Colors } from '../../constants/Colors';
import { Debate, DebateMessage, User } from '../../types';
import { useDebate } from '../../context/DebateContext';
import { formatTimestamp } from '../../utils/helpers';
import { ModeratorManager } from '../ModeratorManager';

interface ActiveDebateViewProps {
  debate: Debate;
  currentUser: User;
}

export function ActiveDebateView({ debate, currentUser }: ActiveDebateViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    typingUsers,
    addMessageToDebate,
    sendTypingIndicator,
    closeDebate,
    addModerator,
    removeModerator,
  } = useDebate();
  
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showModeratorManager, setShowModeratorManager] = useState(false);

  // Find the position and slot of the current user in this debate
  const getUserPositionAndSlot = () => {
    for (const position of debate.positions) {
      const slot = position.slots.find(
        s => s.participant?.id === currentUser.id
      );
      if (slot) {
        return { positionId: position.id, slotId: slot.id };
      }
    }
    return { positionId: undefined, slotId: undefined };
  };

  // Handle typing indicator with debounce
  useEffect(() => {
    if (messageText.trim() && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

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

  // Reset typing indicator when debate changes
  useEffect(() => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debate.id]);

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

    addMessageToDebate(debate.id, newMessage);
    setMessageText('');
    
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
    }
  };

  const handleCloseDebate = () => {
    if (debate.createdBy.id === currentUser.id) {
      closeDebate(debate.id);
    }
  };

  const handleAddModerator = async (user: User) => {
    try {
      await addModerator(debate.id, user);
    } catch (err: any) {
      console.error('Error adding moderator:', err);
      alert(err.message || 'Fehler beim Hinzufügen des Moderators');
    }
  };

  const handleRemoveModerator = async (userId: string) => {
    try {
      await removeModerator(debate.id, userId);
    } catch (err: any) {
      console.error('Error removing moderator:', err);
      alert(err.message || 'Fehler beim Entfernen des Moderators');
    }
  };

  const isOwner = debate.createdBy.id === currentUser.id;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.text }]}>{debate.title}</Text>
            <View style={styles.headerActions}>
              {/* Moderator Manager Button - Only for owner */}
              {isOwner && (
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => setShowModeratorManager(true)}
                >
                  <Ionicons name="people-outline" size={20} color="#ff6347" />
                </TouchableOpacity>
              )}
              {/* Close Debate Button - Only for owner on active/completed debates */}
              {isOwner && (debate.status === 'active' || debate.status === 'completed') && (
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={handleCloseDebate}
                >
                  <Ionicons name="archive-outline" size={20} color={colors.warning} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {debate.description}
          </Text>
          
          {/* Tags */}
          {debate.tags && debate.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {debate.tags.map((tag) => (
                <View 
                  key={tag} 
                  style={[styles.tagChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Positions */}
          <View style={styles.positions}>
            <Ionicons name="flag" size={16} color={colors.textSecondary} />
            <Text style={[styles.positionsText, { color: colors.textSecondary }]}>
              Positionen: {debate.positions.map(p => p.name).join(', ') || 'Keine Positionen'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {debate.messages.length === 0 ? (
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
          debate.messages.map((message) => {
            const isOwn = message.userId === currentUser.id;
            const isModerator = message.isModerator === true;
            const position = !isModerator ? debate.positions.find(p => p.id === message.positionId) : null;
            const moderatorColor = '#ff6347';
            
            // Utility-Funktion um Farben tonaler zu machen
            const makeTonal = (hexColor: string) => {
              // Konvertiere hex zu RGB
              const hex = hexColor.replace('#', '');
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              
              // Mische mit Weiß für sanftere Farbe (70% Weiß, 30% Originalfarbe)
              const mixRatio = 0.3;
              const newR = Math.round(r * mixRatio + 255 * (1 - mixRatio));
              const newG = Math.round(g * mixRatio + 255 * (1 - mixRatio));
              const newB = Math.round(b * mixRatio + 255 * (1 - mixRatio));
              
              return `rgb(${newR}, ${newG}, ${newB})`;
            };
            
            // Bestimme die Farbe der Nachricht basierend auf der Position
            const baseColor = isModerator ? moderatorColor : (position?.color || colors.primary);
            const messageBackgroundColor = makeTonal(baseColor);
            const messageBorderColor = baseColor;
            
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
                    { 
                      backgroundColor: colorScheme === 'dark' ? `${baseColor}22` : messageBackgroundColor,
                      borderWidth: 1.5,
                      borderColor: colorScheme === 'dark' ? `${baseColor}66` : messageBorderColor,
                    },
                  ]}
                >
                  <View style={styles.messageHeader}>
                    <Text style={[
                      styles.messageSender,
                      { color: colorScheme === 'dark' ? colors.text : baseColor }
                    ]}>
                      {message.userName}
                    </Text>
                    {isModerator ? (
                      <View style={[
                        styles.stanceBadge,
                        { backgroundColor: colorScheme === 'dark' ? `${baseColor}44` : baseColor }
                      ]}>
                        <Text style={[
                          styles.stanceText,
                          { color: colorScheme === 'dark' ? baseColor : '#fff' }
                        ]}>MODERATOR</Text>
                      </View>
                    ) : position && (
                      <View style={[
                        styles.stanceBadge,
                        { backgroundColor: colorScheme === 'dark' ? `${baseColor}44` : baseColor }
                      ]}>
                        <Text style={[
                          styles.stanceText,
                          { color: colorScheme === 'dark' ? baseColor : '#fff' }
                        ]}>
                          {position.name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.messageText,
                    { color: colorScheme === 'dark' ? colors.text : colors.text }
                  ]}>
                    {message.text}
                  </Text>
                  <Text style={[
                    styles.messageTime,
                    { color: colors.textSecondary }
                  ]}>
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

      {/* Moderator Manager Modal */}
      <ModeratorManager
        visible={showModeratorManager}
        moderators={debate.moderators || []}
        currentUserId={currentUser.id}
        onClose={() => setShowModeratorManager(false)}
        onAddModerator={handleAddModerator}
        onRemoveModerator={handleRemoveModerator}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  positions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  positionsText: {
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
});


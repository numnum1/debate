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
  const { currentDebate, currentUser, addMessageToDebate } = useDebate();
  const [messageText, setMessageText] = useState('');
  const [selectedStance, setSelectedStance] = useState<'pro' | 'contra' | 'neutral'>('neutral');

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
      stance: selectedStance,
    };

    addMessageToDebate(currentDebate.id, newMessage);
    setMessageText('');
    setSelectedStance('neutral');
  };

  const getStanceColor = (stance: DebateMessage['stance']) => {
    switch (stance) {
      case 'pro': return colors.success;
      case 'contra': return colors.error;
      case 'neutral': return colors.textSecondary;
    }
  };

  const getStanceLabel = (stance: DebateMessage['stance']) => {
    switch (stance) {
      case 'pro': return 'Pro';
      case 'contra': return 'Contra';
      case 'neutral': return 'Neutral';
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

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
          
          {/* Participants */}
          <View style={styles.participants}>
            <Ionicons name="people" size={16} color={colors.textSecondary} />
            <Text style={[styles.participantsText, { color: colors.textSecondary }]}>
              Teilnehmer: {currentDebate.participants.map(p => p.name).join(', ')}
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
                    <View
                      style={[
                        styles.stanceBadge,
                        { backgroundColor: getStanceColor(message.stance) + '30' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stanceText,
                          { color: isOwn ? '#fff' : getStanceColor(message.stance) },
                        ]}
                      >
                        {getStanceLabel(message.stance)}
                      </Text>
                    </View>
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
        {/* Stance Selector */}
        <View style={styles.stanceSelector}>
          {(['pro', 'contra', 'neutral'] as const).map((stance) => (
            <TouchableOpacity
              key={stance}
              style={[
                styles.stanceButton,
                { borderColor: colors.border },
                selectedStance === stance && {
                  backgroundColor: getStanceColor(stance) + '20',
                  borderColor: getStanceColor(stance),
                },
              ]}
              onPress={() => setSelectedStance(stance)}
            >
              <Text
                style={[
                  styles.stanceButtonText,
                  { color: colors.textSecondary },
                  selectedStance === stance && { 
                    color: getStanceColor(stance),
                    fontWeight: '600',
                  },
                ]}
              >
                {getStanceLabel(stance)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
});


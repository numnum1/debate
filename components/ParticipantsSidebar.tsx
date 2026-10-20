import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Debate, User } from '../types';

interface ParticipantsSidebarProps {
  debate: Debate;
  currentUserId: string;
  isModeratorOrOwner: boolean;
  onMuteParticipant: (userId: string) => void;
  onUnmuteParticipant: (userId: string) => void;
}

export function ParticipantsSidebar({ 
  debate, 
  currentUserId, 
  isModeratorOrOwner,
  onMuteParticipant,
  onUnmuteParticipant,
}: ParticipantsSidebarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Sammle alle Teilnehmer aus den Positionen
  const participants: { user: User; positionName: string; positionColor: string }[] = [];
  
  debate.positions.forEach(position => {
    position.slots.forEach(slot => {
      if (slot.participant && slot.participant.id) {
        // Prüfe ob nicht schon in der Liste (könnte theoretisch doppelt vorkommen)
        if (!participants.some(p => p.user.id === slot.participant!.id)) {
          participants.push({
            user: slot.participant,
            positionName: position.name,
            positionColor: position.color,
          });
        }
      }
    });
  });

  const isMuted = (userId: string) => {
    return debate.mutedParticipants?.includes(userId) || false;
  };

  const handleToggleMute = (userId: string) => {
    if (isMuted(userId)) {
      onUnmuteParticipant(userId);
    } else {
      onMuteParticipant(userId);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Ionicons name="people" size={20} color="#3b82f6" />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Teilnehmer
        </Text>
        <View style={[styles.badge, { backgroundColor: '#3b82f6' + '20' }]}>
          <Text style={[styles.badgeText, { color: '#3b82f6' }]}>
            {participants.length}
          </Text>
        </View>
      </View>

      {/* Participants List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {participants.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Noch keine Teilnehmer
            </Text>
          </View>
        ) : (
          participants.map((participant) => {
            const muted = isMuted(participant.user.id);
            const isCurrentUser = participant.user.id === currentUserId;
            
            return (
              <View
                key={participant.user.id}
                style={[
                  styles.participantCard,
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: colors.border,
                    opacity: muted ? 0.6 : 1,
                  },
                ]}
              >
                {/* Participant Info */}
                <View style={styles.participantInfo}>
                  <View style={[styles.avatar, { backgroundColor: participant.positionColor }]}>
                    <Text style={styles.avatarText}>
                      {participant.user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.participantDetails}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.participantName, { color: colors.text }]} numberOfLines={1}>
                        {participant.user.name}
                      </Text>
                      {isCurrentUser && (
                        <View style={[styles.youBadge, { backgroundColor: colors.primary + '20' }]}>
                          <Text style={[styles.youBadgeText, { color: colors.primary }]}>Du</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={[
                      styles.positionBadge, 
                      { backgroundColor: participant.positionColor + '22' }
                    ]}>
                      <Text style={[styles.positionText, { color: participant.positionColor }]}>
                        {participant.positionName}
                      </Text>
                    </View>
                    
                    {muted && (
                      <View style={styles.mutedIndicator}>
                        <Ionicons name="volume-mute" size={12} color="#ef4444" />
                        <Text style={[styles.mutedText, { color: '#ef4444' }]}>
                          Gemutet
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Mute Button (nur für Moderatoren/Owner und nicht für eigenen User) */}
                {isModeratorOrOwner && !isCurrentUser && (
                  <TouchableOpacity
                    style={[
                      styles.muteButton,
                      muted ? styles.muteButtonActive : styles.muteButtonInactive,
                      { 
                        backgroundColor: muted ? '#ef444422' : colors.border + '44',
                      }
                    ]}
                    onPress={() => handleToggleMute(participant.user.id)}
                  >
                    <Ionicons 
                      name={muted ? "volume-mute" : "volume-high"} 
                      size={18} 
                      color={muted ? "#ef4444" : colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    borderLeftWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  participantDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  positionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  positionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mutedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mutedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  muteButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  muteButtonInactive: {
    // Styles für unmuted state
  },
  muteButtonActive: {
    // Styles für muted state
  },
});


/**
 * Reusable debate card component for lists
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Debate } from '../../types';
import { formatDate, countParticipants } from '../../utils/helpers';
import { StatusBadge } from './StatusBadge';

interface DebateCardProps {
  debate: Debate;
  isSelected?: boolean;
  onPress: () => void;
  hasUserPendingInvitation?: boolean;
  showAcceptDecline?: boolean;
  onAccept?: (e: any) => void;
  onDecline?: (e: any) => void;
}

export function DebateCard({ 
  debate, 
  isSelected, 
  onPress,
  hasUserPendingInvitation,
  showAcceptDecline,
  onAccept,
  onDecline,
}: DebateCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && { backgroundColor: colors.primary + '15' },
        { borderBottomColor: colors.border }
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text 
          style={[
            styles.title, 
            { color: colors.text },
            isSelected && { color: colors.primary, fontWeight: '700' }
          ]} 
          numberOfLines={1}
        >
          {debate.title}
        </Text>
        <StatusBadge 
          status={debate.status} 
          debate={debate}
          hasUserPendingInvitation={hasUserPendingInvitation}
        />
      </View>
      
      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
        {debate.description}
      </Text>
      
      {showAcceptDecline && (
        <View style={styles.invitationActions}>
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.success }]}
            onPress={onAccept}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Annehmen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.declineButton, { backgroundColor: colors.error }]}
            onPress={onDecline}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Ablehnen</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.footer}>
        <View style={styles.participants}>
          <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.participantCount, { color: colors.textSecondary }]}>
            {countParticipants(debate)} Teilnehmer
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatDate(debate.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantCount: {
    fontSize: 12,
  },
  date: {
    fontSize: 12,
  },
});


/**
 * Simplified Debate View - Router for different debate states
 */

import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useDebate } from '../context/DebateContext';
import { ActiveDebateView } from './debate/ActiveDebateView';
import { ArchivedDebateView } from './debate/ArchivedDebateView';
import { PendingDebateView } from './debate/PendingDebateView';

export function DebateViewSimplified() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { currentDebate, currentUser } = useDebate();

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

  // Route to appropriate view based on debate status
  if (currentDebate.status === 'archived') {
    return <ArchivedDebateView debate={currentDebate} />;
  }

  if (currentDebate.status === 'pending' || currentDebate.status === 'awaiting_acceptance') {
    return <PendingDebateView debate={currentDebate} currentUser={currentUser} />;
  }

  // Active or completed
  return <ActiveDebateView debate={currentDebate} currentUser={currentUser} />;
}

const styles = StyleSheet.create({
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
});


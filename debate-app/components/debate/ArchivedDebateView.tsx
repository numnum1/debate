/**
 * Archived debate view - read-only display
 */

import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Debate } from '../../types';

interface ArchivedDebateViewProps {
  debate: Debate;
}

export function ArchivedDebateView({ debate }: ArchivedDebateViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.text }]}>{debate.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.textSecondary + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>
                Archiviert
              </Text>
            </View>
          </View>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {debate.description}
          </Text>
        </View>
      </View>

      {/* Archived Message */}
      <View style={styles.emptyContainer}>
        <Ionicons name="archive-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Diese Debatte wurde geschlossen und archiviert
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Erstellt von {debate.createdBy.name}
        </Text>
      </View>
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
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});


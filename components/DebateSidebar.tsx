import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useDebate } from '../context/DebateContext';
import { Debate } from '../types';

export function DebateSidebar({ onCreateNew }: { onCreateNew: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { debates, currentDebate, setCurrentDebate } = useDebate();

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const getStatusColor = (status: Debate['status']) => {
    switch (status) {
      case 'active': return colors.success;
      case 'completed': return colors.textSecondary;
      case 'pending': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: Debate['status']) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'completed': return 'Beendet';
      case 'pending': return 'Ausstehend';
      default: return status;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Debatten</Text>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={onCreateNew}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {debates.map((debate) => (
          <TouchableOpacity
            key={debate.id}
            style={[
              styles.debateItem,
              currentDebate?.id === debate.id && { backgroundColor: colors.primary + '15' },
              { borderBottomColor: colors.border }
            ]}
            onPress={() => setCurrentDebate(debate)}
          >
            <View style={styles.debateHeader}>
              <Text 
                style={[
                  styles.debateTitle, 
                  { color: colors.text },
                  currentDebate?.id === debate.id && { color: colors.primary, fontWeight: '700' }
                ]} 
                numberOfLines={1}
              >
                {debate.title}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(debate.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(debate.status) }]}>
                  {getStatusLabel(debate.status)}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.debateDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {debate.description}
            </Text>
            
            <View style={styles.debateFooter}>
              <View style={styles.participants}>
                <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.participantCount, { color: colors.textSecondary }]}>
                  {debate.participants.length} Teilnehmer
                </Text>
              </View>
              <Text style={[styles.debateDate, { color: colors.textSecondary }]}>
                {formatDate(debate.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    borderRightWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  list: {
    flex: 1,
  },
  debateItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  debateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  debateTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  debateDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  debateFooter: {
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
  debateDate: {
    fontSize: 12,
  },
});


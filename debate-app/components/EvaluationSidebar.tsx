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
import { Evaluation, Position } from '../types';

interface EvaluationSidebarProps {
  evaluations: Evaluation[];
  positions: Position[];
  onDeleteEvaluation?: (evaluationId: string) => void;
  onEditReferences?: (evaluationId: string) => void;
}

export function EvaluationSidebar({ evaluations, positions, onDeleteEvaluation, onEditReferences }: EvaluationSidebarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getPositionById = (positionId?: string) => {
    if (!positionId) return null;
    return positions.find(p => p.id === positionId);
  };

  const formatTimestamp = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '--:--';
    }
    return dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Ionicons name="ribbon" size={20} color="#8b5cf6" />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Meine Bewertungen
        </Text>
        <View style={[styles.badge, { backgroundColor: '#8b5cf6' + '20' }]}>
          <Text style={[styles.badgeText, { color: '#8b5cf6' }]}>
            {evaluations.length}
          </Text>
        </View>
      </View>

      {/* Evaluations List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {evaluations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Noch keine Bewertungen
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Verfasse deine erste Bewertung unten
            </Text>
          </View>
        ) : (
          evaluations.map((evaluation) => {
            const position = getPositionById(evaluation.positionId);
            
            return (
              <View
                key={evaluation.id}
                style={[
                  styles.evaluationCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {/* Header */}
                <View style={styles.evaluationHeader}>
                  <View style={styles.evaluationHeaderLeft}>
                    <View style={[styles.pointsBadge, { backgroundColor: '#8b5cf6' }]}>
                      <Text style={styles.pointsText}>{evaluation.points}</Text>
                    </View>
                    <Text style={[styles.evaluationTitle, { color: colors.text }]} numberOfLines={1}>
                      {evaluation.title}
                    </Text>
                  </View>
                  <View style={styles.evaluationActions}>
                    {onEditReferences && (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => onEditReferences(evaluation.id)}
                      >
                        <Ionicons name="pencil-outline" size={16} color="#8b5cf6" />
                      </TouchableOpacity>
                    )}
                    {onDeleteEvaluation && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => onDeleteEvaluation(evaluation.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Position Badge */}
                {position && (
                  <View style={styles.positionBadgeContainer}>
                    <View
                      style={[
                        styles.positionBadge,
                        { backgroundColor: position.color + '20', borderColor: position.color },
                      ]}
                    >
                      <View style={[styles.positionDot, { backgroundColor: position.color }]} />
                      <Text style={[styles.positionText, { color: position.color }]}>
                        {position.name}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Referenced Messages Count */}
                {evaluation.referencedMessageIds && evaluation.referencedMessageIds.length > 0 && (
                  <View style={styles.referencesContainer}>
                    <Ionicons name="link" size={14} color="#8b5cf6" />
                    <Text style={[styles.referencesText, { color: '#8b5cf6' }]}>
                      {evaluation.referencedMessageIds.length} {evaluation.referencedMessageIds.length === 1 ? 'Nachricht' : 'Nachrichten'} referenziert
                    </Text>
                  </View>
                )}

                {/* Comment */}
                <Text style={[styles.evaluationComment, { color: colors.textSecondary }]} numberOfLines={3}>
                  {evaluation.comment}
                </Text>

                {/* Timestamp */}
                <Text style={[styles.evaluationTime, { color: colors.textSecondary }]}>
                  {formatTimestamp(evaluation.timestamp)}
                </Text>
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
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
  },
  evaluationCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  evaluationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  evaluationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pointsBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  evaluationTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  evaluationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  referencesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  referencesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  positionBadgeContainer: {
    marginBottom: 8,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  positionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  positionText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  evaluationComment: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  evaluationTime: {
    fontSize: 11,
  },
});


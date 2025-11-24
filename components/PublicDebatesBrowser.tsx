import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Debate } from '../types';
import { api } from '../services/api';

interface PublicDebatesBrowserProps {
  visible: boolean;
  onClose: () => void;
  onSelectDebate: (debate: Debate) => void;
  currentDebates?: Debate[];
}

export function PublicDebatesBrowser({ visible, onClose, onSelectDebate, currentDebates = [] }: PublicDebatesBrowserProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [publicDebates, setPublicDebates] = useState<Debate[]>([]);
  const [filteredDebates, setFilteredDebates] = useState<Debate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if a debate is already in user's list
  const isDebateInUserList = (debateId: string) => {
    return currentDebates.some(d => d.id === debateId);
  };

  useEffect(() => {
    if (visible) {
      loadPublicDebates();
    }
  }, [visible]);

  useEffect(() => {
    // Filter debates based on search query
    // Nur öffentliche Debatten durchsuchen
    if (searchQuery.trim() === '') {
      setFilteredDebates(publicDebates);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = publicDebates.filter(debate =>
        debate.isPublic === true && (
          debate.title.toLowerCase().includes(query) ||
          debate.description.toLowerCase().includes(query) ||
          debate.createdBy.name.toLowerCase().includes(query)
        )
      );
      setFilteredDebates(filtered);
    }
  }, [searchQuery, publicDebates]);

  const loadPublicDebates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const debates = await api.getPublicDebates();
      // Extra Filterung: Nur öffentliche, nicht-archivierte Debatten anzeigen
      const publicOnly = debates.filter(debate => 
        debate.isPublic === true && debate.status !== 'archived'
      );
      setPublicDebates(publicOnly);
      setFilteredDebates(publicOnly);
    } catch (err: any) {
      console.error('Error loading public debates:', err);
      setError(err.message || 'Fehler beim Laden der öffentlichen Debatten');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Ungültiges Datum';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const getStatusColor = (status: Debate['status']) => {
    switch (status) {
      case 'active': return colors.success;
      case 'completed': return colors.primary;
      case 'pending': return colors.warning;
      case 'archived': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: Debate['status']) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'completed': return 'Beendet';
      case 'pending': return 'Noch nicht gestartet';
      case 'archived': return 'Archiviert';
      default: return status;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Öffentliche Debatten</Text>
          <TouchableOpacity onPress={loadPublicDebates} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Debatten durchsuchen..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Lade öffentliche Debatten...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadPublicDebates}
            >
              <Text style={styles.retryButtonText}>Erneut versuchen</Text>
            </TouchableOpacity>
          </View>
        ) : filteredDebates.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'Keine Debatten gefunden' : 'Keine öffentlichen Debatten verfügbar'}
            </Text>
            {searchQuery && (
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Versuchen Sie es mit anderen Suchbegriffen
              </Text>
            )}
          </View>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {filteredDebates.map((debate) => {
              const alreadyInList = isDebateInUserList(debate.id);
              return (
                <TouchableOpacity
                  key={debate.id}
                  style={[styles.debateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => onSelectDebate(debate)}
                >
                  <View style={styles.debateHeader}>
                    <Text style={[styles.debateTitle, { color: colors.text }]} numberOfLines={2}>
                      {debate.title}
                    </Text>
                    <View style={styles.statusBadgeContainer}>
                      {alreadyInList && (
                        <View style={[styles.inListBadge, { backgroundColor: colors.primary + '20' }]}>
                          <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                          <Text style={[styles.inListText, { color: colors.primary }]}>In Liste</Text>
                        </View>
                      )}
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(debate.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(debate.status) }]}>
                          {getStatusLabel(debate.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.debateDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                    {debate.description || 'Keine Beschreibung verfügbar'}
                  </Text>

                  <View style={styles.debateFooter}>
                    <View style={styles.creatorInfo}>
                      <View style={[styles.creatorAvatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.creatorAvatarText}>
                          {debate.createdBy.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.creatorName, { color: colors.text }]}>
                        {debate.createdBy.name}
                      </Text>
                    </View>

                    <View style={styles.debateMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {debate.positions.reduce((sum, pos) => sum + pos.slots.filter(s => s.participant).length, 0)}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="flag-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {debate.positions.length}
                        </Text>
                      </View>
                      <Text style={[styles.debateDate, { color: colors.textSecondary }]}>
                        {formatDate(debate.createdAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48, // Extra padding for status bar
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  debateCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  debateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  debateTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    lineHeight: 24,
  },
  statusBadgeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
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
  inListBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  inListText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  debateDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  debateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  creatorName: {
    fontSize: 13,
    fontWeight: '500',
  },
  debateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  debateDate: {
    fontSize: 12,
  },
});


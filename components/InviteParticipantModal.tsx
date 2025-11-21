import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { User } from '../types';
import { api } from '../services/api';

interface InviteParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export function InviteParticipantModal({ 
  visible, 
  onClose, 
  onSelectUser 
}: InviteParticipantModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Debug: Log when modal visibility changes
  React.useEffect(() => {
    console.log('[InviteModal] Visibility changed:', visible);
  }, [visible]);

  // Debounce search - wait 300ms after user stops typing
  useEffect(() => {
    if (!visible) {
      // Reset state when modal is closed
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
      return;
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    
    const timeoutId = setTimeout(async () => {
      try {
        console.log('[InviteModal] Searching for users with query:', searchQuery.trim());
        const results = await api.searchUsers(searchQuery.trim());
        console.log('[InviteModal] Search results:', results);
        setSearchResults(results);
        
        if (results.length === 0) {
          setError('Keine Benutzer gefunden');
        }
      } catch (err: any) {
        console.error('[InviteModal] Error searching users:', err);
        setError(err.message || 'Fehler bei der Suche');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      setIsSearching(false);
    };
  }, [searchQuery, visible]);

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    onClose();
  };

  const handleSyncUsers = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    setError(null);
    
    try {
      console.log('[InviteModal] Syncing users from Keycloak...');
      const count = await api.syncUsersFromKeycloak();
      console.log('[InviteModal] Synced users:', count);
      
      setSyncMessage(`${count} Benutzer synchronisiert`);
      
      // Automatically search again if there's a query
      if (searchQuery.trim().length >= 2) {
        const results = await api.searchUsers(searchQuery.trim());
        setSearchResults(results);
      }
    } catch (err: any) {
      console.error('[InviteModal] Error syncing users:', err);
      setError('Fehler beim Synchronisieren der Benutzer');
    } finally {
      setIsSyncing(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      onPress={() => handleSelectUser(item)}
    >
      <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.userAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Teilnehmer einladen
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Namen eingeben..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {/* Results */}
          <View style={styles.resultsContainer}>
            {searchQuery.trim().length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="person-add-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  Geben Sie einen Namen ein, um Benutzer zu suchen
                </Text>
              </View>
            )}

            {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  Mindestens 2 Zeichen eingeben
                </Text>
              </View>
            )}

            {error && !isSearching && (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  {error}
                </Text>
              </View>
            )}

            {!error && searchQuery.trim().length >= 2 && searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                style={styles.resultsList}
                showsVerticalScrollIndicator={true}
              />
            )}
          </View>

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            {syncMessage && (
              <View style={[styles.syncMessage, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.syncMessageText, { color: colors.success }]}>
                  {syncMessage}
                </Text>
              </View>
            )}
            
            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={[styles.syncButton, { backgroundColor: colors.primary, opacity: isSyncing ? 0.5 : 1 }]}
                onPress={handleSyncUsers}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="sync" size={16} color="#fff" />
                )}
                <Text style={styles.syncButtonText}>
                  {isSyncing ? 'Synchronisiere...' : 'Benutzer synchronisieren'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Abbrechen
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    margin: 16,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  resultsContainer: {
    flex: 1,
    minHeight: 200,
  },
  resultsList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  syncMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  syncMessageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footerButtons: {
    gap: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});


import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { User } from '../types';
import { InviteParticipantModal } from './InviteParticipantModal';

interface ModeratorManagerProps {
  visible: boolean;
  moderators: User[];
  currentUserId: string;
  onClose: () => void;
  onAddModerator: (user: User) => void;
  onRemoveModerator: (userId: string) => void;
}

export function ModeratorManager({
  visible,
  moderators,
  currentUserId,
  onClose,
  onAddModerator,
  onRemoveModerator,
}: ModeratorManagerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleAddModerator = () => {
    setShowInviteModal(true);
  };

  const handleSelectUser = (user: User) => {
    setShowInviteModal(false);
    
    // Check if user is already a moderator
    if (moderators.some(m => m.id === user.id)) {
      Alert.alert('Fehler', 'Dieser Benutzer ist bereits ein Moderator.');
      return;
    }
    
    onAddModerator(user);
  };

  const handleRemoveModerator = (userId: string) => {
    Alert.alert(
      'Moderator entfernen',
      'Möchten Sie diesen Moderator wirklich entfernen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: () => onRemoveModerator(userId),
        },
      ]
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Moderatoren verwalten
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                Moderatoren können an der Debatte teilnehmen, ohne eine Position zu vertreten.
                Sie haben eine rot-orangige Farbe im Chat.
              </Text>
              <Text style={[styles.descriptionText, { color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' }]}>
                Hinweis: Moderatoren dürfen nicht gleichzeitig Teilnehmer oder Juroren sein. Der Owner kann auch Moderator sein.
              </Text>
            </View>

            {/* Moderators List */}
            <ScrollView style={styles.moderatorsList}>
              {moderators.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    Noch keine Moderatoren
                  </Text>
                </View>
              ) : (
                moderators.map((moderator) => (
                  <View
                    key={moderator.id}
                    style={[styles.moderatorItem, { backgroundColor: colors.surface }]}
                  >
                    <View style={styles.moderatorInfo}>
                      <View style={[styles.avatar, { backgroundColor: '#ff6347' }]}>
                        <Text style={styles.avatarText}>
                          {moderator.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.moderatorDetails}>
                        <Text style={[styles.moderatorName, { color: colors.text }]}>
                          {moderator.name}
                        </Text>
                        <Text style={[styles.moderatorEmail, { color: colors.textSecondary }]}>
                          {moderator.email || 'Keine E-Mail'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveModerator(moderator.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Add Moderator Button */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#ff6347' }]}
              onPress={handleAddModerator}
            >
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Moderator hinzufügen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* User Selection Modal */}
      <InviteParticipantModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSelectUser={handleSelectUser}
      />
    </>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  descriptionContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  moderatorsList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
  },
  moderatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  moderatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  moderatorDetails: {
    flex: 1,
  },
  moderatorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  moderatorEmail: {
    fontSize: 13,
  },
  removeButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


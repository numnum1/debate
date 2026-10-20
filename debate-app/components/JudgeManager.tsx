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

interface JudgeManagerProps {
  visible: boolean;
  judges: User[];
  currentUserId: string;
  onClose: () => void;
  onAddJudge: (user: User) => void;
  onRemoveJudge: (userId: string) => void;
}

export function JudgeManager({
  visible,
  judges,
  currentUserId,
  onClose,
  onAddJudge,
  onRemoveJudge,
}: JudgeManagerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleAddJudge = () => {
    setShowInviteModal(true);
  };

  const handleSelectUser = (user: User) => {
    setShowInviteModal(false);
    
    // Check if user is already a judge
    if (judges.some(j => j.id === user.id)) {
      Alert.alert('Fehler', 'Dieser Benutzer ist bereits ein Juror.');
      return;
    }
    
    onAddJudge(user);
  };

  const handleRemoveJudge = (userId: string) => {
    Alert.alert(
      'Juror entfernen',
      'Möchten Sie diesen Juror wirklich entfernen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: () => onRemoveJudge(userId),
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
                Juroren verwalten
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                Juroren bewerten die Argumente in der Debatte. Sie haben eine violette Farbe im Chat.
              </Text>
              <Text style={[styles.descriptionText, { color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' }]}>
                Hinweis: Juroren dürfen nicht gleichzeitig Teilnehmer, Moderatoren oder Owner der Debatte sein.
              </Text>
            </View>

            {/* Judges List */}
            <ScrollView style={styles.judgesList}>
              {judges.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="ribbon-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    Noch keine Juroren
                  </Text>
                </View>
              ) : (
                judges.map((judge) => (
                  <View
                    key={judge.id}
                    style={[styles.judgeItem, { backgroundColor: colors.surface }]}
                  >
                    <View style={styles.judgeInfo}>
                      <View style={[styles.avatar, { backgroundColor: '#8b5cf6' }]}>
                        <Text style={styles.avatarText}>
                          {judge.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.judgeDetails}>
                        <Text style={[styles.judgeName, { color: colors.text }]}>
                          {judge.name}
                        </Text>
                        <Text style={[styles.judgeEmail, { color: colors.textSecondary }]}>
                          {judge.email || 'Keine E-Mail'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveJudge(judge.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Add Judge Button */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#8b5cf6' }]}
              onPress={handleAddJudge}
            >
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Juror hinzufügen</Text>
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
  judgesList: {
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
  judgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  judgeInfo: {
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
  judgeDetails: {
    flex: 1,
  },
  judgeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  judgeEmail: {
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


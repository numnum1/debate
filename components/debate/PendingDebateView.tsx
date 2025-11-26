/**
 * Pending debate view - setup and configuration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Debate, Position, User } from '../../types';
import { useDebate } from '../../context/DebateContext';
import { PositionManager } from './settings/PositionManager';
import { JudgeManager } from '../JudgeManager';

interface PendingDebateViewProps {
  debate: Debate;
  currentUser: User;
}

export function PendingDebateView({ debate, currentUser }: PendingDebateViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    updateDebate,
    deleteDebate,
    addPosition,
    updatePosition,
    removePosition,
    addJudge,
    removeJudge,
  } = useDebate();
  
  const [editTitle, setEditTitle] = useState(debate.title);
  const [editDescription, setEditDescription] = useState(debate.description || '');
  const [editTags, setEditTags] = useState<string[]>(debate.tags || []);
  const [newTag, setNewTag] = useState('');
  const [showJudgeManager, setShowJudgeManager] = useState(false);

  const isOwner = debate.createdBy?.id === currentUser.id;

  // Initialize edit fields when debate changes
  useEffect(() => {
    setEditTitle(debate.title);
    setEditDescription(debate.description || '');
    setEditTags(debate.tags || []);
  }, [debate.id]);

  const handleSaveSettings = () => {
    updateDebate(debate.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      tags: editTags,
    });
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !editTags.includes(trimmedTag)) {
      const updatedTags = [...editTags, trimmedTag];
      setEditTags(updatedTags);
      setNewTag('');
      updateDebate(debate.id, { tags: updatedTags });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = editTags.filter(tag => tag !== tagToRemove);
    setEditTags(updatedTags);
    updateDebate(debate.id, { tags: updatedTags });
  };

  const handleAddPosition = async (name: string, color: string) => {
    const newPosition: Position = {
      id: Date.now().toString(),
      name,
      description: '',
      color,
      slots: [],
    };

    await addPosition(debate.id, newPosition);
  };

  const handleStartDebate = () => {
    const hasInvitedSlots = debate.positions.some(position =>
      position.slots.some(slot => slot.type === 'invited')
    );

    if (!hasInvitedSlots) {
      updateDebate(debate.id, { status: 'active' });
    } else {
      const allInvitedAccepted = debate.positions
        .flatMap(position => position.slots)
        .filter(slot => slot.type === 'invited')
        .every(slot => slot.invitationAccepted === true);

      if (allInvitedAccepted) {
        updateDebate(debate.id, { status: 'active' });
      } else {
        updateDebate(debate.id, { status: 'awaiting_acceptance' });
      }
    }
  };

  const allPositionsHaveSlots = () => {
    return debate.positions.every(position => 
      position.slots && position.slots.length > 0
    );
  };

  const canStartDebate = () => {
    if (debate.positions.length < 2 || !allPositionsHaveSlots()) {
      return false;
    }

    if (debate.status === 'awaiting_acceptance') {
      const allInvitedAccepted = debate.positions
        .flatMap(position => position.slots)
        .filter(slot => slot.type === 'invited')
        .every(slot => slot.invitationAccepted === true);
      return allInvitedAccepted;
    }

    return true;
  };

  const handleDeleteDebate = () => {
    if (isOwner) {
      deleteDebate(debate.id);
    }
  };

  const handleAddJudge = async (judge: User) => {
    try {
      await addJudge(debate.id, judge);
    } catch (err) {
      console.error('Error adding judge:', err);
    }
  };

  const handleRemoveJudge = async (userId: string) => {
    try {
      await removeJudge(debate.id, userId);
    } catch (err) {
      console.error('Error removing judge:', err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.text }]}>Debatte einrichten</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: colors.warning }]}>
                Noch nicht gestartet
              </Text>
            </View>
          </View>
          {!isOwner && (
            <Text style={[styles.ownerWarning, { color: colors.textSecondary }]}>
              Nur der Ersteller kann diese Debatte bearbeiten
            </Text>
          )}
        </View>
      </View>

      {/* Settings Content */}
      <ScrollView style={styles.settingsContainer} contentContainerStyle={styles.settingsContent}>
        {/* Title Section */}
        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingsSectionHeader}>
            <Ionicons name="text-outline" size={20} color={colors.primary} />
            <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Titel</Text>
          </View>
          <TextInput
            style={[
              styles.settingsInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
              !isOwner && { opacity: 0.5 },
            ]}
            placeholder="Debattentitel"
            placeholderTextColor={colors.textSecondary}
            value={editTitle}
            onChangeText={setEditTitle}
            onBlur={handleSaveSettings}
            editable={isOwner}
          />
        </View>

        {/* Description Section */}
        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingsSectionHeader}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Beschreibung</Text>
          </View>
          <TextInput
            style={[
              styles.settingsInput,
              styles.settingsTextArea,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
              !isOwner && { opacity: 0.5 },
            ]}
            placeholder="Worum geht es in dieser Debatte?"
            placeholderTextColor={colors.textSecondary}
            value={editDescription}
            onChangeText={setEditDescription}
            onBlur={handleSaveSettings}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={isOwner}
          />
        </View>

        {/* Visibility Section */}
        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingsSectionHeader}>
            <Ionicons name="eye-outline" size={20} color={colors.primary} />
            <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Sichtbarkeit</Text>
          </View>
          <View style={styles.visibilityToggleContainer}>
            <View style={styles.visibilityInfo}>
              <Text style={[styles.visibilityLabel, { color: colors.text }]}>
                {debate.isPublic ? 'Öffentlich' : 'Privat'}
              </Text>
              <Text style={[styles.visibilityDescription, { color: colors.textSecondary }]}>
                {debate.isPublic 
                  ? 'Diese Debatte ist für alle sichtbar'
                  : 'Nur eingeladene Teilnehmer können diese Debatte sehen'}
              </Text>
            </View>
            <Switch
              value={debate.isPublic}
              onValueChange={(value) => {
                if (isOwner) updateDebate(debate.id, { isPublic: value });
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              disabled={!isOwner}
            />
          </View>
        </View>

        {/* Tags Section */}
        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingsSectionHeader}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Tags</Text>
          </View>
          <Text style={[styles.settingsHint, { color: colors.textSecondary }]}>
            Fügen Sie Tags hinzu, um Ihre Debatte leichter auffindbar zu machen.
          </Text>
          
          <View style={styles.tagInputContainer}>
            <TextInput
              style={[
                styles.tagInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
                !isOwner && { opacity: 0.5 },
              ]}
              placeholder="Tag hinzufügen (z.B. politik)"
              placeholderTextColor={colors.textSecondary}
              value={newTag}
              onChangeText={setNewTag}
              onSubmitEditing={handleAddTag}
              editable={isOwner}
            />
            <TouchableOpacity
              style={[
                styles.addTagButton,
                { backgroundColor: colors.primary },
                (!newTag.trim() || !isOwner) && { opacity: 0.5 },
              ]}
              onPress={handleAddTag}
              disabled={!newTag.trim() || !isOwner}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {editTags.length > 0 && (
            <View style={styles.tagsContainer}>
              {editTags.map((tag) => (
                <View 
                  key={tag} 
                  style={[styles.tagChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                >
                  <Text style={[styles.tagChipText, { color: colors.primary }]}>#{tag}</Text>
                  {isOwner && (
                    <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                      <Ionicons name="close-circle" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Positions Section */}
        <PositionManager
          positions={debate.positions}
          debateId={debate.id}
          isOwner={isOwner}
          onAddPosition={handleAddPosition}
          onUpdatePosition={(positionId, updates) => updatePosition(debate.id, positionId, updates)}
          onRemovePosition={(positionId) => removePosition(debate.id, positionId)}
        />

        {/* Judges Section */}
        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingsSectionHeader}>
            <Ionicons name="ribbon-outline" size={20} color="#8b5cf6" />
            <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Juroren</Text>
          </View>
          <Text style={[styles.settingsHint, { color: colors.textSecondary }]}>
            Juroren bewerten die Argumente in der Debatte. Sie haben eine violette Farbe im Chat.
            {'\n'}
            <Text style={{ fontStyle: 'italic' }}>
              Hinweis: Juroren dürfen nicht gleichzeitig Teilnehmer, Moderatoren oder Owner sein.
            </Text>
          </Text>
          
          {debate.judges && debate.judges.length > 0 ? (
            <View style={styles.judgesPreviewContainer}>
              {debate.judges.map((judge) => (
                <View 
                  key={judge.id} 
                  style={[styles.judgeChip, { backgroundColor: '#8b5cf6' + '20', borderColor: '#8b5cf6' }]}
                >
                  <Ionicons name="ribbon" size={14} color="#8b5cf6" />
                  <Text style={[styles.judgeChipText, { color: '#8b5cf6' }]}>{judge.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              Noch keine Juroren hinzugefügt
            </Text>
          )}
          
          {isOwner && (
            <TouchableOpacity
              style={[styles.manageButton, { backgroundColor: '#8b5cf6' }]}
              onPress={() => setShowJudgeManager(true)}
            >
              <Ionicons name="settings-outline" size={18} color="#fff" />
              <Text style={styles.manageButtonText}>Juroren verwalten</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Start Debate Section */}
        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingsSectionHeader}>
            <Ionicons name="rocket-outline" size={20} color={colors.primary} />
            <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Debatte starten</Text>
          </View>
          <Text style={[styles.settingsHint, { color: colors.textSecondary }]}>
            {debate.status === 'awaiting_acceptance' 
              ? 'Die Debatte wartet darauf, dass alle eingeladenen Teilnehmer die Einladung akzeptieren.'
              : 'Sobald Sie die Debatte starten, können Teilnehmer Beiträge verfassen und die Diskussion beginnt.'
            }
          </Text>
          
          {debate.positions.length < 2 && (
            <View style={[styles.warningBox, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <Ionicons name="warning-outline" size={18} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                Sie benötigen mindestens 2 Positionen, um die Debatte zu starten
              </Text>
            </View>
          )}
          
          {debate.positions.length >= 2 && !allPositionsHaveSlots() && (
            <View style={[styles.warningBox, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <Ionicons name="warning-outline" size={18} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                Jede Position muss mindestens einen Slot haben, um die Debatte zu starten
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.startButton, 
              { 
                backgroundColor: (canStartDebate() && isOwner) ? colors.success : colors.textSecondary,
                opacity: (canStartDebate() && isOwner) ? 1 : 0.5,
              }
            ]}
            onPress={handleStartDebate}
            disabled={!canStartDebate() || !isOwner}
          >
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.startButtonText}>Debatte jetzt starten</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Debate Section */}
        {isOwner && (
          <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingsSectionHeader}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Debatte löschen</Text>
            </View>
            <Text style={[styles.settingsHint, { color: colors.textSecondary }]}>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Debatte wird dauerhaft gelöscht.
            </Text>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
              onPress={handleDeleteDebate}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Debatte löschen</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Judge Manager Modal */}
      <JudgeManager
        visible={showJudgeManager}
        judges={debate.judges || []}
        currentUserId={currentUser.id}
        onClose={() => setShowJudgeManager(false)}
        onAddJudge={handleAddJudge}
        onRemoveJudge={handleRemoveJudge}
      />
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
  ownerWarning: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  settingsContainer: {
    flex: 1,
  },
  settingsContent: {
    padding: 20,
    gap: 20,
  },
  settingsSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  settingsInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  settingsTextArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  settingsHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  visibilityToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  visibilityInfo: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  visibilityDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  judgesPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  judgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  judgeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});


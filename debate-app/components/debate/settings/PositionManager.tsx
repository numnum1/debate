/**
 * Position management component for debate setup
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { Position } from '../../../types';
import { POSITION_COLORS } from '../../../utils/helpers';
import { SlotManager } from './SlotManager';

interface PositionManagerProps {
  positions: Position[];
  debateId: string;
  isOwner: boolean;
  onAddPosition: (name: string, color: string) => Promise<void>;
  onUpdatePosition: (positionId: string, updates: Partial<Position>) => Promise<void>;
  onRemovePosition: (positionId: string) => Promise<void>;
}

export function PositionManager({
  positions,
  debateId,
  isOwner,
  onAddPosition,
  onUpdatePosition,
  onRemovePosition,
}: PositionManagerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionColor, setNewPositionColor] = useState(POSITION_COLORS[0]);

  const handleAddPosition = async () => {
    if (!newPositionName.trim()) return;

    const colorExists = positions.some(
      position => position.color.toLowerCase() === newPositionColor.toLowerCase()
    );

    if (colorExists) {
      alert('Diese Farbe wird bereits von einer anderen Position verwendet. Bitte wählen Sie eine andere Farbe.');
      return;
    }

    try {
      await onAddPosition(newPositionName.trim(), newPositionColor);
      setNewPositionName('');
      setNewPositionColor(POSITION_COLORS[0]);
    } catch (error: any) {
      if (error?.message?.includes('Farbe')) {
        alert(error.message);
      }
    }
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="flag-outline" size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Positionen</Text>
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Erstellen Sie Positionen für Ihre Debatte (z.B. "Pro", "Contra", etc.) und laden Sie Teilnehmer zu jeder Position ein.
      </Text>
      
      {/* Add New Position */}
      <View style={styles.addPositionContainer}>
        <TextInput
          style={[
            styles.positionNameInput,
            {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            },
            !isOwner && { opacity: 0.5 },
          ]}
          placeholder="Positionsname (z.B. Pro)"
          placeholderTextColor={colors.textSecondary}
          value={newPositionName}
          onChangeText={setNewPositionName}
          editable={isOwner}
        />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.colorPickerContainer}
        >
          {POSITION_COLORS.map((color) => {
            const isUsed = positions.some(p => p.color === color);
            return (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  newPositionColor === color && styles.colorOptionSelected,
                  isUsed && styles.colorOptionDisabled,
                ]}
                onPress={() => !isUsed && isOwner && setNewPositionColor(color)}
                disabled={isUsed || !isOwner}
              >
                {newPositionColor === color && !isUsed && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
                {isUsed && (
                  <View style={styles.colorStrikethrough} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          style={[
            styles.addPositionButton,
            { backgroundColor: colors.primary },
            (!newPositionName.trim() || !isOwner) && { opacity: 0.5 },
          ]}
          onPress={handleAddPosition}
          disabled={!newPositionName.trim() || !isOwner}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addPositionButtonText}>Position hinzufügen</Text>
        </TouchableOpacity>
      </View>

      {/* Existing Positions */}
      <View style={styles.positionsList}>
        {positions.map((position) => (
          <View
            key={position.id}
            style={[
              styles.positionCard,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <View style={styles.positionHeader}>
              <View style={styles.positionTitleRow}>
                <View style={[styles.positionColorDot, { backgroundColor: position.color }]} />
                <Text style={[styles.positionName, { color: colors.text }]}>
                  {position.name}
                </Text>
              </View>
              {isOwner && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onRemovePosition(position.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>

            {/* Position Description */}
            <TextInput
              style={[
                styles.positionDescriptionInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
                !isOwner && { opacity: 0.5 },
              ]}
              placeholder="Beschreibung dieser Position (optional)"
              placeholderTextColor={colors.textSecondary}
              value={position.description}
              onChangeText={(text) => 
                isOwner && onUpdatePosition(position.id, { description: text })
              }
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              editable={isOwner}
            />

            {/* Slots Manager */}
            <SlotManager
              position={position}
              debateId={debateId}
              isOwner={isOwner}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  addPositionContainer: {
    gap: 12,
    marginTop: 8,
  },
  positionNameInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorOptionDisabled: {
    opacity: 0.4,
  },
  colorStrikethrough: {
    position: 'absolute',
    width: 40,
    height: 2,
    backgroundColor: '#fff',
    transform: [{ rotate: '-45deg' }],
  },
  addPositionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addPositionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  positionsList: {
    gap: 12,
    marginTop: 12,
  },
  positionCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  positionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  positionColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  positionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  positionDescriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 60,
    marginBottom: 12,
  },
});


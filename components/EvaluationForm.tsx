import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Evaluation, Position } from '../types';

interface EvaluationFormProps {
  debateId: string;
  judgeId: string;
  judgeName: string;
  positions: Position[];
  onSubmit: (evaluation: Evaluation) => void;
}

export function EvaluationForm({ debateId, judgeId, judgeName, positions, onSubmit }: EvaluationFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('');
  const [comment, setComment] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState<string | undefined>(undefined);

  const handleSubmit = () => {
    if (!title.trim() || !comment.trim() || !points.trim()) {
      return;
    }

    const pointsNum = parseInt(points, 10);
    if (isNaN(pointsNum) || pointsNum < 1 || pointsNum > 10) {
      alert('Punkte müssen zwischen 1 und 10 liegen');
      return;
    }

    const evaluation: Evaluation = {
      id: '', // Will be set by backend
      debateId,
      judgeId,
      judgeName,
      title: title.trim(),
      points: pointsNum,
      comment: comment.trim(),
      positionId: selectedPositionId,
      timestamp: new Date(),
    };

    onSubmit(evaluation);
    
    // Reset form
    setTitle('');
    setPoints('');
    setComment('');
    setSelectedPositionId(undefined);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Ionicons name="ribbon" size={20} color="#8b5cf6" />
        <Text style={[styles.headerText, { color: colors.text }]}>
          Neue Bewertung
        </Text>
      </View>

      <View style={styles.content}>
        {/* Title Input */}
        <TextInput
          style={[
            styles.titleInput,
            {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Titel der Bewertung..."
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        {/* Points and Position Row */}
        <View style={styles.row}>
          {/* Points Input */}
          <View style={styles.pointsContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Punkte (1-10)</Text>
            <TextInput
              style={[
                styles.pointsInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              value={points}
              onChangeText={setPoints}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          {/* Position Selector */}
          <View style={styles.positionContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Position (optional)</Text>
            <View style={styles.positionButtons}>
              <TouchableOpacity
                style={[
                  styles.positionButton,
                  !selectedPositionId && { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
                  { borderColor: colors.border },
                ]}
                onPress={() => setSelectedPositionId(undefined)}
              >
                <Text style={[
                  styles.positionButtonText,
                  { color: !selectedPositionId ? colors.primary : colors.textSecondary }
                ]}>
                  Alle
                </Text>
              </TouchableOpacity>
              {positions.map(position => (
                <TouchableOpacity
                  key={position.id}
                  style={[
                    styles.positionButton,
                    selectedPositionId === position.id && {
                      borderColor: position.color,
                      backgroundColor: position.color + '20',
                    },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setSelectedPositionId(position.id)}
                >
                  <View style={[styles.positionDot, { backgroundColor: position.color }]} />
                  <Text style={[
                    styles.positionButtonText,
                    { color: selectedPositionId === position.id ? position.color : colors.textSecondary }
                  ]}>
                    {position.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Comment Input */}
        <TextInput
          style={[
            styles.commentInput,
            {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Begründung und Details..."
          placeholderTextColor={colors.textSecondary}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: '#8b5cf6' },
            (!title.trim() || !comment.trim() || !points.trim()) && { opacity: 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={!title.trim() || !comment.trim() || !points.trim()}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.submitButtonText}>Bewertung speichern</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  pointsContainer: {
    flex: 0,
    minWidth: 120,
  },
  positionContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  pointsInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  positionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  positionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  positionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AiModelInfo } from '../types';
import { api } from '../services/api';
import { Colors } from '../constants/Colors';

interface AiModelSelectorProps {
  visible: boolean;
  currentModel: string;
  onSelect: (modelId: string) => void;
  onClose: () => void;
}

export function AiModelSelector({ 
  visible, 
  currentModel, 
  onSelect, 
  onClose 
}: AiModelSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [models, setModels] = useState<AiModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadModels();
    }
  }, [visible]);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const availableModels = await api.getAvailableAiModels();
      setModels(availableModels);
    } catch (err: any) {
      console.error('Error loading AI models:', err);
      setError('Fehler beim Laden der Modelle');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = (modelId: string) => {
    onSelect(modelId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              KI-Modell auswählen
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Lade Modelle...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={loadModels}
              >
                <Text style={styles.retryButtonText}>Erneut versuchen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.modelsList}>
              {models.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelCard,
                    { 
                      backgroundColor: colors.background,
                      borderColor: model.id === currentModel ? colors.primary : colors.border,
                      borderWidth: model.id === currentModel ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleSelectModel(model.id)}
                >
                  <View style={styles.modelHeader}>
                    <View style={styles.modelIcon}>
                      <Ionicons 
                        name="sparkles" 
                        size={24} 
                        color={model.id === currentModel ? colors.primary : colors.textSecondary} 
                      />
                    </View>
                    <View style={styles.modelInfo}>
                      <Text style={[styles.modelName, { color: colors.text }]}>
                        {model.name}
                      </Text>
                      <Text style={[styles.modelProvider, { color: colors.textSecondary }]}>
                        {model.provider}
                      </Text>
                    </View>
                    {model.id === currentModel && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </View>
                  <Text style={[styles.modelDescription, { color: colors.textSecondary }]}>
                    {model.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modelsList: {
    padding: 16,
  },
  modelCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  modelProvider: {
    fontSize: 13,
  },
  modelDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});


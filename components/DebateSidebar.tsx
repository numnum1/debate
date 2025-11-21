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
import { useAuth } from '../context/AuthContext';
import { useDebate } from '../context/DebateContext';
import { Debate } from '../types';

export function DebateSidebar() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { debates, currentDebate, setCurrentDebate, currentUser, addDebate } = useDebate();
  const { logout } = useAuth();

  const handleCreateNew = () => {
    const newDebate: Debate = {
      id: Date.now().toString(),
      title: 'Neue Debatte',
      description: '',
      createdBy: currentUser,
      positions: [],
      createdAt: new Date(),
      status: 'pending',
      messages: [],
    };

    addDebate(newDebate);
    setCurrentDebate(newDebate);
  };

  const formatDate = (date: Date | string) => {
    // Konvertiere String zu Date, falls nötig
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Prüfe ob das Date-Objekt gültig ist
    if (isNaN(dateObj.getTime())) {
      return 'Ungültiges Datum';
    }
    
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
      case 'completed': return colors.textSecondary;
      case 'pending': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: Debate['status']) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'completed': return 'Beendet';
      case 'pending': return 'Noch nicht gestartet';
      default: return status;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Debatten</Text>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateNew}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
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
                  {debate.positions.reduce((sum, pos) => sum + pos.slots.filter(s => s.participant).length, 0)} Teilnehmer
                </Text>
              </View>
              <Text style={[styles.debateDate, { color: colors.textSecondary }]}>
                {formatDate(debate.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* User Profile / Logout Section */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {currentUser.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {currentUser.name}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {currentUser.email}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error + '15' }]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Abmelden</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    borderRightWidth: 1,
    flexDirection: 'column',
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
  listContent: {
    paddingBottom: 8,
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
  footer: {
    borderTopWidth: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
});


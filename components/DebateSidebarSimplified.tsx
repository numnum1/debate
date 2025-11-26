/**
 * Simplified Debate Sidebar using reusable components and hooks
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Modal,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { useDebate } from '../context/DebateContext';
import { Debate } from '../types';
import { PublicDebatesBrowser } from './PublicDebatesBrowser';
import { DebateCard } from './common/DebateCard';
import { UserAvatar } from './common/UserAvatar';
import { useDebateInvitations } from '../hooks/useDebateInvitations';
import { useDebateGroups } from '../hooks/useDebateGroups';

export function DebateSidebarSimplified() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { 
    debates, 
    currentDebate, 
    setCurrentDebate, 
    currentUser, 
    addDebate, 
    deleteDebate,
  } = useDebate();
  
  const { logout } = useAuth();
  const { handleAcceptInvitation, handleDeclineInvitation, hasUserPendingInvitation } = useDebateInvitations();
  const debateGroups = useDebateGroups(debates, currentUser.id);
  
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showPublicDebates, setShowPublicDebates] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handlePlusButtonPress = () => {
    setShowActionMenu(true);
  };

  const handleCreateNew = async () => {
    setShowActionMenu(false);
    
    // Find and delete all existing pending debates created by current user
    const pendingDebates = debates.filter(d => 
      d.status === 'pending' && d.createdBy?.id === currentUser.id
    );
    
    try {
      for (const debate of pendingDebates) {
        await deleteDebate(debate.id);
      }

      const newDebate: Debate = {
        id: Date.now().toString(),
        title: 'Neue Debatte',
        description: '',
        createdBy: currentUser,
        positions: [],
        createdAt: new Date(),
        status: 'pending',
        isPublic: true,
        messages: [],
        tags: [],
      };

      const createdDebate = await addDebate(newDebate);
      setCurrentDebate(createdDebate);
    } catch (error) {
      console.error('Error creating new debate:', error);
    }
  };

  const handleBrowsePublicDebates = () => {
    setShowActionMenu(false);
    setShowPublicDebates(true);
  };

  const getStatusColor = (status: Debate['status']) => {
    switch (status) {
      case 'active': return colors.success;
      case 'completed': return colors.primary;
      case 'pending': return colors.warning;
      case 'awaiting_acceptance': return colors.info;
      case 'archived': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const renderSectionHeader = (icon: string, title: string, count: number, color: string = colors.primary) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.surface }]}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      <View style={[styles.sectionBadge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.sectionBadgeText, { color }]}>
          {count}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface, 
        borderRightColor: colors.border,
        width: isCollapsed ? 60 : 320,
      }
    ]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isCollapsed && (
          <Text style={[styles.headerTitle, { color: colors.text }]}>Debatten</Text>
        )}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {!isCollapsed && (
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={handlePlusButtonPress}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.toggleButton, { backgroundColor: colors.background }]}
            onPress={() => setIsCollapsed(!isCollapsed)}
          >
            <Ionicons 
              name={isCollapsed ? "chevron-forward" : "chevron-back"} 
              size={20} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={[styles.actionMenu, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
            <Text style={[styles.actionMenuTitle, { color: colors.text }]}>Was möchten Sie tun?</Text>
            
            <TouchableOpacity
              style={[styles.actionMenuItem, { borderBottomColor: colors.border }]}
              onPress={handleCreateNew}
            >
              <View style={[styles.actionMenuIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="create-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.actionMenuTextContainer}>
                <Text style={[styles.actionMenuItemTitle, { color: colors.text }]}>
                  Neue Debatte erstellen
                </Text>
                <Text style={[styles.actionMenuItemDescription, { color: colors.textSecondary }]}>
                  Erstellen Sie eine eigene Debatte
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={handleBrowsePublicDebates}
            >
              <View style={[styles.actionMenuIconContainer, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="search-outline" size={24} color={colors.success} />
              </View>
              <View style={styles.actionMenuTextContainer}>
                <Text style={[styles.actionMenuItemTitle, { color: colors.text }]}>
                  Öffentliche Debatten durchsuchen
                </Text>
                <Text style={[styles.actionMenuItemDescription, { color: colors.textSecondary }]}>
                  Nehmen Sie an bestehenden Debatten teil
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.background }]}
              onPress={() => setShowActionMenu(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Public Debates Browser Modal */}
      <PublicDebatesBrowser
        visible={showPublicDebates}
        onClose={() => setShowPublicDebates(false)}
        currentDebates={debates}
        onSelectDebate={(debate) => {
          setShowPublicDebates(false);
          setCurrentDebate(debate);
        }}
      />

{!isCollapsed ? (
        <>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {/* Pending Debates - shown at top without header */}
            {debateGroups.pending.length > 0 && (
              <>
                {debateGroups.pending.map(debate => (
                  <DebateCard
                    key={debate.id}
                    debate={debate}
                    isSelected={currentDebate?.id === debate.id}
                    onPress={() => setCurrentDebate(debate)}
                    hasUserPendingInvitation={hasUserPendingInvitation(debate, currentUser.id)}
                    showAcceptDecline={hasUserPendingInvitation(debate, currentUser.id)}
                    onAccept={(e) => handleAcceptInvitation(debate, e)}
                    onDecline={(e) => handleDeclineInvitation(debate, e)}
                  />
                ))}
              </>
            )}

            {/* Active Debates */}
            {debateGroups.active.length > 0 && (
              <>
                {renderSectionHeader('flame-outline', 'Laufende Debatten', debateGroups.active.length)}
                {debateGroups.active.map(debate => (
                  <DebateCard
                    key={debate.id}
                    debate={debate}
                    isSelected={currentDebate?.id === debate.id}
                    onPress={() => setCurrentDebate(debate)}
                  />
                ))}
              </>
            )}

            {/* Observer Debates */}
            {debateGroups.observer.length > 0 && (
              <>
                {renderSectionHeader('eye-outline', 'Beobachter', debateGroups.observer.length, colors.textSecondary)}
                {debateGroups.observer.map(debate => (
                  <DebateCard
                    key={debate.id}
                    debate={debate}
                    isSelected={currentDebate?.id === debate.id}
                    onPress={() => setCurrentDebate(debate)}
                  />
                ))}
              </>
            )}

            {/* Completed Debates */}
            {debateGroups.completed.length > 0 && (
              <>
                {renderSectionHeader('checkmark-circle-outline', 'Beendete Debatten', debateGroups.completed.length)}
                {debateGroups.completed.map(debate => (
                  <DebateCard
                    key={debate.id}
                    debate={debate}
                    isSelected={currentDebate?.id === debate.id}
                    onPress={() => setCurrentDebate(debate)}
                  />
                ))}
              </>
            )}

            {/* Archived Debates */}
            {debateGroups.archived.length > 0 && (
              <>
                {renderSectionHeader('archive-outline', 'Archiv', debateGroups.archived.length, colors.textSecondary)}
                {debateGroups.archived.map(debate => (
                  <DebateCard
                    key={debate.id}
                    debate={debate}
                    isSelected={currentDebate?.id === debate.id}
                    onPress={() => setCurrentDebate(debate)}
                  />
                ))}
              </>
            )}

            {/* Empty State */}
            {debates.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  Noch keine Debatten
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                  Erstelle eine neue Debatte, um zu beginnen
                </Text>
              </View>
            )}
          </ScrollView>

          {/* User Profile / Logout Section */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={styles.userInfo}>
              <UserAvatar user={currentUser} size={40} />
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
        </>
      ) : (
        <View style={styles.collapsedContent}>
          <TouchableOpacity 
            style={[styles.collapsedButton, { backgroundColor: colors.primary }]}
            onPress={handlePlusButtonPress}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
          
          {debates.length > 0 && (
            <View style={styles.collapsedDebatesList}>
              <View style={[styles.collapsedSectionDivider, { backgroundColor: colors.border }]} />
              {debates.slice(0, 10).map((debate) => (
                <TouchableOpacity
                  key={debate.id}
                  style={[
                    styles.collapsedDebateItem,
                    currentDebate?.id === debate.id && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => setCurrentDebate(debate)}
                >
                  <View style={[
                    styles.collapsedDebateDot,
                    { backgroundColor: getStatusColor(debate.status) }
                  ]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <View style={{ flex: 1 }} />
          
          <View style={[styles.collapsedFooter, { borderTopColor: colors.border }]}>
            <UserAvatar user={currentUser} size={36} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  collapsedButton: {
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
  collapsedDebatesList: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  collapsedSectionDivider: {
    width: 30,
    height: 1,
    marginBottom: 8,
  },
  collapsedDebateItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedDebateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  collapsedFooter: {
    borderTopWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionMenu: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  actionMenuTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  actionMenuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMenuTextContainer: {
    flex: 1,
  },
  actionMenuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionMenuItemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  cancelButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});


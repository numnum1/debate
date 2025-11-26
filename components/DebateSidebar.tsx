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

export function DebateSidebar() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { 
    debates, 
    currentDebate, 
    setCurrentDebate, 
    currentUser, 
    addDebate, 
    deleteDebate,
    acceptInvitation,
    declineInvitation,
    hasUserPendingInvitation,
  } = useDebate();
  const { logout } = useAuth();
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
      // Delete all pending debates created by current user
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

      // addDebate returns the created debate with the real MongoDB ID
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
      case 'completed': return colors.primary;
      case 'pending': return colors.warning;
      case 'awaiting_acceptance': return colors.info;
      case 'archived': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: Debate['status'], debate: Debate) => {
    // Check if the current user has a pending invitation
    if (status === 'awaiting_acceptance' && hasUserPendingInvitation(debate, currentUser.id)) {
      return 'Wartet auf Antwort';
    }
    
    // Check if debate is ready to start (pending + all slots filled/accepted)
    if (status === 'pending') {
      const hasAtLeast2Positions = debate.positions && debate.positions.length >= 2;
      const allPositionsHaveSlots = debate.positions?.every(pos => pos.slots && pos.slots.length > 0);
      const allInvitedAccepted = debate.positions
        ?.flatMap(pos => pos.slots)
        .filter(slot => slot.type === 'invited')
        .every(slot => slot.invitationAccepted === true);
      
      if (hasAtLeast2Positions && allPositionsHaveSlots && allInvitedAccepted) {
        return 'Bereit zum Starten';
      }
      return 'Noch nicht gestartet';
    }
    
    switch (status) {
      case 'active': return 'Aktiv';
      case 'completed': return 'Beendet';
      case 'awaiting_acceptance': return 'Warte auf Teilnehmer';
      case 'archived': return 'Archiviert';
      default: return status;
    }
  };

  // Prüft, ob der aktuelle Benutzer an einer Debatte teilnimmt
  const isParticipant = (debate: Debate) => {
    return debate.positions.some(position => 
      position.slots.some(slot => 
        slot.participant && slot.participant.id === currentUser.id
      )
    );
  };

  // Gruppiere Debatten
  const pendingDebates = debates.filter(d => 
    d.status === 'pending' || d.status === 'awaiting_acceptance'
  );
  
  const activeDebates = debates.filter(d => 
    d.status === 'active' && isParticipant(d)
  );
  
  const observerDebates = debates.filter(d => 
    d.status === 'active' && !isParticipant(d)
  );
  
  const completedDebates = debates.filter(d => 
    d.status === 'completed'
  );
  
  const archivedDebates = debates.filter(d => 
    d.status === 'archived'
  );

  // Handler für Accept/Decline buttons
  const handleAcceptInvitation = async (debate: Debate, e: any) => {
    e.stopPropagation(); // Prevent debate selection
    
    // Find the slot for current user
    for (const position of debate.positions) {
      const slot = position.slots.find(
        s => s.type === 'invited' && 
             s.participant?.id === currentUser.id && 
             s.invitationAccepted === false
      );
      if (slot) {
        try {
          await acceptInvitation(debate.id, position.id, slot.id);
        } catch (err) {
          console.error('Error accepting invitation:', err);
        }
        return;
      }
    }
  };

  const handleDeclineInvitation = async (debate: Debate, e: any) => {
    e.stopPropagation(); // Prevent debate selection
    
    // Find the slot for current user
    for (const position of debate.positions) {
      const slot = position.slots.find(
        s => s.type === 'invited' && 
             s.participant?.id === currentUser.id && 
             s.invitationAccepted === false
      );
      if (slot) {
        try {
          await declineInvitation(debate.id, position.id, slot.id);
        } catch (err) {
          console.error('Error declining invitation:', err);
        }
        return;
      }
    }
  };

  // Render-Funktion für eine einzelne Debatte
  const renderDebate = (debate: Debate) => {
    const hasPendingInvite = hasUserPendingInvitation(debate, currentUser.id);
    
    return (
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
              {getStatusLabel(debate.status, debate)}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.debateDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {debate.description}
        </Text>
        
        {hasPendingInvite && (
          <View style={styles.invitationActions}>
            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: colors.success }]}
              onPress={(e) => handleAcceptInvitation(debate, e)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Annehmen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.declineButton, { backgroundColor: colors.error }]}
              onPress={(e) => handleDeclineInvitation(debate, e)}
            >
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Ablehnen</Text>
            </TouchableOpacity>
          </View>
        )}
        
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
    );
  };

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
            {/* Noch nicht gestartete Debatten - ohne Gruppenüberschrift ganz oben */}
            {pendingDebates.length > 0 && (
              <>
                {pendingDebates.map(renderDebate)}
              </>
            )}

            {/* Laufende Debatten */}
            {activeDebates.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { backgroundColor: colors.surface }]}>
                  <Ionicons name="flame-outline" size={16} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Laufende Debatten
                  </Text>
                  <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>
                      {activeDebates.length}
                    </Text>
                  </View>
                </View>
                {activeDebates.map(renderDebate)}
              </>
            )}

            {/* Beobachter */}
            {observerDebates.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { backgroundColor: colors.surface }]}>
                  <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Beobachter
                  </Text>
                  <View style={[styles.sectionBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                    <Text style={[styles.sectionBadgeText, { color: colors.textSecondary }]}>
                      {observerDebates.length}
                    </Text>
                  </View>
                </View>
                {observerDebates.map(renderDebate)}
              </>
            )}

            {/* Beendete Debatten */}
            {completedDebates.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { backgroundColor: colors.surface }]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Beendete Debatten
                  </Text>
                  <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>
                      {completedDebates.length}
                    </Text>
                  </View>
                </View>
                {completedDebates.map(renderDebate)}
              </>
            )}

            {/* Archiv */}
            {archivedDebates.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { backgroundColor: colors.surface }]}>
                  <Ionicons name="archive-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Archiv
                  </Text>
                  <View style={[styles.sectionBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                    <Text style={[styles.sectionBadgeText, { color: colors.textSecondary }]}>
                      {archivedDebates.length}
                    </Text>
                  </View>
                </View>
                {archivedDebates.map(renderDebate)}
              </>
            )}

            {/* Keine Debatten vorhanden */}
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
            <View style={[styles.avatar, { backgroundColor: colors.primary, width: 36, height: 36 }]}>
              <Text style={[styles.avatarText, { fontSize: 16 }]}>
                {currentUser.name.charAt(0).toUpperCase()}
              </Text>
            </View>
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
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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


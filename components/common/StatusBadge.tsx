/**
 * Reusable status badge component
 */

import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Debate } from '../../types';
import { getStatusColor, getStatusLabel } from '../../utils/helpers';

interface StatusBadgeProps {
  status: Debate['status'];
  debate: Debate;
  hasUserPendingInvitation?: boolean;
}

export function StatusBadge({ status, debate, hasUserPendingInvitation }: StatusBadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const statusColor = getStatusColor(status, colors);
  const label = getStatusLabel(status, debate, hasUserPendingInvitation);
  
  return (
    <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
      <Text style={[styles.text, { color: statusColor }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});


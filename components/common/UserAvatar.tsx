/**
 * Reusable user avatar component
 */

import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { User } from '../../types';

interface UserAvatarProps {
  user: User;
  size?: number;
  backgroundColor?: string;
}

export function UserAvatar({ user, size = 40, backgroundColor }: UserAvatarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const bgColor = backgroundColor || colors.primary;
  const avatarSize = { width: size, height: size, borderRadius: size / 2 };
  const fontSize = size / 2.2;
  
  return (
    <View style={[styles.avatar, avatarSize, { backgroundColor: bgColor }]}>
      <Text style={[styles.avatarText, { fontSize }]}>
        {user.name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
});


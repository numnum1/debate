import React from 'react';
import { View, StyleSheet, useColorScheme, StatusBar } from 'react-native';
import { DebateSidebar } from '../components/DebateSidebar';
import { DebateView } from '../components/DebateView';
import { AuthScreen } from '../components/AuthScreen';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user, isLoading } = useAuth();

  // Debug-Logs
  console.log('[INDEX] Render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user?.email);

  // Show auth screen (login/register) if not authenticated
  if (!isAuthenticated) {
    console.log('[INDEX] Zeige AuthScreen');
    return <AuthScreen />;
  }

  // Show main app if authenticated
  console.log('[INDEX] Zeige Haupt-App');
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />
      
      <View style={styles.content}>
        <DebateSidebar />
        <DebateView />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
});

import React, { useState } from 'react';
import { View, StyleSheet, useColorScheme, StatusBar } from 'react-native';
import { DebateSidebar } from '../components/DebateSidebar';
import { DebateView } from '../components/DebateView';
import { CreateDebateModal } from '../components/CreateDebateModal';
import { LoginScreen } from '../components/LoginScreen';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show main app if authenticated
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />
      
      <View style={styles.content}>
        <DebateSidebar onCreateNew={() => setModalVisible(true)} />
        <DebateView />
      </View>

      <CreateDebateModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
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

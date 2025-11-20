import React, { useState } from 'react';
import { View, StyleSheet, useColorScheme, StatusBar } from 'react-native';
import { DebateSidebar } from '../components/DebateSidebar';
import { DebateView } from '../components/DebateView';
import { CreateDebateModal } from '../components/CreateDebateModal';
import { Colors } from '../constants/Colors';

export default function Index() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [modalVisible, setModalVisible] = useState(false);

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

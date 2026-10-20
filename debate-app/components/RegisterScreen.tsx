import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';

interface RegisterScreenProps {
  onBackToLogin: () => void;
}

export function RegisterScreen({ onBackToLogin }: RegisterScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { register, loginWithGoogle, isLoading } = useAuth();

  const handleRegister = async () => {
    try {
      // Keycloak Registrierung - öffnet Browser mit Keycloak Registrierungs-Seite
      await register();
    } catch (error) {
      Alert.alert('Registrierung fehlgeschlagen', (error as Error).message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch {
      Alert.alert('Google Login fehlgeschlagen', 'Bitte versuchen Sie es erneut');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToLogin}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="person-add" size={40} color="#fff" />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>Konto erstellen</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Registrieren Sie sich, um zu starten
          </Text>
        </View>

        {/* Registration Form */}
        <View style={styles.form}>
          {/* Info Text für Keycloak */}
          <View style={[styles.keycloakInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <View style={styles.keycloakInfoText}>
              <Text style={[styles.keycloakInfoTitle, { color: colors.text }]}>
                Sichere Registrierung mit Keycloak
              </Text>
              <Text style={[styles.keycloakInfoSubtext, { color: colors.textSecondary }]}>
                Sie werden zur sicheren Keycloak-Registrierungsseite weitergeleitet
              </Text>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.registerButtonText}>Registrieren</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>oder</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Register Button */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={[styles.googleButtonText, { color: colors.text }]}>
              Mit Google registrieren
            </Text>
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.loginLink}>
            <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
              Bereits registriert?{' '}
            </Text>
            <TouchableOpacity onPress={onBackToLogin} disabled={isLoading}>
              <Text style={[styles.loginLinkButton, { color: colors.primary }]}>
                Jetzt anmelden
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
    zIndex: 1,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  keycloakInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  keycloakInfoText: {
    flex: 1,
  },
  keycloakInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  keycloakInfoSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  loginLinkText: {
    fontSize: 15,
  },
  loginLinkButton: {
    fontSize: 15,
    fontWeight: '600',
  },
});


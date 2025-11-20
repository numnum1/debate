import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { DebateProvider } from "../context/DebateContext";

function AppContent() {
  const { isAuthenticated } = useAuth();

  // Only wrap with DebateProvider if user is authenticated
  if (isAuthenticated) {
    return (
      <DebateProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </DebateProvider>
    );
  }

  // Show without DebateProvider when not authenticated
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

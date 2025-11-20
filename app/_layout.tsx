import { Stack } from "expo-router";
import { DebateProvider } from "../context/DebateContext";

export default function RootLayout() {
  return (
    <DebateProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DebateProvider>
  );
}

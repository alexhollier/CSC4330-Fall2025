import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";

function RootLayoutContent() {
  const { user, loading } = useAuth();

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <AuthModal visible={!user} onClose={() => {}} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

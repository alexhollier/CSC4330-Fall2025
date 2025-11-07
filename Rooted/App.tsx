import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
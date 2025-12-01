import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from 'expo-router';
import { JSX } from 'react/jsx-runtime';

const COLORS = {
  darkGreen: '#4d7c0f',       // Deep olive green for nav background
  accent: '#2d4a0a',          // Darker green for active state (more contrast)
};

// --- Custom Tab Bar Component ---
const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const focusedRouteName = state.routes[state.index].name;

  const tabs = [
  { 
    name: 'search', 
    iconOutline: <Ionicons name="home-outline" style={styles.navIcon} />,
    iconFilled: <Ionicons name="home" style={styles.navIconActive} />
  },
  { 
    name: 'map', 
    iconOutline: <Ionicons name="map-outline" style={styles.navIcon} />,
    iconFilled: <Ionicons name="map" style={styles.navIconActive} />
  },
  { 
    name: 'camera', 
    iconOutline: <MaterialIcons name="photo-camera" style={styles.navIcon} />,
    iconFilled: <MaterialIcons name="photo-camera" style={styles.navIconActive} />
  },
  { 
    name: 'profile', 
    iconOutline: <MaterialIcons name="person-outline" style={styles.navIcon} />,
    iconFilled: <MaterialIcons name="person" style={styles.navIconActive} />
  },
];

  const NavIcon = ({ iconOutline, iconFilled, active, name }: { iconOutline: JSX.Element, iconFilled: JSX.Element, active: boolean, name: string }) => {
  const handlePress = () => {
    navigation.navigate(name as any);
  };

  return (
    <Pressable onPress={handlePress} style={styles.navButton}>
      {active ? iconFilled : iconOutline}
    </Pressable>
  );
};

  return (
  <View style={styles.bottomNav}>
    {tabs.map((tab, index) => (
      <NavIcon
        key={index}
        name={tab.name}
        iconOutline={tab.iconOutline}
        iconFilled={tab.iconFilled}
        active={focusedRouteName === tab.name}
      />
    ))}
  </View>
);
};

// --- Tabs Layout ---
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="camera" options={{ title: 'Camera' }} />
    </Tabs>
  );
}

// Styles
const styles = StyleSheet.create({
  //  Bottom Nav Bar Container
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: COLORS.darkGreen,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10,
  },
  navButton: {
  paddingHorizontal: 5,
  paddingVertical: 5,
  justifyContent: 'center',
  alignItems: 'center',
  width: 60,              // Fixed width to prevent shifting
  height: 60,             // Fixed height
},
  navIcon: {
  color: 'white',
  fontSize: 30,
},
navIconActive: {
  color: 'white',
  fontSize: 36,           // Bigger when active
},
profileIconContainer: {
  backgroundColor: '#2d4a0a',  // Darker green accent
  borderRadius: 50,
  padding: 12,
  borderWidth: 2,              // Thicker border
  borderColor: '#e8dcc8',      // Warm beige border
  shadowColor: 'black',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
  elevation: 5,
},
});
import { Tabs, useRouter } from 'expo-router';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from 'expo-router';
import { JSX } from 'react/jsx-runtime';


const COLORS = {
  darkGreen: '#4d7c0f',
};

// --- Custom Tab Bar Component ---
const CustomTabBar = ({ state }: BottomTabBarProps) => {
  const router = useRouter();
  const focusedRouteName = state.routes[state.index].name;

  const tabs = [
    { name: 'search', icon: <AntDesign name="search1" style={styles.navIcon} /> },
    { name: 'map', icon: <Ionicons name="map-outline" style={styles.navIcon} /> }, 
    { name: 'camera', icon: <MaterialIcons name="photo-camera" style={styles.navIcon} /> },
    { name: 'profile', icon: <MaterialIcons name="person" style={styles.navIcon} /> }, 
  ];

  const NavIcon = ({ icon, active, name }: { icon: JSX.Element, active: boolean, name: string }) => {
    const handlePress = () => {
        router.push(`/${name}`);
    };

    return (
        <Pressable onPress={handlePress} style={styles.navButton}>
            <View style={active ? styles.profileIconContainer : {}}>
                {icon}
            </View>
        </Pressable>
    );
  };
  
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab, index) => (
        <NavIcon
          key={index}
          name={tab.name}
          icon={tab.icon}
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
  },
  navIcon: {
    color: 'white',
    fontSize: 30,
  },
  profileIconContainer: {
    backgroundColor: '#ff6347', 
    borderRadius: 50,
    padding: 12,
    borderWidth: 1,
    borderColor: 'white',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});
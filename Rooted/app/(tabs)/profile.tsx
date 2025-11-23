import { Text, View, ScrollView, StyleSheet, SafeAreaView, Dimensions, TouchableOpacity, Alert } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Logo from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import AntDesignIcon from "react-native-vector-icons/AntDesign";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

const defaultUserData = {
  name: "User",
  hoursCompleted: 0,
  hoursGoal: 30,
  upcomingEvents: [],
  recommendedActivities: [],
  organizations: []
};

const COLORS = {
  background: '#fcfaf0',
  darkGreen: '#4d7c0f',
  cardUpcoming: '#e0c9b0',
  cardOrganizations: '#709d43',
  cardRecommended: '#d1d1d1',
  progressBarFill: '#709d43',
  progressBarEmpty: '#d1d1d1',
  textDark: '#000000',
  textLight: '#ffffff',
  signOutButton: '#ff6347',
  editButton: '#4d7c0f',
}
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    fontFamily: 'serif',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: 10,
  },

  //Hour Tracking styles
  hoursCard: {
    backgroundColor: COLORS.cardUpcoming,
    padding: 15,
    borderRadius: 25, 
    borderWidth: 1,
    borderColor: COLORS.textDark,
    alignSelf: 'center',
    marginVertical: 20, 
    width: '50%',
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hoursText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.progressBarEmpty,
    marginVertical: 15,
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.progressBarFill,
  },

  // Main Card styles
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 15,
  },
  // Base style for all content cards
  baseCard: {
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.textDark,
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.textDark,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textDark,
  },

  // Specific Card Styles
  upcomingCard: {
    flex: 1, 
    backgroundColor: COLORS.cardUpcoming,
    minHeight: 180,
  },
  recommendedCard: {
    flex: 1.5, 
    backgroundColor: COLORS.cardRecommended,
    minHeight: 220,
  },
  organizationsCard: {
    backgroundColor: COLORS.cardOrganizations,
    width: '100%',
    minHeight: 150,
  },
  orgText: {
    color: 'white',
    lineHeight: 24,
  },

  // Action Buttons Section
  actionButtonsContainer: {
    marginTop: 20,
    gap: 12,
    marginBottom: 20,
  },
  signOutButton: {
    backgroundColor: COLORS.signOutButton,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  editProfileButton: {
    backgroundColor: COLORS.editButton,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default function Index() {
  const [userData, setUserData] = useState(defaultUserData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('No authenticated user found');
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, 'UserInformation', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          
          // Parse organizations from "Name: Hours" format
          const rawOrganizations = data.Organizations || [];
          const parsedOrganizations = rawOrganizations.map((org: string) => {
            const parts = org.split(':').map((part: string) => part.trim());
            return {
              name: parts[0] || '',
              hours: parts[1] || '0/0',
            };
          });
          
          setUserData({
            name: data.name || 'User',
            hoursCompleted: data.hoursCompleted || 0,
            hoursGoal: data.hoursGoal || 30,
            upcomingEvents: data.upcomingEvents || [],
            recommendedActivities: data.recommendedActivities || [],
            organizations: parsedOrganizations,
          });
          console.log('User data loaded successfully:', data);
        } else {
          console.warn('No user document found in UserInformation collection');
          setUserData(defaultUserData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData(defaultUserData);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const progressPercentage = (userData.hoursCompleted / userData.hoursGoal) * 100;

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              await signOut(auth);
              console.log('User signed out successfully');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile functionality coming soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>

        {/* A. Top Bar & Header */}
        <View style={styles.header}>
          {/* Home Icon */}
          <Icon name="home-outline" size={30} color={COLORS.textDark} />

          {/* Logo (Using Text/Icon as placeholder for an actual image logo) */}
          <View style={styles.logoContainer}>
            <Logo name="tree-outline" size={30} color={COLORS.darkGreen} />
            <Text style={styles.logoText}>ROOTED</Text>
          </View>

          {/* This part of the image is just a blank space/greeting */}
          <View style={{ width: 30 }} /> 
        </View>

        <Text style={styles.greetingText}>Hello, {userData.name}</Text>

        {/* B. Hours Tracker */}
        <View style={styles.hoursCard}>
          <Text style={styles.hoursText}>{userData.hoursCompleted}/{userData.hoursGoal}</Text>
          <Text style={styles.hoursText}>Hours</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
        </View>


        {/* C. Main Content Cards (Upcoming & Recommended) */}
        <View style={styles.cardRow}>
          {/* Upcoming Card */}
          <View style={[styles.baseCard, styles.upcomingCard]}>
            <Text style={[styles.cardTitle, { color: COLORS.textDark }]}>Upcoming:</Text>
            {userData.upcomingEvents.map((event: any, index: number) => (
              <Text key={index} style={styles.cardText}>{event}</Text>
            ))}
          </View>

          {/* Recommended Card (Taller/Wider) */}
          <View style={[styles.baseCard, styles.recommendedCard]}>
            <Text style={[styles.cardTitle, { color: COLORS.textDark }]}>Recommended:</Text>
            {userData.recommendedActivities.map((activity: any, index: number) => (
              <Text key={index} style={styles.cardText}>{activity}</Text>
            ))}
          </View>
        </View>

        {/* D. Organizations Card */}
        <View style={[styles.baseCard, styles.organizationsCard]}>
          <Text style={[styles.cardTitle, styles.orgText]}>Organizations:</Text>
          {userData.organizations.map((org: any, index: number) => (
            <Text key={index} style={styles.orgText}>{org.name} = {org.hours} Hours</Text>
          ))}
        </View>

        {/* E. Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Sign Out Button */}
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <MaterialIcon name="logout" size={20} color={COLORS.textLight} />
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>

          {/* Edit Profile Button */}
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <MaterialIcon name="edit" size={20} color={COLORS.textLight} />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
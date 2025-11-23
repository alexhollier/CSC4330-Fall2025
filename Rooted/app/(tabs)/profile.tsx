import { Text, View, ScrollView, StyleSheet, SafeAreaView, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Logo from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import AntDesignIcon from "react-native-vector-icons/AntDesign";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const userData = {
  name: "John Doe",
  hoursCompleted: 15,
  hoursGoal: 30,
  upcomingEvents: [
    'Science Fair - March 15',
    'Math Olympiad - April 10',
    'Art Exhibition - May 5',
  ],

  recommendedActivities: [
    '5th Grade Tutoring',
    'Science Fair',
    'Community Gardening',
  ],

  organizations: [
    {name: "EDA", hours: "5/10"},
    {name: "NSBE", hours: "5/10"},
    {name: "SASE", hours: "5/10"}
  ]
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
    color: 'white', // Text inside the green card should be light
    lineHeight: 24,
  },

  
});

export default function Index() {
  const [userName, setUserName] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsSignedIn(true);
        try {
          const userDocRef = doc(db, "UserInformation", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUserName(userDocSnap.data().name);
          } else {
            setUserName("User");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserName("User");
        }
      } else {
        setIsSignedIn(false);
        setUserName(null);
      }
    });

    return unsubscribe;
  }, []);

  const progressPercentage = (userData.hoursCompleted / userData.hoursGoal) * 100;

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

        <Text style={styles.greetingText}>{isSignedIn ? `Hello, ${userName}` : "Welcome"}</Text>

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
            {userData.upcomingEvents.map((event, index) => (
              <Text key={index} style={styles.cardText}>{event}</Text>
            ))}
          </View>

          {/* Recommended Card (Taller/Wider) */}
          <View style={[styles.baseCard, styles.recommendedCard]}>
            <Text style={[styles.cardTitle, { color: COLORS.textDark }]}>Recommended:</Text>
            {userData.recommendedActivities.map((activity, index) => (
              <Text key={index} style={styles.cardText}>{activity}</Text>
            ))}
          </View>
        </View>

        {/* D. Organizations Card */}
        <View style={[styles.baseCard, styles.organizationsCard]}>
          <Text style={[styles.cardTitle, styles.orgText]}>Organizations:</Text>
          {userData.organizations.map((org, index) => (
            <Text key={index} style={styles.orgText}>{org.name} = {org.hours} Hours</Text>
          ))}
        </View>


      </ScrollView>
      
      

    </SafeAreaView>
  );
}

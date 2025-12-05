import { Text, View, ScrollView, StyleSheet, SafeAreaView, Dimensions, TouchableOpacity, Alert, Modal, TextInput, FlatList } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Logo from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import AntDesignIcon from "react-native-vector-icons/AntDesign";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const defaultUserData = {
  name: "User",
  hoursCompleted: 0,
  hoursGoal: 30,
  upcomingEvents: [] as string[],
  recommendedActivities: [] as string[],
  organizations: [] as Array<{name: string, hours: string}>
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

  // Edit Profile Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
    maxWidth: '90%',
    width: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 15,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    color: COLORS.textDark,
    fontSize: 14,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orgNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    color: COLORS.textDark,
  },
  orgHoursInput: {
    flex: 0.7,
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    color: COLORS.textDark,
  },
  deleteOrgButton: {
    backgroundColor: '#ff6347',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addOrgButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  addOrgText: {
    color: COLORS.textLight,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.darkGreen,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  modalButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.darkGreen,
  },
  optionButtonText: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: '500',
  },
});

export default function Index() {
  const [userData, setUserData] = useState(defaultUserData);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editOption, setEditOption] = useState<'name' | 'organizations' | 'password' | null>(null);
  const [editName, setEditName] = useState('');
  const [editOrganizations, setEditOrganizations] = useState<Array<{name: string, hours: string}>>([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgHours, setNewOrgHours] = useState('');
  const [saving, setSaving] = useState(false);

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
    setEditOption(null);
    setEditModalVisible(true);
  };

  const openEditOption = (option: 'name' | 'organizations' | 'password') => {
    setEditOption(option);
    if (option === 'name') {
      setEditName(userData.name);
    } else if (option === 'organizations') {
      setEditOrganizations([...userData.organizations]);
      setNewOrgName('');
      setNewOrgHours('');
    }
  };

  const addOrganization = () => {
    if (newOrgName.trim() && newOrgHours.trim()) {
      setEditOrganizations([...editOrganizations, { name: newOrgName, hours: newOrgHours }]);
      setNewOrgName('');
      setNewOrgHours('');
    } else {
      Alert.alert('Error', 'Please enter both organization name and hours');
    }
  };

  const removeOrganization = (index: number) => {
    setEditOrganizations(editOrganizations.filter((_, i) => i !== index));
  };

  const updateOrganization = (index: number, field: 'name' | 'hours', value: string) => {
    const updated = [...editOrganizations];
    updated[index][field] = value;
    setEditOrganizations(updated);
  };

  const saveName = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'UserInformation', currentUser.uid);
        await updateDoc(userDocRef, { name: editName });
        setUserData({ ...userData, name: editName });
        Alert.alert('Success', 'Name updated successfully');
        setEditModalVisible(false);
      }
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveOrganizations = async () => {
    setSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Convert organizations back to "Name: Hours" format
        const orgStrings = editOrganizations.map(org => `${org.name}: ${org.hours}`);
        
        const userDocRef = doc(db, 'UserInformation', currentUser.uid);
        await updateDoc(userDocRef, { Organizations: orgStrings });
        setUserData({ ...userData, organizations: editOrganizations });
        Alert.alert('Success', 'Organizations updated successfully');
        setEditModalVisible(false);
      }
    } catch (error) {
      console.error('Error updating organizations:', error);
      Alert.alert('Error', 'Failed to update organizations. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sendPasswordReset = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser?.email) {
        await sendPasswordResetEmail(auth, currentUser.email);
        Alert.alert('Success', 'Password reset email sent to ' + currentUser.email);
        setEditModalVisible(false);
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
    }
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

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!editOption ? (
              // Main menu
              <>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => openEditOption('name')}
                >
                  <Text style={styles.optionButtonText}>Change Name</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => openEditOption('organizations')}
                >
                  <Text style={styles.optionButtonText}>Manage Organizations</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => openEditOption('password')}
                >
                  <Text style={styles.optionButtonText}>Reset Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: COLORS.textDark }]}>Close</Text>
                </TouchableOpacity>
              </>
            ) : editOption === 'name' ? (
              // Edit name
              <>
                <Text style={styles.modalTitle}>Change Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter new name"
                  value={editName}
                  onChangeText={setEditName}
                  placeholderTextColor="#999"
                />
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={saveName}
                    disabled={saving}
                  >
                    <Text style={[styles.modalButtonText, { color: COLORS.textLight }]}>
                      {saving ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditOption(null)}
                  >
                    <Text style={[styles.modalButtonText, { color: COLORS.textDark }]}>Back</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : editOption === 'organizations' ? (
              // Edit organizations
              <>
                <Text style={styles.modalTitle}>Manage Organizations</Text>
                
                {/* Add new organization */}
                <View>
                  <TextInput
                    style={styles.orgNameInput}
                    placeholder="Organization name"
                    value={newOrgName}
                    onChangeText={setNewOrgName}
                    placeholderTextColor="#999"
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <TextInput
                      style={styles.orgHoursInput}
                      placeholder="Hours (e.g. 5/10)"
                      value={newOrgHours}
                      onChangeText={setNewOrgHours}
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                      style={styles.addOrgButton}
                      onPress={addOrganization}
                    >
                      <Text style={styles.addOrgText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* List existing organizations */}
                <ScrollView style={{ maxHeight: 150, marginBottom: 12 }}>
                  {editOrganizations.map((org, index) => (
                    <View key={index} style={styles.orgRow}>
                      <TextInput
                        style={styles.orgNameInput}
                        value={org.name}
                        onChangeText={(value) => updateOrganization(index, 'name', value)}
                        placeholderTextColor="#999"
                      />
                      <TextInput
                        style={styles.orgHoursInput}
                        value={org.hours}
                        onChangeText={(value) => updateOrganization(index, 'hours', value)}
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity
                        style={styles.deleteOrgButton}
                        onPress={() => removeOrganization(index)}
                      >
                        <MaterialIcon name="delete" size={18} color={COLORS.textLight} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={saveOrganizations}
                    disabled={saving}
                  >
                    <Text style={[styles.modalButtonText, { color: COLORS.textLight }]}>
                      {saving ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditOption(null)}
                  >
                    <Text style={[styles.modalButtonText, { color: COLORS.textDark }]}>Back</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : editOption === 'password' ? (
              // Password reset
              <>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Text style={{ fontSize: 14, color: COLORS.textDark, marginBottom: 15, textAlign: 'center' }}>
                  A password reset email will be sent to your email address.
                </Text>
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={sendPasswordReset}
                  >
                    <Text style={[styles.modalButtonText, { color: COLORS.textLight }]}>Send Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditOption(null)}
                  >
                    <Text style={[styles.modalButtonText, { color: COLORS.textDark }]}>Back</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
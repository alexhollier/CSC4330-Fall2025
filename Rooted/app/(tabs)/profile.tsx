import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Linking,
} from "react-native";
import Logo from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  collection,
  getDocs,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../contexts/AuthContext";
import Svg, { Circle } from "react-native-svg";

const COLORS = {
  background: "#fcfaf0",
  darkGreen: "#4d7c0f",
  lightGreen: "#709d43",
  card: "#e0c9b0",
  textDark: "#000000",
  textLight: "#ffffff",
  tabInactive: "#d1d1d1",
};

type FavoriteOpportunity = {
  id: string;
  title: string;
  description: string;
  email?: string;
  phone?: string;
  website?: string;
  distance?: number;
};

type Organization = {
  name: string;
  requiredHours?: number;
  totalHours: number;
  frequency?: 'weekly' | 'monthly' | 'semesterly' | 'yearly';
};

// --- New Types for Edit Logic ---
type EditMode = "add" | "remove" | "required" | "name" | null;


const UpcomingEventCard = ({ event }: { event: string }) => (
  <View style={styles.upcomingCard}>
    <Logo
      name="calendar-check"
      size={24}
      color={COLORS.lightGreen}
      style={styles.iconMarginRight}
    />
    <Text style={styles.upcomingText}>{event}</Text>
  </View>
);

const FavoriteCard = ({
  id,
  title,
  description,
  distance,
  email,
  phone,
  website,
  onRemove,
}: FavoriteOpportunity & { onRemove: (id: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const distanceText =
    distance != null ? `${distance.toFixed(1)} mi` : "Distance unavailable";

  const handleSignUp = async () => {
    if (website) {
      let url = website.startsWith("http")
        ? website
        : `https://${website}`;

      const supported = await Linking.canOpenURL(url);
      if (supported) Linking.openURL(url);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.favoriteCard,
        isExpanded && styles.cardExpanded,
      ]}
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconCircle}>
            <Logo
              name="hand-heart"
              size={24}
              color={COLORS.darkGreen}
            />
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{title}</Text>

            <View style={styles.distanceRow}>
              <Logo
                name="map-marker"
                size={14}
                color={COLORS.lightGreen}
                style={styles.iconTinyMarginRight}
              />
              <Text style={styles.distanceText}>{distanceText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          <TouchableOpacity
            onPress={() => onRemove(id)}
            style={[styles.favoriteButton, { marginRight: 8 }]}
          >
            <Logo name="heart-off" size={22} color="#ff4444" />
          </TouchableOpacity>

          <Logo
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={COLORS.darkGreen}
          />
        </View>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          <Text style={styles.descriptionLabel}>About</Text>
          <Text style={styles.cardDescription}>{description}</Text>

          {(phone || email) && (
            <View style={styles.contactSection}>
              <Text style={styles.contactLabel}>Contact</Text>

              {phone && (
                <TouchableOpacity style={styles.contactRow}>
                  <Logo
                    name="phone"
                    size={16}
                    color={COLORS.lightGreen}
                    style={styles.iconTinyMarginRight}
                  />
                  <Text
                    style={[styles.contactText, styles.contactLink]}
                  >
                    {phone}
                  </Text>
                </TouchableOpacity>
              )}

              {email && (
                <TouchableOpacity style={styles.contactRow}>
                  <Logo
                    name="email"
                    size={16}
                    color={COLORS.lightGreen}
                    style={styles.iconTinyMarginRight}
                  />
                  <Text
                    style={[styles.contactText, styles.contactLink]}
                  >
                    {email}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.signUpButton,
              !website && styles.signUpButtonDisabled,
            ]}
            disabled={!website}
            onPress={handleSignUp} // Added onPress call
          >
            <Text
              style={[
                styles.signUpButtonText,
                website && { marginRight: 8 },
              ]}
            >
              {website ? "Sign Up" : "No Website Available"}
            </Text>

            {website && (
              <Logo
                name="arrow-right"
                size={18}
                color={COLORS.textLight}
              />
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

// -------------------------------------------------------
// ORGANIZATION EDIT LOGIC (FIRESTORE)
// -------------------------------------------------------

export default function Index() {
  const { user } = useAuth();
  const navigation = useNavigation();

  // tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "favorites" | "organizations"
  >("overview");

  // favorites
  const [favoriteOpportunities, setFavoriteOpportunities] =
    useState<FavoriteOpportunity[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // organizations from Firestore
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // add organization modal
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgRequired, setNewOrgRequired] = useState("");
  const [newOrgFrequency, setNewOrgFrequency] = useState<'weekly' | 'monthly' | 'semesterly' | 'yearly'>('weekly');

  // edit-hour mode modal (The 3 options: add/remove/required)
  const [editTarget, setEditTarget] = useState<Organization | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);

  // edit-hour input modal (The text input for the number)
  const [showHourInputModal, setShowHourInputModal] = useState(false);
  const [hourInputValue, setHourInputValue] = useState("");

  // NEW: State for Edit Name Modal
  const [showNameInputModal, setShowNameInputModal] = useState(false);
  const [newNameInputValue, setNewNameInputValue] = useState("");

  // Frequency state
  const [selectedFrequency, setSelectedFrequency] = useState<'weekly' | 'monthly' | 'semesterly' | 'yearly'>('weekly');

  const hoursCompleted = 15;
  const hoursGoal = 30;
  const weeklyHours = 3;

  // -------------------------
  // FIRESTORE — load user doc
  // -------------------------

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "UserInformation", user.uid);

    const unsubscribe = onSnapshot(userDocRef, async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      // load organizations
      setOrganizations(data.organizations || []);

      // load favorites
      const favoriteIds = data.favorites || [];
      if (favoriteIds.length === 0) {
        setFavoriteOpportunities([]);
        setLoadingFavorites(false);
        return;
      }

      const oppRef = collection(db, "VolunteerOpportunity");
      const oppSnap = await getDocs(oppRef);

      const list: FavoriteOpportunity[] = [];
      oppSnap.forEach((doc) => {
        if (favoriteIds.includes(doc.id)) {
          const d = doc.data() as any;
          list.push({
            id: doc.id,
            title: d.Business,
            description: d.Description,
            phone: d.Phone,
            email: d.Email,
            website: d.Website,
          });
        }
      });

      setFavoriteOpportunities(list);
      setLoadingFavorites(false);
    });

    return () => unsubscribe();
  }, [user]);

  // -------------------------------------------------------
  // FAVORITES
  // -------------------------------------------------------

  const removeFavorite = async (id: string) => {
    if (!user) return;
    const ref = doc(db, "UserInformation", user.uid);
    await updateDoc(ref, { favorites: arrayRemove(id) });
  };

  // -------------------------------------------------------
  // ADD ORGANIZATION
  // -------------------------------------------------------

  const handleAddOrganization = async () => {
    if (!newOrgName.trim()) {
      Alert.alert("Error", "Please enter an organization name");
      return;
    }

    const required = newOrgRequired.trim();
    const parsedRequired = required ? parseInt(required) : undefined;

    if (required && (isNaN(parsedRequired!) || parsedRequired! < 0)) {
        Alert.alert("Error", "Required hours must be a non-negative number.");
        return;
    }

    const newOrg: Organization = {
      name: newOrgName.trim(),
      requiredHours: parsedRequired,
      totalHours: 0,
      frequency: newOrgFrequency,
    };

    try {
      const ref = doc(db, "UserInformation", user!.uid);
      await updateDoc(ref, {
        organizations: arrayUnion(newOrg),
      });
    } catch (err) {
      console.error("Add org error:", err);
    }

    setNewOrgName("");
    setNewOrgRequired("");
    setNewOrgFrequency('weekly');
    setShowAddOrgModal(false);
  };

  // -------------------------------------------------------
  // EDIT HOURS — open mode selection modal
  // -------------------------------------------------------

  const handleEditHours = (orgName: string) => {
    const org = organizations.find((o) => o.name === orgName);
    if (!org) return;

    // Open the mode selection modal
    setEditTarget(org);
    setEditMode(null); // Mode selection modal controls this
  };

  // -------------------------------------------------------
  // OPEN INPUT MODAL based on selected mode (Hour or Name)
  // -------------------------------------------------------

  const handleSelectEditMode = (mode: EditMode) => {
    setEditMode(mode);

    if (!editTarget) return;

    if (mode === "name") {
      // Set current name for pre-fill and open name modal
      setNewNameInputValue(editTarget.name);
      setShowNameInputModal(true);
      setEditTarget(editTarget);
      return;
    }

    // Handle Hour Edits (add/remove/required)
    setHourInputValue("");
    if (mode === 'required') {
      const required = editTarget.requiredHours !== undefined ? String(editTarget.requiredHours) : '0';
      setHourInputValue(required);
      // Set current frequency or default
      setSelectedFrequency(editTarget.frequency || 'weekly');
    } 

    // Close the mode selection modal and open the hour input modal
    setShowHourInputModal(true);
    setEditTarget(editTarget); 
  };


  // -------------------------------------------------------
  // APPLY HOURS (writes to Firestore)
  // -------------------------------------------------------

  const applyHourChange = async () => {
    if (!editTarget || !editMode || !user) return;

    const hours = parseInt(hourInputValue.trim());

    if (isNaN(hours) || hours < 0) {
      Alert.alert("Error", "Please enter a valid, non-negative number of hours.");
      return;
    }
    
    // Immediately close the input modal
    setShowHourInputModal(false);

    const updated = organizations.map((org) => {
      if (org.name !== editTarget.name) return org;

      if (editMode === "add") {
        return { ...org, totalHours: org.totalHours + hours };
      }
      if (editMode === "remove") {
        return {
          ...org,
          totalHours: Math.max(0, org.totalHours - hours),
        };
      }
      if (editMode === "required") {
        return { 
          ...org, 
          requiredHours: hours,
          frequency: selectedFrequency // Save the frequency
        };
      }

      return org;
    });

    try {
      const ref = doc(db, "UserInformation", user.uid);
      await updateDoc(ref, { organizations: updated });
    } catch (err) {
      console.error("Update org hours error:", err);
    }

    // Reset state after successful update
    setEditMode(null);
    setEditTarget(null);
    setHourInputValue("");
  };

  // -------------------------------------------------------
  // APPLY NAME CHANGE (writes to Firestore)
  // -------------------------------------------------------

  const handleEditName = async () => {
    if (!editTarget || !user) return;

    const newName = newNameInputValue.trim();

    if (!newName) {
      Alert.alert("Error", "Organization name cannot be empty.");
      return;
    }
    
    // Immediately close the input modal
    setShowNameInputModal(false);

    const updated = organizations.map((org) => {
      if (org.name !== editTarget.name) return org;

      return { ...org, name: newName };
    });

    try {
      const ref = doc(db, "UserInformation", user.uid);
      await updateDoc(ref, { organizations: updated });
    } catch (err) {
      console.error("Update org name error:", err);
    }

    // Reset state after successful update
    setEditMode(null);
    setEditTarget(null);
    setNewNameInputValue("");
  };

  // -------------------------------------------------------
  // DELETE ORG
  // -------------------------------------------------------

  const handleDeleteOrg = async (name: string) => {
  if (!user) return;

  Alert.alert(
    "Delete Organization",
    `Are you sure you want to delete "${name}"? This cannot be undone.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = organizations.filter((o) => o.name !== name);
          try {
            await updateDoc(doc(db, "UserInformation", user.uid), {
              organizations: updated,
            });
          } catch (err) {
            console.error("Delete org error:", err);
          }
        },
      },
    ]
  );
};

  // -------------------------------------------------------
  // ORGANIZATION CARD
  // -------------------------------------------------------

  const OrganizationCard = ({
    org,
    onEditHours,
    onDelete,
  }: {
    org: Organization;
    onEditHours: () => void;
    onDelete: () => void;
  }) => (
    <View style={styles.orgCard}>
      <View style={styles.orgHeader}>
        <Logo
          name="office-building"
          size={24}
          color={COLORS.darkGreen}
          style={styles.iconMarginRight}
        />

        <View style={styles.orgInfo}>
          <Text style={styles.orgName}>{org.name}</Text>

          {org.requiredHours !== undefined && (
            <Text style={styles.orgHours}>
              Required: {org.requiredHours} hours {org.frequency ? `${org.frequency}` : ''}
            </Text>
          )}
          <Text style={styles.orgHours}>
            Total: {org.totalHours} hours
          </Text>
        </View>
      </View>

      <View style={styles.orgActions}>
        <TouchableOpacity
          style={styles.editOrgButton}
          onPress={onEditHours}
        >
          <Logo name="pencil" size={20} color={COLORS.darkGreen} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteOrgButton}
          onPress={onDelete}
        >
          <Logo name="delete" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  // Determine the title and placeholder for the hour input modal
  const inputTitle = editTarget
    ? editMode === 'required' 
      ? `Set Required Hours for ${editTarget.name}`
      : editMode === 'add' 
        ? `Add Hours to ${editTarget.name}`
        : `Remove Hours from ${editTarget.name}`
    : 'Edit Hours';

  const inputPlaceholder = editMode === 'required' ? 'Required Hours' : 'Number of Hours';

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
        {/* HERO */}
        <View style={styles.heroSection}>
          <View style={styles.logoHeader}>
            <Logo
              name="tree-outline"
              size={30}
              color={COLORS.darkGreen}
              style={styles.iconMarginRight}
            />
            <Text style={styles.logoText}>ROOTED</Text>
          </View>

        </View>

        {/* TABS */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "overview" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("overview")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "overview" && styles.activeTabText,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "favorites" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("favorites")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "favorites" && styles.activeTabText,
              ]}
            >
              Favorites
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "organizations" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("organizations")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "organizations" && styles.activeTabText,
              ]}
            >
              Organizations
            </Text>
          </TouchableOpacity>
        </View>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>

            <TouchableOpacity 
            style={styles.findOpportunitiesButton}
            onPress={() => navigation.navigate('search' as never)}
            >
              <Logo
                name="magnify"
                size={24}
                color={COLORS.textLight}
                style={styles.iconMarginRight}
              />
              <Text style={styles.findOpportunitiesText}>
                Find Opportunities
              </Text>
              
            </TouchableOpacity>
          </View>
        )}

        {/* FAVORITES */}
        {activeTab === "favorites" && (
          <View style={styles.tabContent}>
            {loadingFavorites ? (
              <Text style={styles.emptyText}>Loading...</Text>
            ) : favoriteOpportunities.length > 0 ? (
              favoriteOpportunities.map((f) => (
                <View
                  key={f.id}
                  style={styles.favoriteCardContainer}
                >
                  <FavoriteCard {...f} onRemove={removeFavorite} />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Logo
                  name="heart-outline"
                  size={64}
                  color={COLORS.tabInactive}
                />
                <Text style={styles.emptyText}>No favorites yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap the heart on opportunities to save them!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ORGANIZATIONS */}
        {activeTab === "organizations" && (
          <View style={styles.tabContent}>
            {organizations.map((org, idx) => (
              <OrganizationCard
                key={idx}
                org={org}
                onEditHours={() => handleEditHours(org.name)}
                onDelete={() => handleDeleteOrg(org.name)}
              />
            ))}

            <TouchableOpacity
              style={styles.addOrgButton}
              onPress={() => setShowAddOrgModal(true)}
            >
              <Logo
                name="plus-circle"
                size={24}
                color={COLORS.textLight}
                style={styles.iconMarginRight}
              />
              <Text style={styles.addOrgButtonText}>
                Add Organization
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ADD ORG MODAL */}
      <Modal
        visible={showAddOrgModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddOrgModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Organization</Text>

            <TextInput
              style={styles.input}
              placeholder="Organization Name"
              placeholderTextColor="#999"
              value={newOrgName}
              onChangeText={setNewOrgName}
            />

            <TextInput
              style={styles.input}
              placeholder="Required Hours (optional)"
              placeholderTextColor="#999"
              value={newOrgRequired}
              onChangeText={setNewOrgRequired}
              keyboardType="numeric"
            />

            {/* Frequency Selection for Add Organization */}
            {newOrgRequired.trim() !== "" && (
              <>
                <Text style={styles.frequencyLabel}>Frequency</Text>
                <View style={styles.frequencyContainer}>
                  {(['weekly', 'monthly', 'semesterly', 'yearly'] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyPill,
                        newOrgFrequency === freq && styles.frequencyPillSelected
                      ]}
                      onPress={() => setNewOrgFrequency(freq)}
                    >
                      <Text style={[
                        styles.frequencyPillText,
                        newOrgFrequency === freq && styles.frequencyPillTextSelected
                      ]}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddOrgModal(false);
                  setNewOrgName("");
                  setNewOrgRequired("");
                  setNewOrgFrequency('weekly');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text> 
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddOrganization}
              >
                <Text style={styles.confirmButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT HOUR MODE MODAL (Add/Remove/Required/Name selection) */}
      <Modal
        visible={!!editTarget && !showHourInputModal && !showNameInputModal}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editTarget?.name}</Text>

            {/* Edit Name Option */}
            <TouchableOpacity
              style={styles.editModeButton}
              onPress={() => handleSelectEditMode("name")}
            >
              <Logo name="text" size={20} color={COLORS.darkGreen} style={styles.iconMarginRight}/>
              <Text style={styles.editModeButtonText}>Edit Name</Text>
            </TouchableOpacity>

            {/* Hour Options */}
            <TouchableOpacity
              style={styles.editModeButton}
              onPress={() => handleSelectEditMode("add")}
            >
              <Logo name="plus-circle" size={20} color={COLORS.darkGreen} style={styles.iconMarginRight}/>
              <Text style={styles.editModeButtonText}>Add Hours</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editModeButton}
              onPress={() => handleSelectEditMode("remove")}
            >
              <Logo name="minus-circle" size={20} color={COLORS.darkGreen} style={styles.iconMarginRight}/>
              <Text style={styles.editModeButtonText}>Remove Hours</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editModeButton}
              onPress={() => handleSelectEditMode("required")}
            >
              <Logo name="target" size={20} color={COLORS.darkGreen} style={styles.iconMarginRight}/>
              <Text style={styles.editModeButtonText}>Edit Required Hours</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, styles.marginTop12]}
                onPress={() => setEditTarget(null)}
            >
                <Text style={styles.cancelButtonText}>Cancel</Text> 
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT NAME INPUT MODAL */}
      <Modal
        visible={showNameInputModal && !!editTarget}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowNameInputModal(false);
          setEditTarget(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Organization Name</Text>

            <TextInput
              style={styles.input}
              placeholder="New Organization Name"
              placeholderTextColor="#999"
              value={newNameInputValue}
              onChangeText={setNewNameInputValue}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNameInputModal(false);
                  setEditTarget(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text> 
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleEditName}
              >
                <Text style={styles.confirmButtonText}>Save Name</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT HOUR INPUT MODAL (with frequency for required hours) */}
      <Modal
        visible={showHourInputModal && !!editTarget && !!editMode && editMode !== 'name'}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowHourInputModal(false);
          setEditMode(null);
          setEditTarget(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{inputTitle}</Text>

            <TextInput
              style={styles.input}
              placeholder={inputPlaceholder}
              placeholderTextColor="#999"
              value={hourInputValue}
              onChangeText={setHourInputValue}
              keyboardType="numeric"
              autoFocus={true}
            />

            {/* Frequency Selection (only for required hours) */}
            {editMode === 'required' && (
              <>
                <Text style={styles.frequencyLabel}>Frequency</Text>
                <View style={styles.frequencyContainer}>
                  {(['weekly', 'monthly', 'semesterly', 'yearly'] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyPill,
                        selectedFrequency === freq && styles.frequencyPillSelected
                      ]}
                      onPress={() => setSelectedFrequency(freq)}
                    >
                      <Text style={[
                        styles.frequencyPillText,
                        selectedFrequency === freq && styles.frequencyPillTextSelected
                      ]}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowHourInputModal(false);
                  setEditMode(null);
                  setEditTarget(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text> 
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={applyHourChange}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// -------------------------------------------------------
// STYLES
// -------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  logoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.darkGreen,
  },
  progressRingContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  progressRingSvg: {
    transform: [{ rotate: "0deg" }],
  },
  progressRingText: {
    position: "absolute",
    alignItems: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  hoursText: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.darkGreen,
  },
  hoursLabel: {
    fontSize: 14,
    color: COLORS.textDark,
    marginTop: 4,
  },
  weeklyHours: {
    fontSize: 14,
    color: COLORS.lightGreen,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tabInactive,
    marginHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.darkGreen,
  },
  tabText: {
    fontSize: 15,
    color: COLORS.tabInactive,
    fontWeight: "500",
  },
  activeTabText: {
    color: COLORS.darkGreen,
    fontWeight: "700",
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 16,
  },
  upcomingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.lightGreen,
  },
  iconMarginRight: {
    marginRight: 8,
  },
  iconTinyMarginRight: {
    marginRight: 6,
  },
  iconTinyMarginLeft: {
    marginLeft: 8,
  },
  upcomingText: {
    fontSize: 15,
    color: COLORS.textDark,
    flex: 1,
  },
  findOpportunitiesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.darkGreen,
    padding: 18,
    borderRadius: 12,
    marginTop: 24,
  },
  findOpportunitiesText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textLight,
  },
  favoriteCardContainer: {
    marginBottom: 20,
  },
  favoriteCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.lightGreen,
  },
  cardExpanded: {
    backgroundColor: "#e8d5ba",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactLink: {
    textDecorationLine: "underline",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f5f0e8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceText: {
    fontSize: 13,
    color: COLORS.lightGreen,
    fontWeight: "600",
  },
  expandedContent: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#d4c4b0",
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4a4a4a",
    marginBottom: 16,
  },
  contactSection: {
    marginBottom: 16,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  contactText: {
    fontSize: 13,
    color: "#4a4a4a",
  },
  favoriteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
  orgCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.lightGreen,
  },
  orgHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orgInfo: {
    marginLeft: 12,
    flex: 1,
  },
  orgName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  orgHours: {
    fontSize: 13,
    color: "#4a4a4a",
  },
  orgActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editOrgButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f5f0e8",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteOrgButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  addOrgButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.darkGreen,
    padding: 18,
    borderRadius: 12,
    marginTop: 24,
  },
  addOrgButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.tabInactive,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    color: COLORS.textDark,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#333333",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  confirmButton: {
    backgroundColor: COLORS.darkGreen,
  },
  confirmButtonText: {
    color: COLORS.textLight,
    fontWeight: "700",
    fontSize: 16,
  },
  signUpButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpButtonText: {
    color: COLORS.textLight,
    fontWeight: "700",
    fontSize: 15,
  },
  signUpButtonDisabled: {
    backgroundColor: "#bdb6aa",
  },
  editModeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGreen,
  },
  editModeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkGreen,
  },
  marginTop12: {
    marginTop: 12,
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 12,
    marginTop: 8,
  },
  frequencyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  frequencyPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.tabInactive,
  },
  frequencyPillSelected: {
    backgroundColor: COLORS.darkGreen,
    borderColor: COLORS.darkGreen,
  },
  frequencyPillText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textDark,
  },
  frequencyPillTextSelected: {
    color: COLORS.textLight,
    fontWeight: "600",
  },
});

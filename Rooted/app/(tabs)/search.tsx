import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Slider } from '@miblanchard/react-native-slider';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, deleteDoc, getDoc } from 'firebase/firestore'; import { db } from '../../firebaseConfig';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';



const COLORS = {
  background: '#f5f3eb',      // Soft warm off-white
  darkGreen: '#4d7c0f',       // Deep olive green
  lightGreen: '#709d43',      // Medium sage green
  card: '#e8dcc8',            // Warm beige for cards
  textDark: '#2d4a0a',        // Darker green for better text contrast
  textLight: '#ffffff',
  timeFilter: '#c9d1b8',      // Soft green-grey for slider
};

export type Opportunity = {
  id: string;
  title: string;
  description: string;
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  eventType?: 'ongoing' | 'upcoming';
  eventDate?: string;
  eventTime?: string;   // <-- ADD THIS LINE
  postedBy?: string;
  organizationName?: string;
};


// Haversine distance in miles
function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const distanceMiles = distanceKm * 0.621371;

  return distanceMiles;
}

// Geocode address to coordinates using a free API
async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

const Header = () => (
  <View style={styles.header}>
    <View style={styles.logoContainer}>
      <MaterialCommunityIcons
        name="tree-outline"
        size={35}
        color={COLORS.darkGreen}
      />
      <View>
        <Text style={styles.logoText}>ROOTED</Text>
        <Text style={styles.subLogoText}>VOLUNTEER & COMMUNITY</Text>
      </View>
    </View>
  </View>
);

// Add to OpportunityCard parameters
const OpportunityCard = ({
  id,
  title,
  description,
  distance,
  email,
  phone,
  website,
  eventDate,
  eventTime,
  postedBy,
  organizationName,
  isFavorited,
  onToggleFavorite,
  canEdit,
  onEdit,
  onDelete,
  isUpcoming,
  isAttending,
  onToggleAttendance,
  attendeeCount,
  isOrganization,
  onViewAttendees,
}: Opportunity & {
  isFavorited: boolean;
  onToggleFavorite: (id: string) => void;
  canEdit: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isUpcoming: boolean;
  isAttending: boolean;
  onToggleAttendance: (id: string) => void;
  attendeeCount: number;
  isOrganization: boolean;
  onViewAttendees: (id: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSignUp = async () => {
    if (website) {
      try {
        let url = website;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }

        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        }
      } catch (error) {
        console.error('Error opening website:', error);
      }
    }
  };

  const handlePhoneCall = async (phoneNumber: string) => {
    try {
      const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
      const url = `tel:${cleanedNumber}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening phone:', error);
    }
  };

  const handleEmail = async (emailAddress: string) => {
    try {
      const url = `mailto:${emailAddress}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening email:', error);
    }
  };

  const handleFavorite = (e: any) => {
    e.stopPropagation();
    onToggleFavorite(id);
  };


  return (
    <TouchableOpacity
      style={[styles.card, isExpanded && styles.cardExpanded]}
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="hand-heart"
              size={24}
              color={COLORS.darkGreen}
            />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{title}</Text>

            {/* Organization Name - NEW */}
            {organizationName && (
              <View style={styles.organizationRow}>
                <MaterialCommunityIcons
                  name="domain"
                  size={14}
                  color={COLORS.lightGreen}
                />
                <Text style={styles.organizationText}>
                  {organizationName}
                </Text>
              </View>
            )}

            {/* Distance Section - Only show when distance is available */}
            {distance != null && (
              <View style={styles.distanceRow}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={14}
                  color={COLORS.lightGreen}
                />
                <Text style={styles.distanceText}>{distance.toFixed(1)} mi</Text>
              </View>
            )}

            {/* Date Section */}
            {eventDate && (
              <View style={styles.dateRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={14}
                  color={COLORS.lightGreen}
                />
                <Text style={styles.dateText}>
                  {eventDate}
                  {eventTime ? ` • ${eventTime}` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
  {!isOrganization && (
    <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
      <MaterialCommunityIcons
        name={isFavorited ? "heart" : "heart-outline"}
        size={22}
        color={COLORS.lightGreen}
      />
    </TouchableOpacity>
  )}
  <MaterialCommunityIcons
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
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => handlePhoneCall(phone)}
                >
                  <MaterialCommunityIcons
                    name="phone"
                    size={16}
                    color={COLORS.lightGreen}
                  />
                  <Text style={[styles.contactText, styles.contactLink]}>{phone}</Text>
                </TouchableOpacity>
              )}
              {email && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => handleEmail(email)}
                >
                  <MaterialCommunityIcons
                    name="email"
                    size={16}
                    color={COLORS.lightGreen}
                  />
                  <Text style={[styles.contactText, styles.contactLink]}>{email}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {canEdit && (
            <View style={styles.editDeleteRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={onEdit}
              >
                <MaterialCommunityIcons name="pencil" size={18} color={COLORS.textLight} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onDelete}
              >
                <MaterialCommunityIcons name="delete" size={18} color={COLORS.textLight} />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isOrganization && (
  <TouchableOpacity
    style={styles.signUpButton}
    onPress={handleSignUp}
    disabled={!website}
  >
    <Text style={styles.signUpButtonText}>
      {website ? 'Sign Up' : 'No Website Available'}
    </Text>
    {website && (
      <MaterialCommunityIcons
        name="arrow-right"
        size={18}
        color={COLORS.textLight}
      />
    )}
  </TouchableOpacity>
)}
          {isUpcoming && !isOrganization && (
            <TouchableOpacity
              style={[
                styles.attendanceButton,
                isAttending && styles.attendanceButtonConfirmed
              ]}
              onPress={() => onToggleAttendance(id)}
            >
              <MaterialCommunityIcons
                name={isAttending ? "check-circle" : "calendar-check"}
                size={18}
                color={COLORS.textLight}
              />
              <Text style={styles.attendanceButtonText}>
                {isAttending ? 'Attendance Confirmed' : 'Confirm Attendance'}
              </Text>
            </TouchableOpacity>
          )}

          {isUpcoming && isOrganization && canEdit && (
  <TouchableOpacity
    style={styles.attendeeCountSection}
    onPress={() => onViewAttendees(id)}  // <-- Make sure this uses onViewAttendees
  >
    <MaterialCommunityIcons
      name="account-group"
      size={20}
      color={COLORS.lightGreen}
    />
    <Text style={styles.attendeeCountText}>
      {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} attending
    </Text>
    <MaterialCommunityIcons
      name="chevron-right"
      size={20}
      color={COLORS.lightGreen}
    />
  </TouchableOpacity>
)}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function SearchScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming'>('ongoing');
  const [distanceValue, setDistanceValue] = useState([5]);
  const maxDistance = distanceValue[0];

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isOrganization, setIsOrganization] = useState(false);
  const [isApprovedOrganization, setIsApprovedOrganization] = useState(false);

  // Date picker state
  // Dropdown open states
  const [openMonth, setOpenMonth] = useState(false);
  const [openDay, setOpenDay] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  const [openHour, setOpenHour] = useState(false);
  const [openMinute, setOpenMinute] = useState(false);
  const [openAmPm, setOpenAmPm] = useState(false);

  // Dropdown selected values
  const [eventMonth, setEventMonth] = useState(null);
  const [eventDay, setEventDay] = useState(null);
  const [eventYear, setEventYear] = useState(null);
  const [eventHour, setEventHour] = useState(null);
  const [eventMinute, setEventMinute] = useState(null);
  const [eventAmPm, setEventAmPm] = useState(null);
  const [attendees, setAttendees] = useState<{ [key: string]: string[] }>({});
const [showAttendeeModal, setShowAttendeeModal] = useState(false);
const [selectedOpportunityAttendees, setSelectedOpportunityAttendees] = useState<string[]>([]);
const [attendeeDetails, setAttendeeDetails] = useState<Array<{
  name: string;
  email: string;
  phone: string;
}>>([]);
const [loadingAttendees, setLoadingAttendees] = useState(false);
  

  


  // Dropdown item lists
  const monthItems = [
    { label: 'January', value: 'January' },
    { label: 'February', value: 'February' },
    { label: 'March', value: 'March' },
    { label: 'April', value: 'April' },
    { label: 'May', value: 'May' },
    { label: 'June', value: 'June' },
    { label: 'July', value: 'July' },
    { label: 'August', value: 'August' },
    { label: 'September', value: 'September' },
    { label: 'October', value: 'October' },
    { label: 'November', value: 'November' },
    { label: 'December', value: 'December' },
  ];

  const dayItems = [...Array(31)].map((_, i) => ({
    label: `${i + 1}`,
    value: `${i + 1}`,
  }));

  const yearItems = [
    { label: '2025', value: '2025' },
    { label: '2026', value: '2026' },
    { label: '2027', value: '2027' },
  ];

  const hourItems = [...Array(12)].map((_, i) => ({
    label: `${i + 1}`,
    value: `${i + 1}`,
  }));

  const minuteItems = [
    { label: '00', value: '00' },
    { label: '15', value: '15' },
    { label: '30', value: '30' },
    { label: '45', value: '45' },
  ];

  // Add this with your other state declarations

  // Add this useEffect to listen for attendee changes
  useEffect(() => {
    const colRef = collection(db, 'VolunteerOpportunity');

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const attendeeData: { [key: string]: string[] } = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.attendees) {
          attendeeData[doc.id] = data.attendees;
        }
      });
      setAttendees(attendeeData);
    });

    return () => unsubscribe();
  }, []);

  // Add this function before the return statement
  const toggleAttendance = async (opportunityId: string) => {
    if (!user) return;

    try {
      const oppDocRef = doc(db, 'VolunteerOpportunity', opportunityId);
      const oppDoc = await getDoc(oppDocRef);

      if (!oppDoc.exists()) return;

      const currentAttendees = oppDoc.data().attendees || [];

      if (currentAttendees.includes(user.uid)) {
        await updateDoc(oppDocRef, {
          attendees: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(oppDocRef, {
          attendees: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
      Alert.alert('Error', 'Failed to update attendance. Please try again.');
    }
  };



  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Post modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postEventType, setPostEventType] = useState<'ongoing' | 'upcoming'>('ongoing');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    eventDate: '',  // optional
    eventTime: '',  // optional
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

// Check if user is an organization and if they're approved - with real-time updates
useEffect(() => {
  if (!user) return;

  const userDocRef = doc(db, 'UserInformation', user.uid);

  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const isOrg = data.accountType === 'organization';
        const isApproved = data.isApproved === true;
        
        setIsOrganization(isOrg);
        setIsApprovedOrganization(isOrg && isApproved);
      }
    },
    (error) => {
      console.error('Error checking account type:', error);
    }
  );

  return () => unsubscribe();
}, [user]);

  // Get user's favorites from Firestore
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'UserInformation', user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFavorites(data.favorites || []);
        }
      },
      (error) => {
        console.error('Error fetching user favorites:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Toggle favorite in Firestore
  const toggleFavorite = async (opportunityId: string) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'UserInformation', user.uid);

      if (favorites.includes(opportunityId)) {
        await updateDoc(userDocRef, {
          favorites: arrayRemove(opportunityId)
        });
      } else {
        await updateDoc(userDocRef, {
          favorites: arrayUnion(opportunityId)
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

// Get Firestore opportunities
useEffect(() => {
  const colRef = collection(db, 'VolunteerOpportunity');

  const unsubscribe = onSnapshot(
    colRef,
    async (snapshot) => {
      const data: Opportunity[] = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => { // CHANGED: doc to docSnapshot
          const raw = docSnapshot.data() as any; // CHANGED: doc to docSnapshot

          const location =
            raw.Location &&
              typeof raw.Location.latitude === 'number' &&
              typeof raw.Location.longitude === 'number'
              ? {
                latitude: raw.Location.latitude,
                longitude: raw.Location.longitude,
              }
              : undefined;

          // Fetch organization name
          let organizationName = undefined;
          if (raw.postedBy) {
            try {
              const userDocRef = doc(db, 'UserInformation', raw.postedBy);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                const userData = userDoc.data() as any; // CHANGED: Added 'as any'
                organizationName = userData.businessName || undefined;
              }
            } catch (error) {
              console.error('Error fetching organization name:', error);
            }
          }

          return {
            id: docSnapshot.id, // CHANGED: doc to docSnapshot
            title: raw.Business ?? 'Untitled',
            description: raw.Description ?? '',
            email: raw.Email ?? '',
            phone: raw.Phone ?? '',
            fax: raw.Fax ?? '',
            website: raw.Website ?? '',
            location,
            address: raw.Address || undefined,
            eventType: raw.eventType ?? 'ongoing',
            eventDate: raw.eventDate ?? '',
            eventTime: raw.eventTime ?? '',
            postedBy: raw.postedBy ?? '',
            organizationName,
          };
        })
      );

      setOpportunities(data);
      setLoading(false);
    },
    (error) => {
      console.error('Error fetching volunteer opportunities:', error);
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, []);

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          setLocationError('Location services disabled. Using default location.');
          setUserLocation({
            latitude: 30.4515,
            longitude: -91.1871,
          });
          return;
        }

        const existing = await Location.getForegroundPermissionsAsync();
        let finalStatus = existing.status;

        if (existing.status !== 'granted') {
          const request = await Location.requestForegroundPermissionsAsync();
          finalStatus = request.status;
        }

        if (finalStatus !== 'granted') {
          setLocationError('Location permission not granted. Using default location.');
          setUserLocation({
            latitude: 30.4515,
            longitude: -91.1871,
          });
          return;
        }

        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setLocationError(null);
        } catch (err) {
          setLocationError('Current location unavailable. Using default location.');
          setUserLocation({
            latitude: 30.4515,
            longitude: -91.1871,
          });
        }
      } catch (err) {
        console.error('Unexpected error getting user location:', err);
        setLocationError('Unexpected error. Using default location.');
        setUserLocation({
          latitude: 30.4515,
          longitude: -91.1871,
        });
      }
    })();
  }, []);

  const opportunitiesWithDistance: Opportunity[] = opportunities.map((opp) => {
    if (userLocation && opp.location) {
      const distance = haversineMiles(
        userLocation.latitude,
        userLocation.longitude,
        opp.location.latitude,
        opp.location.longitude
      );
      return { ...opp, distance };
    }
    return opp;
  });

  const filteredOpportunities = opportunitiesWithDistance
    .filter((opp) => opp.eventType === activeTab)
    .filter((opp) => {
      if (opp.distance == null) return true;
      return opp.distance <= maxDistance;
    });

  const openPostModal = () => {
    setPostEventType('ongoing'); // or remove this completely later
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      eventDate: '',  // optional
      eventTime: '',  // optional
    });
    setShowPostModal(true);
  };

  const openEditModal = (opp: Opportunity) => {
    setEditingId(opp.id);

    // remove the postEventType logic completely
    // setPostEventType(opp.eventType || 'ongoing');  <-- DELETE THIS LINE

    setFormData({
      title: opp.title,
      description: opp.description,
      email: opp.email || '',
      phone: opp.phone || '',
      website: opp.website || '',
      address: '', // backend stores coords only
      eventDate: opp.eventDate || '',
      eventTime: opp.eventTime || '', // <-- ADD THIS
    });

    setShowPostModal(true);
  };


  const handleSubmitPost = async () => {
  if (!user || !formData.title || !formData.description) {
    Alert.alert('Error', 'Please fill in at least the title and description');
    return;
  }

  // Determine event type automatically
  const eventType = eventMonth && eventDay && eventYear ? 'upcoming' : 'ongoing';

  // ADD THIS VALIDATION BLOCK:
  if (eventMonth && eventDay && eventYear) {
    // Parse the selected date
    const monthIndex = monthItems.findIndex(m => m.value === eventMonth);
    const selectedDate = new Date(
      parseInt(eventYear),
      monthIndex,
      parseInt(eventDay)
    );

    // If time is specified, set it on the date
    if (eventHour && eventMinute && eventAmPm) {
      let hour = parseInt(eventHour);
      if (eventAmPm === 'PM' && hour !== 12) {
        hour += 12;
      } else if (eventAmPm === 'AM' && hour === 12) {
        hour = 0;
      }
      selectedDate.setHours(hour, parseInt(eventMinute), 0, 0);
    } else {
      // If no time specified, set to end of day to be lenient
      selectedDate.setHours(23, 59, 59, 999);
    }

    // Check if the selected date/time has passed
    const now = new Date();
    if (selectedDate < now) {
      Alert.alert(
        'Invalid Date/Time',
        'The event date and time you selected has already passed. Please choose a future date and time.'
      );
      return;
    }
  }
  // END VALIDATION BLOCK

  setSubmitting(true);

  try {
    let coordinates = null;

      if (formData.address) {
        coordinates = await geocodeAddress(formData.address);
        if (!coordinates) {
          Alert.alert('Error', 'Could not find location for the provided address. Please try a different address.');
          setSubmitting(false);
          return;
        }
      }

      const eventDate =
        eventMonth && eventDay && eventYear
          ? `${eventMonth} ${eventDay}, ${eventYear}`
          : '';

      const eventTime =
        eventHour && eventMinute && eventAmPm
          ? `${eventHour}:${eventMinute} ${eventAmPm}`
          : '';


      // Now create Firestore object
      const opportunityData = {
        Business: formData.title,
        Description: formData.description,
        Email: formData.email,
        Phone: formData.phone,
        Website: formData.website,
        Location: coordinates
          ? {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          }
          : null,
        eventType,
        eventDate,
        eventTime,
        postedBy: user.uid,
      };


      if (editingId) {
        // Update existing
        const docRef = doc(db, 'VolunteerOpportunity', editingId);
        await updateDoc(docRef, opportunityData);
        Alert.alert('Success', 'Opportunity updated successfully!');
      } else {
        // Create new
        await addDoc(collection(db, 'VolunteerOpportunity'), opportunityData);
        Alert.alert('Success', 'Opportunity posted successfully!');
      }

      setShowPostModal(false);
      setFormData({
        title: '',
        description: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        eventDate: '',  // optional
        eventTime: '',  // optional
      });
    } catch (error) {
      console.error('Error posting opportunity:', error);
      Alert.alert('Error', 'Failed to post opportunity. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  });

  return unsubscribe;
}, [navigation]);

  const handleDeleteOpportunity = async (id: string) => {
    Alert.alert(
      'Delete Opportunity',
      'Are you sure you want to delete this opportunity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'VolunteerOpportunity', id));
              Alert.alert('Success', 'Opportunity deleted successfully');
            } catch (error) {
              console.error('Error deleting opportunity:', error);
              Alert.alert('Error', 'Failed to delete opportunity');
            }
          },
        },
      ]
    );
  };

  const fetchAttendeeDetails = async (attendeeIds: string[]) => {
  setLoadingAttendees(true);
  try {
    const details = await Promise.all(
      attendeeIds.map(async (userId) => {
        const userDocRef = doc(db, 'UserInformation', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            name: data.accountType === 'user' 
              ? `${data.firstName} ${data.lastName}`
              : data.businessName,
            email: data.email || 'No email provided',
            phone: data.phoneNumber || 'No phone provided',
          };
        }
        return {
          name: 'Unknown User',
          email: 'No email',
          phone: 'No phone',
        };
      })
    );
    setAttendeeDetails(details);
  } catch (error) {
    console.error('Error fetching attendee details:', error);
    Alert.alert('Error', 'Failed to load attendee information');
  } finally {
    setLoadingAttendees(false);
  }
};

const handleViewAttendees = async (opportunityId: string) => {
  const attendeeList = attendees[opportunityId] || [];
  setSelectedOpportunityAttendees(attendeeList);
  setShowAttendeeModal(true);
  await fetchAttendeeDetails(attendeeList);
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.contentContainer}>
        <Header />

        {isOrganization && (
  <View style={styles.postButtonContainer}>
    {isApprovedOrganization ? (
      <TouchableOpacity
        style={styles.postButton}
        onPress={() => openPostModal()}
      >
        <MaterialCommunityIcons name="plus-circle" size={24} color={COLORS.textLight} />
        <Text style={styles.postButtonText}>Post Opportunity</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.pendingApprovalContainer}>
        <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.darkGreen} />
        <Text style={styles.pendingApprovalText}>
          Your organization account is pending approval. You'll be able to post opportunities once approved by an administrator.
        </Text>
      </View>
    )}
  </View>
)}

        <Text style={styles.screenTitle}>Volunteer Near You</Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
            onPress={() => setActiveTab('ongoing')}
          >
            <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>
              Ongoing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Upcoming
            </Text>
          </TouchableOpacity>
        </View>



        {loading && (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" />
            <Text style={{ marginTop: 10 }}>Loading opportunities...</Text>
          </View>
        )}

        {!loading && locationError && (
          <Text style={{ color: 'red', marginBottom: 10 }}>
            {locationError}
          </Text>
        )}

        {!loading && (
          filteredOpportunities.length > 0 ? (
            filteredOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                {...opportunity}
                isFavorited={favorites.includes(opportunity.id)}
                onToggleFavorite={toggleFavorite}
                canEdit={user?.uid === opportunity.postedBy}
                onEdit={() => openEditModal(opportunity)}
                onDelete={() => handleDeleteOpportunity(opportunity.id)}
                isUpcoming={opportunity.eventType === 'upcoming'}
                isAttending={(attendees[opportunity.id] || []).includes(user?.uid || '')}
                onToggleAttendance={toggleAttendance}
                attendeeCount={(attendees[opportunity.id] || []).length}
                isOrganization={isOrganization}
                onViewAttendees={handleViewAttendees}
              />
            ))
          ) : (
            <Text style={styles.noResultsText}>
              No {activeTab} opportunities found within {maxDistance.toFixed(1)} miles.
            </Text>
          )
        )}
      </ScrollView>

      {/* Post Opportunity Modal */}
      <Modal
        visible={showPostModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.modalContent}>
              {/* Use ScrollView but disable scrolling when dropdowns are open */}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                scrollEnabled={!openMonth && !openDay && !openYear && !openHour && !openMinute && !openAmPm}
                contentContainerStyle={styles.modalScrollContent}
              >
                <Text style={styles.modalTitle}>
                  {editingId ? 'Edit' : 'Post'} {formData.eventDate ? 'Upcoming' : 'Ongoing'} Opportunity
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Event Name *"
                  placeholderTextColor="#777"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description *"
                  placeholderTextColor="#777"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={4}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Contact Email"
                  placeholderTextColor="#777"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Contact Phone"
                  placeholderTextColor="#777"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Website"
                  placeholderTextColor="#777"
                  value={formData.website}
                  onChangeText={(text) => setFormData({ ...formData, website: text })}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Address (e.g., 123 Main St, Baton Rouge, LA)"
                  placeholderTextColor="#777"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                />

                {/* Event Date */}
                <Text style={{ fontWeight: '700', marginBottom: 6 }}>Event Date (optional)</Text>

                                {/* MONTH - Lowest zIndex since it's at the top visually */}
                <View style={{ zIndex: 2000, marginBottom: 10 }}>
                  <DropDownPicker
                    open={openMonth}
                    value={eventMonth}
                    items={monthItems}
                    setOpen={setOpenMonth}
                    setValue={setEventMonth}
                    placeholder="Month"
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      nestedScrollEnabled: true,
                    }}
                    dropDownDirection="TOP" // Force it to open downward
                  />
                </View>

                {/* DAY - Medium zIndex */}
                <View style={{ zIndex: 3000, marginBottom: 10 }}>
                  <DropDownPicker
                    open={openDay}
                    value={eventDay}
                    items={dayItems}
                    setOpen={setOpenDay}
                    setValue={setEventDay}
                    placeholder="Day"
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      nestedScrollEnabled: true,
                    }}
                    dropDownDirection="TOP" // Force it to open downward
                  />
                </View>
{/* YEAR - Highest zIndex since it's at the bottom visually */}
                <View style={{ zIndex: 4000, marginBottom: 10 }}>
                  <DropDownPicker
                    open={openYear}
                    value={eventYear}
                    items={yearItems}
                    setOpen={setOpenYear}
                    setValue={setEventYear}
                    placeholder="Year"
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      nestedScrollEnabled: true,
                    }}
                    dropDownDirection="TOP" // Force it to open downward
                  />
                </View>


{/* EVENT TIME – only show if date selected */}
{eventMonth && eventDay && eventYear && (
  <>
    <Text style={{ fontWeight: '700', marginTop: 12, marginBottom: 6 }}>Event Time (optional)</Text>

    {/* HOUR - First dropdown, HIGHEST zIndex since it's first */}
    <View style={{ zIndex: 5000, marginBottom: 10 }}>
      <DropDownPicker
        open={openHour}
        value={eventHour}
        items={hourItems}
        setOpen={setOpenHour}
        setValue={setEventHour}
        placeholder="Hour"
        listMode="SCROLLVIEW"
        scrollViewProps={{
          nestedScrollEnabled: true,
        }}
        dropDownDirection="TOP"
        maxHeight={150}
      />
    </View>

    {/* MINUTE - Second dropdown, MEDIUM zIndex */}
    <View style={{ zIndex: 6000, marginBottom: 10 }}>
      <DropDownPicker
        open={openMinute}
        value={eventMinute}
        items={minuteItems}
        setOpen={setOpenMinute}
        setValue={setEventMinute}
        placeholder="Minute"
        listMode="SCROLLVIEW"
        scrollViewProps={{
          nestedScrollEnabled: true,
        }}
        dropDownDirection="TOP"
        maxHeight={150}
      />
    </View>

    {/* AM/PM - Third dropdown, LOWEST zIndex */}
    <View style={{ zIndex: 7000, marginBottom: 10 }}>
      <DropDownPicker
        open={openAmPm}
        value={eventAmPm}
        items={[
          { label: 'AM', value: 'AM' },
          { label: 'PM', value: 'PM' },
        ]}
        setOpen={setOpenAmPm}
        setValue={setEventAmPm}
        placeholder="AM / PM"
        listMode="SCROLLVIEW"
        scrollViewProps={{
          nestedScrollEnabled: true,
        }}
        dropDownDirection="TOP"
        maxHeight={150}
      />
    </View>
  </>
)}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowPostModal(false)}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleSubmitPost}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color={COLORS.textLight} />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {editingId ? 'Update' : 'Post'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Attendee List Modal */}
<Modal
  visible={showAttendeeModal}
  transparent
  animationType="slide"
  onRequestClose={() => setShowAttendeeModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.attendeeModalContent}>
      <View style={styles.attendeeModalHeader}>
        <Text style={styles.attendeeModalTitle}>Registered Attendees</Text>
        <TouchableOpacity onPress={() => setShowAttendeeModal(false)}>
          <MaterialCommunityIcons name="close" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      {loadingAttendees ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.darkGreen} />
          <Text style={styles.loadingText}>Loading attendees...</Text>
        </View>
      ) : attendeeDetails.length > 0 ? (
        <ScrollView style={styles.attendeeList}>
          {attendeeDetails.map((attendee, index) => (
            <View key={index} style={styles.attendeeCard}>
              <View style={styles.attendeeIconCircle}>
                <MaterialCommunityIcons
                  name="account"
                  size={24}
                  color={COLORS.darkGreen}
                />
              </View>
              <View style={styles.attendeeInfo}>
                <Text style={styles.attendeeName}>{attendee.name}</Text>
                
                <TouchableOpacity 
                  style={styles.attendeeContactRow}
                  onPress={() => {
                    if (attendee.email !== 'No email provided') {
                      Linking.openURL(`mailto:${attendee.email}`);
                    }
                  }}
                >
                  <MaterialCommunityIcons
                    name="email"
                    size={14}
                    color={COLORS.lightGreen}
                  />
                  <Text style={[
                    styles.attendeeContactText,
                    attendee.email !== 'No email provided' && styles.attendeeContactLink
                  ]}>
                    {attendee.email}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.attendeeContactRow}
                  onPress={() => {
                    if (attendee.phone !== 'No phone provided') {
                      const cleanedNumber = attendee.phone.replace(/[^\d+]/g, '');
                      Linking.openURL(`tel:${cleanedNumber}`);
                    }
                  }}
                >
                  <MaterialCommunityIcons
                    name="phone"
                    size={14}
                    color={COLORS.lightGreen}
                  />
                  <Text style={[
                    styles.attendeeContactText,
                    attendee.phone !== 'No phone provided' && styles.attendeeContactLink
                  ]}>
                    {attendee.phone}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyAttendeeState}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={64}
            color={COLORS.timeFilter}
          />
          <Text style={styles.emptyAttendeeText}>No attendees yet</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.closeAttendeeModalButton}
        onPress={() => setShowAttendeeModal(false)}
      >
        <Text style={styles.closeAttendeeModalText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  organizationRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginBottom: 2,
},
organizationText: {
  fontSize: 12,
  color: COLORS.lightGreen,
  fontWeight: '600',
  fontStyle: 'italic',
},

attendeeModalContent: {
  backgroundColor: COLORS.background,
  marginHorizontal: 20,
  marginTop: 80,
  marginBottom: 80,
  borderRadius: 14,
  flex: 1,
  maxHeight: '85%',
},
attendeeModalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 20,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.timeFilter,
},
attendeeModalTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: COLORS.darkGreen,
},
loadingContainer: {
  padding: 40,
  alignItems: 'center',
  justifyContent: 'center',
},
loadingText: {
  marginTop: 12,
  fontSize: 14,
  color: COLORS.textDark,
},
attendeeList: {
  flex: 1,
  padding: 16,
},
attendeeCard: {
  flexDirection: 'row',
  backgroundColor: COLORS.card,
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  alignItems: 'flex-start',
  gap: 12,
},
attendeeIconCircle: {
  backgroundColor: COLORS.textLight,
  padding: 10,
  borderRadius: 30,
  justifyContent: 'center',
  alignItems: 'center',
},
attendeeInfo: {
  flex: 1,
},
attendeeName: {
  fontSize: 16,
  fontWeight: '700',
  color: COLORS.textDark,
  marginBottom: 8,
},
attendeeContactRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 4,
},
attendeeContactText: {
  fontSize: 13,
  color: COLORS.textDark,
},
attendeeContactLink: {
  textDecorationLine: 'underline',
  color: COLORS.darkGreen,
},
emptyAttendeeState: {
  padding: 60,
  alignItems: 'center',
  justifyContent: 'center',
},
emptyAttendeeText: {
  marginTop: 16,
  fontSize: 16,
  color: COLORS.textDark,
  fontWeight: '600',
},
closeAttendeeModalButton: {
  backgroundColor: COLORS.darkGreen,
  padding: 16,
  margin: 16,
  borderRadius: 10,
  alignItems: 'center',
},
closeAttendeeModalText: {
  color: COLORS.textLight,
  fontSize: 16,
  fontWeight: '700',
},
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  pendingApprovalContainer: {
  backgroundColor: '#fff3cd',
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  borderRadius: 12,
  gap: 12,
  borderWidth: 1,
  borderColor: '#ffc107',
},
pendingApprovalText: {
  flex: 1,
  color: COLORS.textDark,
  fontSize: 14,
  lineHeight: 20,
},

  /* ---------- HEADER ---------- */

  // In search.tsx, replace the header styles with this:

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: 'transparent',
    position: 'fixed',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  subLogoText: {
    fontSize: 8,
    color: COLORS.darkGreen,
    fontWeight: '500',
  },
  menuButton: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 8,
    padding: 5,
  },

  /* ---------- POST BUTTON ---------- */

  postButtonContainer: {
    marginBottom: 15,
  },
  postButton: {
    backgroundColor: COLORS.darkGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  postButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '700',
  },

  /* ---------- TITLES ---------- */

  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 15,
  },

  /* ---------- TABS ---------- */

  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.timeFilter,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.darkGreen,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.darkGreen,
    fontWeight: '700',
  },

  /* ---------- DISTANCE SLIDER ---------- */

  sliderContainer: {
    marginBottom: 20,
  },
  sliderBar: {
    width: '100%',
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderLabelText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
  },

  /* ---------- NO RESULTS ---------- */

  noResultsText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.textDark,
  },

  /* ---------- CARDS ---------- */

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 3, // Android
    shadowColor: '#000', // iOS
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardExpanded: {
    backgroundColor: '#d8c2a6',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    backgroundColor: COLORS.textLight,
    padding: 8,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },

  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.darkGreen,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.darkGreen,
  },

  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  favoriteButton: {
    padding: 6,
  },

  /* ---------- EXPANDED CARD CONTENT ---------- */

  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGreen,
    marginVertical: 10,
    opacity: 0.4,
  },

  descriptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 20,
    marginBottom: 12,
  },

  /* ---------- CONTACT SECTION ---------- */

  contactSection: {
    marginBottom: 15,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    color: COLORS.textDark,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    color: COLORS.textDark,
  },
  contactLink: {
    textDecorationLine: 'underline',
  },

  /* ---------- EDIT / DELETE ---------- */

  editDeleteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: COLORS.textLight,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b83f3f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    color: COLORS.textLight,
    fontWeight: '700',
  },

  /* ---------- SIGN UP BUTTON ---------- */

  signUpButton: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  signUpButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '700',
  },

  /* ---------- MODAL ---------- */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalKeyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
  },
  // REPLACE the modalContent style:
modalContent: {
  backgroundColor: COLORS.background,
  marginHorizontal: 20,
  borderRadius: 14,
  maxHeight: '85%',  // Changed from 90%
  minHeight: '60%',
  marginTop: 'auto',  // Changed from 30
  marginBottom: 'auto',  // Added
  paddingTop: 20
},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.timeFilter,
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontWeight: '700',
    marginBottom: 6,
    color: COLORS.textDark,
    fontSize: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGreen,
    marginBottom: 15,
  },

  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    marginBottom: 12,
    fontSize: 14,
    color: '#000',
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: COLORS.darkGreen,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: COLORS.textDark,
    fontWeight: '700',
  },
  submitButtonText: {
    color: COLORS.textLight,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginLeft: 18, // Indent to align with date
  },
  timeText: {
    fontSize: 12,
    color: COLORS.darkGreen,
  },
  attendanceButton: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  attendanceButtonConfirmed: {
    backgroundColor: COLORS.darkGreen,
  },
  attendanceButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  attendeeCountSection: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f5f0e8',
    borderRadius: 10,
  },
  attendeeCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
});

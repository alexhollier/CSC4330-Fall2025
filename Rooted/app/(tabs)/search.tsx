import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Slider } from '@miblanchard/react-native-slider';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = {
  background: '#fcfaf0',
  darkGreen: '#4d7c0f',
  lightGreen: '#709d43',
  card: '#e0c9b0',
  textDark: '#000000',
  textLight: '#ffffff',
  timeFilter: '#d1d1d1',
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
  distance?: number; // computed
};

// Haversine distance in miles
function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;

  const R = 6371; // Earth radius in km
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
    <TouchableOpacity style={styles.menuButton}>
      <MaterialIcons name="menu" size={30} color={COLORS.textLight} />
    </TouchableOpacity>
  </View>
);

const OpportunityCard = ({
  id,
  title,
  description,
  distance,
  email,
  phone,
  website,
  isFavorited,
  onToggleFavorite,
}: Opportunity & { isFavorited: boolean; onToggleFavorite: (id: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const distanceText =
    distance != null ? `${distance.toFixed(1)} mi` : 'Distance unavailable';

  const handleSignUp = async () => {
    if (website) {
      try {
        // Ensure URL has a protocol
        let url = website;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          console.error("Don't know how to open URI: " + url);
        }
      } catch (error) {
        console.error('Error opening website:', error);
      }
    }
  };

  const handlePhoneCall = async (phoneNumber: string) => {
    try {
      // Remove all non-numeric characters except +
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
            <View style={styles.distanceRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={14}
                color={COLORS.lightGreen}
              />
              <Text style={styles.distanceText}>{distanceText}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
            <MaterialCommunityIcons
              name={isFavorited ? "heart" : "heart-outline"}
              size={22}
              color={COLORS.lightGreen}
            />
          </TouchableOpacity>
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
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function SearchScreen() {
  const { user } = useAuth();
  const [distanceValue, setDistanceValue] = React.useState([5]); // miles
  const maxDistance = distanceValue[0];

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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
        // Remove from favorites
        await updateDoc(userDocRef, {
          favorites: arrayRemove(opportunityId)
        });
      } else {
        // Add to favorites
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
      (snapshot) => {
        const data: Opportunity[] = snapshot.docs.map((doc) => {
          const raw = doc.data() as any;

          const location =
            raw.Location &&
            typeof raw.Location.latitude === 'number' &&
            typeof raw.Location.longitude === 'number'
              ? {
                  latitude: raw.Location.latitude,
                  longitude: raw.Location.longitude,
                }
              : undefined;

          return {
            id: doc.id,
            title: raw.Business ?? 'Untitled',
            description: raw.Description ?? '',
            email: raw.Email ?? '',
            phone: raw.Phone ?? '',
            fax: raw.Fax ?? '',
            website: raw.Website ?? '',
            location,
          };
        });

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

  // Get user location (with fallback)
  useEffect(() => {
    (async () => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          console.warn('Location services disabled, using default location.');
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
          console.warn('Location permission not granted, using default location.');
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
          console.warn('Current location unavailable, using default location.', err);
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

  const filteredOpportunities = opportunitiesWithDistance.filter((opp) => {
    if (opp.distance == null) return true;
    return opp.distance <= maxDistance;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Header />

        <Text style={styles.screenTitle}>Volunteer Near You</Text>

        <View style={styles.sliderContainer}>
          <Slider
            value={distanceValue}
            onValueChange={(value) => setDistanceValue(value as number[])}
            minimumValue={1}
            maximumValue={50}
            step={0.5}
            thumbTintColor={COLORS.darkGreen}
            minimumTrackTintColor={COLORS.darkGreen}
            maximumTrackTintColor={COLORS.timeFilter}
            containerStyle={styles.sliderBar}
          />
          <View style={styles.sliderLabelRow}>
            <Text style={styles.sliderLabelText}>Within</Text>
            <Text style={styles.sliderLabelText}>
              {maxDistance.toFixed(1)} mi
            </Text>
          </View>
        </View>

        {loading && (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" />
            <Text style={{ marginTop: 10 }}>Loading opportunities...</Text>
          </View>
        )}

        {!loading && locationError && (
          <Text style={{ color: 'red', marginBottom: 10 }}>
            {locationError} — showing opportunities without distance filtering.
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
              />
            ))
          ) : (
            <Text style={styles.noResultsText}>
              No opportunities found within {maxDistance.toFixed(1)} miles.
            </Text>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 10,
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

  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 20,
  },

  sliderContainer: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  sliderBar: {
    height: 30,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  sliderLabelText: {
    fontSize: 14,
    color: COLORS.textDark,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.lightGreen,
    overflow: 'hidden',
  },
  cardExpanded: {
    backgroundColor: '#e8d5ba',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f0e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    color: COLORS.lightGreen,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#d4c4b0',
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4a4a4a',
    marginBottom: 16,
  },
  contactSection: {
    marginBottom: 16,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  contactText: {
    fontSize: 13,
    color: '#4a4a4a',
  },
  contactLink: {
    textDecorationLine: 'underline',
  },
  signUpButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signUpButtonText: {
    color: COLORS.textLight,
    fontWeight: '700',
    fontSize: 15,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
});
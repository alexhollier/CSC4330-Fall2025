import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Slider } from '@miblanchard/react-native-slider';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import * as Location from 'expo-location';

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
  title,
  description,
  distance,
  email,
  phone,
  website,
}: Opportunity) => {
  const distanceText =
    distance != null ? `${distance.toFixed(1)} mi away` : 'Distance unavailable';

  return (
    <View style={[styles.card, { backgroundColor: COLORS.card }]}>
      <MaterialCommunityIcons
        name="leaf"
        size={40}
        color={COLORS.lightGreen}
        style={styles.leafIcon}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>

        {phone ? <Text style={styles.cardDetail}>Phone: {phone}</Text> : null}
        {email ? <Text style={styles.cardDetail}>Email: {email}</Text> : null}
        {website ? (
          <Text style={styles.cardDetail} numberOfLines={1}>
            Website: {website}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.cardDetail}>{distanceText}</Text>
          <TouchableOpacity style={styles.signUpButton}>
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function SearchScreen() {
  const [distanceValue, setDistanceValue] = React.useState([5]); // miles
  const maxDistance = distanceValue[0];

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          return;
        }

        const pos = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (err) {
        console.error('Error getting user location:', err);
        setLocationError('Could not get location');
      }
    })();
  }, []);

  // Compute distance for each opportunity (if possible)
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
    if (opp.distance == null) return true; // show if we can't compute distance
    return opp.distance <= maxDistance;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Header />

        <Text style={styles.screenTitle}>Volunteer Near You</Text>

        {/* Distance Slider */}
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

        {/* Loading states */}
        {loading && (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" />
            <Text style={{ marginTop: 10 }}>Loading opportunities...</Text>
          </View>
        )}

        {!loading && locationError && (
          <Text style={{ color: 'red', marginBottom: 10 }}>
            {locationError} – showing opportunities without distance filtering.
          </Text>
        )}

        {/* Opportunity List */}
        {!loading && (
          filteredOpportunities.length > 0 ? (
            filteredOpportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} {...opportunity} />
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  leafIcon: {
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  cardDetail: {
    fontSize: 12,
  },
  signUpButton: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  signUpButtonText: {
    color: COLORS.textLight,
    fontWeight: 'bold',
    fontSize: 12,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
});

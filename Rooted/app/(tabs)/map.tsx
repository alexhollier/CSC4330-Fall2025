
import MapView, { Marker, Callout } from "react-native-maps";
import { StyleSheet, View, TouchableOpacity, View, Linking, Text, Image } from "react-native";
import React, { useState, useEffect } from "react";
import FilterPanel from "./FilterPanel"; 
import { useAuth } from '../../contexts/AuthContext';
import { saveUserFilters, loadUserFilters, FilterSettings } from '../services/filterService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";


interface Opportunity {
  id: string;
  business: string;
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
}


export default function MapPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const center = {
    latitude: 30.4515,
    longitude: -91.1871,
  };

  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
      distance: 10,
      morning: true,
      afternoon: false,
  });

  const { user } = useAuth();

  // Load user filters when user becomes available
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    // Log auth info to help debug permission issues
    try {
      console.log('[map] attempting to load filters for user', { uid: user.uid, email: (user as any).email });
    } catch (logErr) {
      console.log('[map] failed to log user info', logErr);
    }

    loadUserFilters(user.uid)
      .then((f) => {
        if (mounted && f) {
          setActiveFilters(f);
          console.log('[map] Loaded user filters', f);
        } else if (mounted) {
          console.log('[map] no filters found for user', user.uid);
        }
      })
      .catch((err) => console.error('[map] error loading filters', err));
    return () => {
      mounted = false;
    };
  }, [user]);

  const applyFilters = (distance: number, morning: boolean, afternoon: boolean) => {
    const newFilters: FilterSettings = { distance, morning, afternoon };
    setActiveFilters(newFilters);
    console.log(`Filters Applied: Distance=${distance}mi, Morning=${morning}, Afternoon=${afternoon}`);
    if (user) {
      saveUserFilters(user.uid, newFilters).catch((err) => console.error('[map] error saving filters', err));
    } else {
      console.log('[map] user not signed in; not saving filters to Firestore');
    }
  };
  useEffect(() => {
    // Listen to Firestore changes in real-time
    const unsub = onSnapshot(
      collection(db, "VolunteerOpportunity"),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            business: data.Business,
            location: data.Location,
            description: data.Description,
          };
        });

        setOpportunities(items);
      }
    );

    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          ...center,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />

      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => setIsPanelVisible(prev => !prev)} 
      >
        <Ionicons 
          name={isPanelVisible ? "close" : "filter"}
          size={24} 
          color="white" 
        />
      </TouchableOpacity>
      <FilterPanel
        isVisible={isPanelVisible}
        onClose={() => setIsPanelVisible(false)}
        onApplyFilters={applyFilters}
        initialDistance={activeFilters.distance}
        initialMorning={activeFilters.morning}
        initialAfternoon={activeFilters.afternoon}
      />
      >
        {opportunities.map((item) => (
          <Marker
            key={item.id}
            coordinate={{
              latitude: item.location.latitude,
              longitude: item.location.longitude,
            }}
          >
            <View style={styles.markerContainer}>
              <Image
                source={require("../../assets/images/rooted_logo.png")}
                style={styles.markerImage}
                resizeMode="contain"
              />
            </View>
            <Callout
            tooltip={true}
              onPress={() => {
                const lat = item.location.latitude;
                const lng = item.location.longitude;

                const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                Linking.openURL(url);
              }}
            >
              <View style={{
  backgroundColor: "white",
  padding: 10,
  borderRadius: 8,
  maxWidth: 250,
  elevation: 4
}}>
  <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
    {item.business}
  </Text>
  <Text style={{ fontSize: 12, marginBottom: 8 }}>
    {item.description}
  </Text>

  <Text style={{ color: "blue", fontWeight: "600" }}>
    Get Directions →
  </Text>
</View>

            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  markerContainer: {
    backgroundColor: "#fcfaf0",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#333",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  markerImage: {
    width: 30,
    height: 30,
  },
  menuButton: {
    position: 'absolute',
    top: 50, 
    right: 20,
    zIndex: 30, 
    backgroundColor: '#85B35C',
    borderRadius: 8,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});

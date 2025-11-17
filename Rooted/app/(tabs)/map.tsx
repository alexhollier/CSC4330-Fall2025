import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { StyleSheet, View } from "react-native";
import Geocoder from 'react-native-geocoding';



export default function MapPage() {
  const center = {
    lat: 30.4515,
    lng: -91.1871,
  };

  const containerStyle = {
    width: "100%",
    height: "100%",
  };

  return (
    <View style={styles.container}>
      <LoadScript googleMapsApiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13} />
      </LoadScript>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const mapStyle = [
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
];


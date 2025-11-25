// app/(tabs)/search.tsx
import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Slider } from '@miblanchard/react-native-slider';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = {
  background: '#fcfaf0', 
  darkGreen: '#4d7c0f', 
  lightGreen: '#709d43', 
  card: '#e0c9b0', 
  textDark: '#000000',
  textLight: '#ffffff',
  timeFilter: '#d1d1d1',
  admin: '#ff6347',
};

const volunteerOpportunities = [
  {
    id: 1,
    title: 'Baton Rouge Food Bank',
    description: 'Help sort and distribute food',
    distance: 2.1,
    time: ['Morning', 'Afternoon'],
  },
  {
    id: 2,
    title: 'Habitat For Humanity',
    description: 'Assist with home construction',
    distance: 3.4,
    time: ['Afternoon'],
  },
  {
    id: 3,
    title: 'Baton Rouge Green',
    description: 'Plant and maintain trees',
    distance: 4.2,
    time: ['Morning'],
  },
  {
    id: 4,
    title: 'Library Story Hour',
    description: 'Read to children in the evening',
    distance: 0.8,
    time: ['Evening'],
  },
  {
    id: 5,
    title: 'Animal Shelter Walkers',
    description: 'Walk dogs in the late afternoon',
    distance: 6.5,
    time: ['Afternoon'],
  },
];

//Logo and Menu Header Component
const Header = ({ isOrganization }: { isOrganization: boolean }) => (
  <View style={styles.header}>
    <View style={styles.logoContainer}>
      <MaterialCommunityIcons name="tree-outline" size={35} color={COLORS.darkGreen} />
      <View>
        <Text style={styles.logoText}>ROOTED</Text>
        <Text style={styles.subLogoText}>VOLUNTEER & COMMUNITY</Text>
      </View>
    </View>
    
    <View style={styles.headerButtons}>
      {isOrganization && (
        <TouchableOpacity 
          style={styles.adminButton}
          onPress={() => Alert.alert('Admin', 'Admin panel coming soon!')}
        >
          <MaterialIcons name="admin-panel-settings" size={24} color={COLORS.textLight} />
          <Text style={styles.adminButtonText}>Admin</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity style={styles.menuButton}>
        <MaterialIcons name="menu" size={30} color={COLORS.textLight} />
      </TouchableOpacity>
    </View>
  </View>
);

//Card Component for Volunteer Opportunities
const OpportunityCard = ({ title, description, distance, time }: typeof volunteerOpportunities[0]) => (
  <View style={[styles.card, { backgroundColor: COLORS.card }]}>
    <MaterialCommunityIcons name="leaf" size={40} color={COLORS.lightGreen} style={styles.leafIcon} />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDetail}>{distance} mi • {time.join('/')}</Text>
        <TouchableOpacity style={styles.signUpButton}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export default function SearchScreen() {
  const { isOrganization } = useAuth();
  const [distanceValue, setDistanceValue] = React.useState([5]);
  const maxDistance = distanceValue[0];
  const [activeTime, setActiveTime] = React.useState('Morning');

  const filteredOpportunities = volunteerOpportunities.filter((opportunity => {
    const distanceMatch = opportunity.distance <= maxDistance;
    const timeMatch = opportunity.time.includes(activeTime);
    return distanceMatch && timeMatch;
  }));

  const TimeFilter = ({ label }: { label: string }) => (
    <TouchableOpacity 
      style={[
        styles.timeFilterButton, 
        { backgroundColor: activeTime === label ? COLORS.lightGreen : COLORS.timeFilter }
      ]}
      onPress={() => setActiveTime(label)}
    >
      <Text style={styles.timeFilterText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        
        <Header isOrganization={isOrganization} />

        <Text style={styles.screenTitle}>Volunteer Near You</Text>

        {/* --- Time Filters --- */}
        <View style={styles.timeFilterRow}>
          <TimeFilter label="Morning" />
          <TimeFilter label="Afternoon" />
          <TimeFilter label="Evening" />
        </View>

        {/* --- Distance Slider --- */}
        <View style={styles.sliderContainer}>
          <Slider
            value={distanceValue}
            onValueChange={(value) => setDistanceValue(value)}
            minimumValue={1}
            maximumValue={10}
            step={0.5}
            thumbTintColor={COLORS.darkGreen}
            minimumTrackTintColor={COLORS.darkGreen}
            maximumTrackTintColor={COLORS.timeFilter}
            containerStyle={styles.sliderBar}
          />
          <View style={styles.sliderLabelRow}>
            <Text style={styles.sliderLabelText}>Nearby</Text>
            <Text style={styles.sliderLabelText}>{maxDistance.toFixed(1)} mi</Text>
          </View>
        </View>

        {/* --- Opportunity List --- */}
        {filteredOpportunities.length > 0 ? (
            filteredOpportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} {...opportunity} />
        ))
        ) : (
          <Text style={styles.noResultsText}>
            No volunteer opportunities found within {maxDistance.toFixed(1)} miles 
            for the {activeTime.toLowerCase()}.
          </Text>
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

  // Header styles
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
    fontFamily: 'serif',
    lineHeight: 18,
  },
  subLogoText: {
    fontSize: 8,
    color: COLORS.darkGreen,
    fontWeight: '500',
    lineHeight: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminButton: {
    backgroundColor: COLORS.admin,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  adminButtonText: {
    color: COLORS.textLight,
    fontWeight: 'bold',
    fontSize: 14,
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

  // Time Filter styles
  timeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  timeFilterButton: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  timeFilterText: {
    color: COLORS.textDark,
    fontWeight: '600',
    fontSize: 14,
  },

  // Slider styles
  sliderContainer: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  sliderBar: {
    height: 30,
    marginBottom: 0,
    marginTop: 0,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -10,
  },
  sliderLabelText: {
    fontSize: 14,
    color: COLORS.textDark,
  },

  // Card styles
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.darkGreen + '20',
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
    color: COLORS.textDark,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textDark,
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
    color: COLORS.textDark,
    fontWeight: '500',
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
    color: COLORS.textDark,
  }
});
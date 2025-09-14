import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';

/**
 * About Screen - App information, version, legal links, and contact
 */
const AboutScreen: React.FC<RootStackScreenProps<'About'>> = ({ navigation }) => {
  const { profile } = useAuthStore();

  const handlePrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const handleTermsOfService = () => {
    navigation.navigate('TermsOfService');
  };

  const handleContactSupport = () => {
    navigation.navigate('Support');
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://amenity.app').catch(() => {
      Alert.alert('Error', 'Unable to open website');
    });
  };

  const handleOpenEmail = () => {
    Linking.openURL('mailto:support@amenity.app').catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleRateApp = () => {
    // TODO: Implement app store rating
    Alert.alert('Rate App', 'Thank you for your feedback!');
  };

  const handleShareApp = () => {
    // TODO: Implement share functionality
    Alert.alert('Share App', 'Share Amenity with your friends!');
  };

  const renderInfoSection = () => (
    <View style={styles.section}>
      <View style={styles.appInfo}>
        <View style={styles.appIcon}>
          <Ionicons name="heart" size={48} color="#5B21B6" />
        </View>
        <Text style={styles.appName}>Amenity</Text>
        <Text style={styles.appTagline}>Prayer Community App</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </View>
    </View>
  );

  const renderDescriptionSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About Amenity</Text>
      <Text style={styles.description}>
        Amenity is a prayer community app that connects believers through shared prayer requests, 
        group prayer sessions, and AI-powered Bible studies. Our mission is to foster spiritual 
        growth and community support through technology.
      </Text>
    </View>
  );

  const renderLinksSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Legal & Support</Text>
      
      <TouchableOpacity style={styles.linkItem} onPress={handlePrivacyPolicy}>
        <View style={styles.linkContent}>
          <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
          <Text style={styles.linkText}>Privacy Policy</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkItem} onPress={handleTermsOfService}>
        <View style={styles.linkContent}>
          <Ionicons name="document-text" size={20} color="#6B7280" />
          <Text style={styles.linkText}>Terms of Service</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkItem} onPress={handleContactSupport}>
        <View style={styles.linkContent}>
          <Ionicons name="help-circle" size={20} color="#6B7280" />
          <Text style={styles.linkText}>Contact Support</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkItem} onPress={handleOpenWebsite}>
        <View style={styles.linkContent}>
          <Ionicons name="globe" size={20} color="#6B7280" />
          <Text style={styles.linkText}>Visit Website</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );

  const renderContactSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contact Us</Text>
      
      <TouchableOpacity style={styles.linkItem} onPress={handleOpenEmail}>
        <View style={styles.linkContent}>
          <Ionicons name="mail" size={20} color="#6B7280" />
          <Text style={styles.linkText}>support@amenity.app</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <View style={styles.linkItem}>
        <View style={styles.linkContent}>
          <Ionicons name="call" size={20} color="#6B7280" />
          <Text style={styles.linkText}>+1 (555) 123-4567</Text>
        </View>
      </View>
    </View>
  );

  const renderActionsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Actions</Text>
      
      <TouchableOpacity style={styles.linkItem} onPress={handleRateApp}>
        <View style={styles.linkContent}>
          <Ionicons name="star" size={20} color="theme.colors.warning[700]" />
          <Text style={styles.linkText}>Rate the App</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkItem} onPress={handleShareApp}>
        <View style={styles.linkContent}>
          <Ionicons name="share" size={20} color="theme.colors.success[700]" />
          <Text style={styles.linkText}>Share Amenity</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        © 2024 Amenity. All rights reserved.
      </Text>
      <Text style={styles.footerText}>
        Made with ❤️ for the prayer community
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderInfoSection()}
        {renderDescriptionSection()}
        {renderLinksSection()}
        {renderContactSection()}
        {renderActionsSection()}
        {renderFooter()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default AboutScreen;
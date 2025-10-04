import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';

/**
 * Terms of Service Screen - Legal terms and conditions
 * Based on terms_of_service mockups
 */
const TermsOfServiceScreen: React.FC<RootStackScreenProps<'TermsOfService'>> = ({ navigation }) => {
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Terms of Service</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderLastUpdated = () => (
    <View style={styles.lastUpdated}>
      <Text style={styles.lastUpdatedText}>Last updated: December 15, 2024</Text>
    </View>
  );

  const renderSection = (title: string, content: string[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {content.map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderLastUpdated()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSection('1. Acceptance of Terms', [
          'By accessing and using the Amenity mobile application ("App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
          'These Terms of Service ("Terms") govern your use of our mobile application and services. By using Amenity, you agree to these terms.'
        ])}

        {renderSection('2. Description of Service', [
          'Amenity is a mobile application that connects people through prayer and spiritual support. The service allows users to:',
          '• Create and share prayer requests',
          '• Join prayer groups and communities',
          '• Connect with other users for spiritual support',
          '• Access Bible study resources and AI-generated spiritual guidance',
          '• Participate in group discussions and prayer sessions'
        ])}

        {renderSection('3. User Accounts', [
          'To use certain features of the App, you must register for an account. You agree to:',
          '• Provide accurate, current, and complete information during registration',
          '• Maintain and update your account information',
          '• Keep your password secure and confidential',
          '• Accept responsibility for all activities under your account',
          '• Notify us immediately of any unauthorized use of your account'
        ])}

        {renderSection('4. User Conduct', [
          'You agree to use the App in accordance with these Terms and applicable laws. You will not:',
          '• Post content that is harmful, threatening, abusive, or defamatory',
          '• Share content that violates others\' privacy or intellectual property rights',
          '• Use the App for commercial purposes without permission',
          '• Attempt to gain unauthorized access to the App or other users\' accounts',
          '• Interfere with the proper functioning of the App',
          '• Post spam, advertisements, or promotional content'
        ])}

        {renderSection('5. Content and Privacy', [
          'You retain ownership of content you post, but grant us a license to use, display, and distribute your content through the App.',
          'We respect your privacy and handle your personal information in accordance with our Privacy Policy. By using the App, you consent to the collection and use of your information as described in our Privacy Policy.',
          'You are responsible for the content you share and should consider the sensitivity of prayer requests and personal information.'
        ])}

        {renderSection('6. Intellectual Property', [
          'The App and its original content, features, and functionality are owned by Amenity and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.',
          'You may not copy, modify, distribute, sell, or lease any part of our services or included software, nor may you reverse engineer or attempt to extract the source code of that software.'
        ])}

        {renderSection('7. Prohibited Uses', [
          'You may not use our App:',
          '• For any unlawful purpose or to solicit others to perform unlawful acts',
          '• To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances',
          '• To infringe upon or violate our intellectual property rights or the intellectual property rights of others',
          '• To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate',
          '• To submit false or misleading information',
          '• To upload or transmit viruses or any other type of malicious code'
        ])}

        {renderSection('8. Termination', [
          'We may terminate or suspend your account and bar access to the App immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.',
          'If you wish to terminate your account, you may simply discontinue using the App or contact us to request account deletion.'
        ])}

        {renderSection('9. Disclaimer of Warranties', [
          'The information on this App is provided on an "as is" basis. To the fullest extent permitted by law, this Company:',
          '• Excludes all representations and warranties relating to this App and its contents',
          '• Does not warrant that the App will be constantly available or available at all',
          '• Does not warrant that the information on this App is complete, true, accurate, or non-misleading'
        ])}

        {renderSection('10. Limitation of Liability', [
          'In no event shall Amenity, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the App.'
        ])}

        {renderSection('11. Governing Law', [
          'These Terms shall be interpreted and governed by the laws of the United States, without regard to its conflict of law provisions.',
          'Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.'
        ])}

        {renderSection('12. Changes to Terms', [
          'We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.',
          'By continuing to access or use our App after those revisions become effective, you agree to be bound by the revised terms.'
        ])}

        {renderSection('13. Contact Information', [
          'If you have any questions about these Terms of Service, please contact us at:',
          'Email: legal@Amenity.app',
          'Address: Amenity Support Team, 123 Prayer Street, Faith City, FC 12345'
        ])}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  lastUpdated: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  lastUpdatedText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default TermsOfServiceScreen;

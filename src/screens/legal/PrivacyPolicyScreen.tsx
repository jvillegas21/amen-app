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
 * Privacy Policy Screen - Privacy policy and data protection information
 * Based on privacy_policy mockups
 */
const PrivacyPolicyScreen: React.FC<RootStackScreenProps<'PrivacyPolicy'>> = ({ navigation }) => {
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Privacy Policy</Text>
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
        {renderSection('1. Introduction', [
          'Amenity ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.',
          'Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the application.'
        ])}

        {renderSection('2. Information We Collect', [
          'We may collect information about you in a variety of ways. The information we may collect via the App includes:',
          'Personal Data: Personally identifiable information, such as your name, email address, and telephone number, that you voluntarily give to us when you register with the App or when you choose to participate in various activities related to the App.',
          'Derived Data: Information our servers automatically collect when you access the App, such as your IP address, your browser type, your operating system, access times, and the pages you have viewed directly before and after accessing the App.',
          'Mobile Device Data: Device information such as your mobile device ID number, model, and manufacturer, version of your operating system, phone number, country, location, and any other data you choose to provide.'
        ])}

        {renderSection('3. How We Use Your Information', [
          'Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the App to:',
          '• Create and manage your account',
          '• Process your prayer requests and interactions',
          '• Enable you to connect with other users and prayer groups',
          '• Send you administrative information, such as changes to our terms, conditions, and policies',
          '• Send you push notifications regarding updates to the App or your account',
          '• Provide customer support and respond to your inquiries',
          '• Improve our App and develop new products and services',
          '• Comply with legal obligations and enforce our agreements'
        ])}

        {renderSection('4. Information Sharing and Disclosure', [
          'We may share information we have collected about you in certain situations. Your information may be disclosed as follows:',
          'By Law or to Protect Rights: If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.',
          'Third-Party Service Providers: We may share your information with third parties that perform services for us or on our behalf, including data analysis, email delivery, hosting services, customer service, and marketing assistance.',
          'Business Transfers: We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.'
        ])}

        {renderSection('5. Data Security', [
          'We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.',
          'Any information disclosed online is vulnerable to interception and misuse by unauthorized parties. Therefore, we cannot guarantee complete security if you provide personal information.'
        ])}

        {renderSection('6. Data Retention', [
          'We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Policy, unless a longer retention period is required or permitted by law.',
          'When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize it, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.'
        ])}

        {renderSection('7. Your Privacy Rights', [
          'Depending on your location, you may have certain rights regarding your personal information. These may include the right to:',
          '• Access and receive a copy of the personal information we hold about you',
          '• Rectify any personal information held about you that is inaccurate',
          '• Request the deletion of personal information held about you',
          '• Restrict the processing of your personal information',
          '• Data portability (receive a copy of your personal information in a structured, machine-readable format)',
          '• Object to our processing of your personal information',
          '• Withdraw consent at any time where we are relying on consent to process your personal information'
        ])}

        {renderSection('8. Third-Party Services', [
          'The App may contain links to third-party websites and applications of interest, including advertisements and external services, that are not affiliated with us. Once you have used these links to leave the App, any information you provide to these third parties is not covered by this Privacy Policy, and we cannot guarantee the safety and privacy of your information.',
          'We use third-party services including:',
          '• Supabase for database and authentication services',
          '• OpenAI for AI-powered features',
          '• Analytics services to understand app usage',
          '• Push notification services'
        ])}

        {renderSection('9. Children\'s Privacy', [
          'The App is not intended for children under 13 years of age. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.',
          'If we discover that a child under 13 has provided us with personal information, we will delete such information from our servers immediately.'
        ])}

        {renderSection('10. International Data Transfers', [
          'Your information, including personal information, may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those from your jurisdiction.',
          'If you are located outside the United States and choose to provide information to us, please note that we transfer the data, including personal information, to the United States and process it there.'
        ])}

        {renderSection('11. Changes to This Privacy Policy', [
          'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.',
          'You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.'
        ])}

        {renderSection('12. Contact Us', [
          'If you have any questions about this Privacy Policy, please contact us:',
          'Email: privacy@amenity.app',
          'Address: Amenity Privacy Team, 123 Prayer Street, Faith City, FC 12345',
          'Phone: 1-800-AMENITY'
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

export default PrivacyPolicyScreen;

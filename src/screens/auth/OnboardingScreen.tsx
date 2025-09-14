import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import { AuthStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Onboarding Screen - Welcome introduction to the app
 * Based on welcome_onboarding mockups
 */
const OnboardingScreen: React.FC<AuthStackScreenProps<'Onboarding'>> = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const slides = [
    {
      id: 1,
      icon: 'heart',
      title: 'Connect Through Prayer',
      description: 'Share your prayer requests and support others in their spiritual journey',
      color: '#5B21B6',
    },
    {
      id: 2,
      icon: 'people',
      title: 'Build Community',
      description: 'Join prayer groups and connect with believers in your area',
      color: 'theme.colors.success[700]',
    },
    {
      id: 3,
      icon: 'book',
      title: 'Grow in Faith',
      description: 'Get personalized Bible study suggestions based on your prayers',
      color: 'theme.colors.error[700]',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * width,
        animated: true,
      });
    } else {
      navigation.navigate('ProfileSetup');
    }
  };

  const handleSkip = () => {
    navigation.navigate('ProfileSetup');
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const renderSlide = (slide: typeof slides[0], index: number) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${slide.color}15` }]}>
          <Ionicons name={slide.icon as any} size={80} color={slide.color} />
        </View>
        
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideDescription}>{slide.description}</Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentSlide && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>

        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollView}
        >
          {slides.map((slide, index) => renderSlide(slide, index))}
        </ScrollView>

        {/* Pagination */}
        {renderPagination()}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons 
              name={currentSlide === slides.length - 1 ? 'checkmark' : 'arrow-forward'} 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#5B21B6',
    width: 24,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  nextButton: {
    height: 56,
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default OnboardingScreen;

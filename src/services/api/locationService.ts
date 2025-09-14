import * as Location from 'expo-location';
import { supabase } from '@/config/supabase';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  region?: string;
  subregion?: string;
  granularity: 'exact' | 'city' | 'region' | 'country' | 'hidden';
}

export interface PrayerLocation {
  id: string;
  prayer_id: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  granularity: 'exact' | 'city' | 'region' | 'country' | 'hidden';
  created_at: string;
}

/**
 * Location Service - Manages location-based features and privacy controls
 */
class LocationService {
  /**
   * Request location permissions
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = reverseGeocode[0];
      if (!address) {
        throw new Error('Could not determine location');
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: address.city || address.subregion,
        country: address.country,
        region: address.region,
        subregion: address.subregion,
        granularity: 'exact',
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Get location with specified granularity
   */
  async getLocationWithGranularity(granularity: LocationData['granularity']): Promise<LocationData | null> {
    const location = await this.getCurrentLocation();
    if (!location) return null;

    // Adjust granularity based on user preference
    switch (granularity) {
      case 'hidden':
        return {
          ...location,
          latitude: 0,
          longitude: 0,
          city: undefined,
          country: undefined,
          region: undefined,
          subregion: undefined,
          granularity: 'hidden',
        };
      case 'country':
        return {
          ...location,
          latitude: Math.round(location.latitude * 100) / 100, // Reduce precision
          longitude: Math.round(location.longitude * 100) / 100,
          city: undefined,
          region: undefined,
          subregion: undefined,
          granularity: 'country',
        };
      case 'region':
        return {
          ...location,
          latitude: Math.round(location.latitude * 1000) / 1000,
          longitude: Math.round(location.longitude * 1000) / 1000,
          city: undefined,
          subregion: undefined,
          granularity: 'region',
        };
      case 'city':
        return {
          ...location,
          latitude: Math.round(location.latitude * 10000) / 10000,
          longitude: Math.round(location.longitude * 10000) / 10000,
          subregion: undefined,
          granularity: 'city',
        };
      default:
        return location;
    }
  }

  /**
   * Get nearby prayers
   */
  async getNearbyPrayers(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20
  ): Promise<PrayerLocation[]> {
    try {
      const { data, error } = await supabase
        .from('prayer_locations')
        .select(`
          *,
          prayer:prayers!prayer_id(*)
        `)
        .not('granularity', 'eq', 'hidden')
        .limit(limit);

      if (error) throw error;

      // Filter by distance (simplified - in production, use PostGIS or similar)
      const nearbyPrayers = data?.filter(prayer => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          prayer.latitude,
          prayer.longitude
        );
        return distance <= radiusKm;
      }) || [];

      return nearbyPrayers;
    } catch (error) {
      console.error('Error getting nearby prayers:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get local trending topics
   */
  async getLocalTrendingTopics(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<string[]> {
    try {
      const nearbyPrayers = await this.getNearbyPrayers(latitude, longitude, radiusKm, 100);
      
      // Extract tags from nearby prayers
      const allTags: string[] = [];
      nearbyPrayers.forEach(prayer => {
        if (prayer.prayer?.tags) {
          allTags.push(...prayer.prayer.tags);
        }
      });

      // Count tag frequency
      const tagCounts: { [key: string]: number } = {};
      allTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      // Sort by frequency and return top tags
      return Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);
    } catch (error) {
      console.error('Error getting local trending topics:', error);
      return [];
    }
  }

  /**
   * Get location-based prayer statistics
   */
  async getLocationStats(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<{
    totalPrayers: number;
    recentPrayers: number;
    popularTags: string[];
    averageDistance: number;
  }> {
    try {
      const nearbyPrayers = await this.getNearbyPrayers(latitude, longitude, radiusKm, 1000);
      
      const totalPrayers = nearbyPrayers.length;
      const recentPrayers = nearbyPrayers.filter(prayer => {
        const prayerDate = new Date(prayer.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return prayerDate > weekAgo;
      }).length;

      const allTags: string[] = [];
      nearbyPrayers.forEach(prayer => {
        if (prayer.prayer?.tags) {
          allTags.push(...prayer.prayer.tags);
        }
      });

      const tagCounts: { [key: string]: number } = {};
      allTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      const popularTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      const totalDistance = nearbyPrayers.reduce((sum, prayer) => {
        return sum + this.calculateDistance(latitude, longitude, prayer.latitude, prayer.longitude);
      }, 0);

      const averageDistance = totalPrayers > 0 ? totalDistance / totalPrayers : 0;

      return {
        totalPrayers,
        recentPrayers,
        popularTags,
        averageDistance,
      };
    } catch (error) {
      console.error('Error getting location stats:', error);
      return {
        totalPrayers: 0,
        recentPrayers: 0,
        popularTags: [],
        averageDistance: 0,
      };
    }
  }

  /**
   * Update user's location preference
   */
  async updateLocationPreference(
    userId: string,
    preference: {
      shareLocation: boolean;
      granularity: LocationData['granularity'];
      allowNearbyDiscovery: boolean;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_location_preferences')
        .upsert({
          user_id: userId,
          share_location: preference.shareLocation,
          granularity: preference.granularity,
          allow_nearby_discovery: preference.allowNearbyDiscovery,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating location preference:', error);
      throw error;
    }
  }

  /**
   * Get user's location preference
   */
  async getLocationPreference(userId: string): Promise<{
    shareLocation: boolean;
    granularity: LocationData['granularity'];
    allowNearbyDiscovery: boolean;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('user_location_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return {
        shareLocation: data.share_location,
        granularity: data.granularity,
        allowNearbyDiscovery: data.allow_nearby_discovery,
      };
    } catch (error) {
      console.error('Error getting location preference:', error);
      return null;
    }
  }

  /**
   * Check if location services are available
   */
  async isLocationAvailable(): Promise<boolean> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      const isEnabled = await Location.hasServicesEnabledAsync();
      return hasPermission && isEnabled;
    } catch (error) {
      console.error('Error checking location availability:', error);
      return false;
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();
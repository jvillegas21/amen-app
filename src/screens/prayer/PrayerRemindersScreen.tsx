import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth/authStore';
import { prayerInteractionService } from '@/services/api/prayerInteractionService';
import { formatDistanceToNow, format } from 'date-fns';

interface PrayerReminder {
  id: string;
  reminder_time: string;
  created_at: string;
  prayer: {
    id: string;
    title: string;
    content: string;
    user: {
      display_name: string;
    };
  };
}

export default function PrayerRemindersScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  const [reminders, setReminders] = useState<PrayerReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchReminders();
    }
  }, [profile?.id]);

  const fetchReminders = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const data = await prayerInteractionService.getPrayerReminders(profile.id);
      setReminders(data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      Alert.alert('Error', 'Failed to load prayer reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReminders();
    setRefreshing(false);
  };

  const handlePrayerPress = (prayerId: string) => {
    router.push(`/prayer/${prayerId}`);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await prayerInteractionService.deletePrayerReminder(reminderId);
              setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const getReminderStatus = (reminderTime: string) => {
    const now = new Date();
    const reminder = new Date(reminderTime);
    const diff = reminder.getTime() - now.getTime();

    if (diff <= 0) {
      return { status: 'overdue', color: '#FF3B30', text: 'Overdue' };
    } else if (diff <= 24 * 60 * 60 * 1000) { // Within 24 hours
      return { status: 'upcoming', color: '#FF9500', text: 'Upcoming' };
    } else {
      return { status: 'scheduled', color: '#007AFF', text: 'Scheduled' };
    }
  };

  const renderReminderItem = ({ item: reminder }: { item: PrayerReminder }) => {
    const reminderStatus = getReminderStatus(reminder.reminder_time);
    const reminderDate = new Date(reminder.reminder_time);
    
    return (
      <View style={styles.reminderItem}>
        <View style={styles.reminderContent}>
          <View style={styles.reminderHeader}>
            <Text style={styles.reminderTitle} numberOfLines={2}>
              Prayer Reminder
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: reminderStatus.color }]}>
              <Text style={styles.statusText}>{reminderStatus.text}</Text>
            </View>
          </View>
          
          <Text style={styles.reminderText} numberOfLines={2}>
            {reminder.prayer.text}
          </Text>
          
          <View style={styles.reminderMeta}>
            <Text style={styles.prayerAuthor}>
              by {reminder.prayer.user?.display_name || 'Anonymous'}
            </Text>
            <Text style={styles.reminderTime}>
              {format(reminderDate, 'MMM d, h:mm a')}
            </Text>
          </View>
          
          <Text style={styles.reminderRelative}>
            {formatDistanceToNow(reminderDate, { addSuffix: true })}
          </Text>
        </View>
        
        <View style={styles.reminderActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePrayerPress(reminder.prayer.id)}
          >
            <Ionicons name="eye-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteReminder(reminder.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="alarm-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Prayer Reminders</Text>
      <Text style={styles.emptyStateText}>
        Set reminders for prayers you want to revisit later
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prayer Reminders</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading reminders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer Reminders</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={reminders}
        renderItem={renderReminderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          reminders.length === 0 && styles.emptyListContainer,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  reminderItem: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  reminderContent: {
    flex: 1,
    marginRight: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  reminderText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 12,
  },
  reminderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  prayerAuthor: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  reminderTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  reminderRelative: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  reminderActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginVertical: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
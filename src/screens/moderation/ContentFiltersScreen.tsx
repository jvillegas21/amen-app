import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth/authStore';
import { contentModerationService, ContentFilter } from '@/services/api/contentModerationService';

export default function ContentFiltersScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  const [filters, setFilters] = useState<ContentFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [newFilter, setNewFilter] = useState({
    type: 'keyword' as ContentFilter['filter_type'],
    value: '',
  });

  useEffect(() => {
    if (profile?.id) {
      fetchFilters();
    }
  }, [profile?.id]);

  const fetchFilters = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const data = await contentModerationService.getContentFilters(profile.id);
      setFilters(data);
    } catch (error) {
      console.error('Error fetching content filters:', error);
      Alert.alert('Error', 'Failed to load content filters');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFilters();
    setRefreshing(false);
  };

  const handleAddFilter = async () => {
    if (!newFilter.value.trim()) {
      Alert.alert('Error', 'Please enter a filter value');
      return;
    }

    try {
      const filter = await contentModerationService.createContentFilter({
        filter_type: newFilter.type,
        filter_value: newFilter.value.trim(),
      });
      
      setFilters(prev => [filter, ...prev]);
      setNewFilter({ type: 'keyword', value: '' });
      setShowAddFilter(false);
      Alert.alert('Success', 'Content filter added successfully');
    } catch (error) {
      console.error('Error adding content filter:', error);
      Alert.alert('Error', 'Failed to add content filter');
    }
  };

  const handleToggleFilter = async (filterId: string, isActive: boolean) => {
    try {
      await contentModerationService.updateContentFilter(filterId, { is_active: isActive });
      setFilters(prev => prev.map(filter => 
        filter.id === filterId ? { ...filter, is_active: isActive } : filter
      ));
    } catch (error) {
      console.error('Error updating content filter:', error);
      Alert.alert('Error', 'Failed to update content filter');
    }
  };

  const handleDeleteFilter = (filterId: string) => {
    Alert.alert(
      'Delete Filter',
      'Are you sure you want to delete this content filter?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await contentModerationService.deleteContentFilter(filterId);
              setFilters(prev => prev.filter(filter => filter.id !== filterId));
              Alert.alert('Success', 'Content filter deleted successfully');
            } catch (error) {
              console.error('Error deleting content filter:', error);
              Alert.alert('Error', 'Failed to delete content filter');
            }
          },
        },
      ]
    );
  };

  const getFilterTypeIcon = (type: ContentFilter['filter_type']) => {
    switch (type) {
      case 'keyword':
        return 'text-outline';
      case 'user':
        return 'person-outline';
      case 'category':
        return 'folder-outline';
      default:
        return 'filter-outline';
    }
  };

  const getFilterTypeName = (type: ContentFilter['filter_type']) => {
    switch (type) {
      case 'keyword':
        return 'Keyword';
      case 'user':
        return 'User';
      case 'category':
        return 'Category';
      default:
        return 'Filter';
    }
  };

  const renderFilterItem = ({ item: filter }: { item: ContentFilter }) => (
    <View style={styles.filterItem}>
      <View style={styles.filterInfo}>
        <View style={styles.filterHeader}>
          <Ionicons 
            name={getFilterTypeIcon(filter.filter_type) as any} 
            size={20} 
            color="#5B21B6" 
          />
          <Text style={styles.filterType}>
            {getFilterTypeName(filter.filter_type)}
          </Text>
        </View>
        <Text style={styles.filterValue}>{filter.filter_value}</Text>
      </View>
      
      <View style={styles.filterActions}>
        <Switch
          value={filter.is_active}
          onValueChange={(value) => handleToggleFilter(filter.id, value)}
          trackColor={{ false: '#E5E5E7', true: '#5B21B6' }}
          thumbColor={filter.is_active ? '#FFFFFF' : '#FFFFFF'}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteFilter(filter.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddFilterForm = () => (
    <View style={styles.addFilterForm}>
      <Text style={styles.addFilterTitle}>Add New Filter</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Filter Type</Text>
        <View style={styles.typeSelector}>
          {(['keyword', 'user', 'category'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeOption,
                newFilter.type === type && styles.typeOptionSelected,
              ]}
              onPress={() => setNewFilter(prev => ({ ...prev, type }))}
            >
              <Text
                style={[
                  styles.typeText,
                  newFilter.type === type && styles.typeTextSelected,
                ]}
              >
                {getFilterTypeName(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Filter Value</Text>
        <TextInput
          style={styles.textInput}
          placeholder={`Enter ${newFilter.type} to filter...`}
          value={newFilter.value}
          onChangeText={(value) => setNewFilter(prev => ({ ...prev, value }))}
          maxLength={100}
        />
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setShowAddFilter(false);
            setNewFilter({ type: 'keyword', value: '' });
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddFilter}
        >
          <Text style={styles.addButtonText}>Add Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="filter-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Content Filters</Text>
      <Text style={styles.emptyStateText}>
        Add filters to hide content you don't want to see
      </Text>
      <TouchableOpacity 
        style={styles.addFirstButton} 
        onPress={() => setShowAddFilter(true)}
      >
        <Text style={styles.addFirstButtonText}>Add Your First Filter</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#5B21B6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Content Filters</Text>
          <TouchableOpacity 
            onPress={() => setShowAddFilter(true)} 
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#5B21B6" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading content filters...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5B21B6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Filters</Text>
        <TouchableOpacity 
          onPress={() => setShowAddFilter(true)} 
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#5B21B6" />
        </TouchableOpacity>
      </View>

      {showAddFilter && renderAddFilterForm()}

      <FlatList
        data={filters}
        renderItem={renderFilterItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          filters.length === 0 && styles.emptyListContainer,
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
  addButton: {
    padding: 8,
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
  addFilterForm: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  addFilterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    alignItems: 'center',
  },
  typeOptionSelected: {
    borderColor: '#5B21B6',
    backgroundColor: '#F3F4F6',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  typeTextSelected: {
    color: '#5B21B6',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#5B21B6',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterInfo: {
    flex: 1,
    marginRight: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  filterType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5B21B6',
    marginLeft: 8,
  },
  filterValue: {
    fontSize: 16,
    color: '#000',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
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
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
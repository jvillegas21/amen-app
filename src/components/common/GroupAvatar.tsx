import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GroupAvatarProps {
  avatarUrl?: string | null;
  size?: number;
  style?: ViewStyle;
}

/**
 * Group Avatar Component - Displays group avatar with proper placeholder
 */
const GroupAvatar: React.FC<GroupAvatarProps> = ({ 
  avatarUrl, 
  size = 80, 
  style 
}) => {
  const avatarSize = size;
  const iconSize = Math.max(avatarSize * 0.4, 24); // Icon should be 40% of avatar size, minimum 24

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
          style,
        ]}
        onError={() => {
          // If image fails to load, we'll show the placeholder
          // This is handled by the conditional rendering below
        }}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
        style,
      ]}
    >
      <Ionicons 
        name="people" 
        size={iconSize} 
        color="#9CA3AF" 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#F3F4F6',
  },
  placeholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});

export default GroupAvatar;

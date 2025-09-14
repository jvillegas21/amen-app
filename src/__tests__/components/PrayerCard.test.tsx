import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PrayerCard from '@/components/prayer/PrayerCard';

const mockPrayer = {
  id: '1',
  text: 'Test prayer request',
  user: {
    id: 'user1',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  created_at: '2024-01-01T00:00:00Z',
  prayer_count: 5,
  comment_count: 2,
  share_count: 1,
  tags: ['healing', 'family'],
  is_anonymous: false,
};

describe('PrayerCard', () => {
  const mockOnPray = jest.fn();
  const mockOnComment = jest.fn();
  const mockOnShare = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders prayer text correctly', () => {
    const { getByText } = render(
      <PrayerCard
        prayer={mockPrayer}
        onPrayPress={mockOnPray}
        onCommentPress={mockOnComment}
        onSharePress={mockOnShare}
      />
    );

    expect(getByText('Test prayer request')).toBeTruthy();
  });

  it('renders user information correctly', () => {
    const { getByText } = render(
      <PrayerCard
        prayer={mockPrayer}
        onPrayPress={mockOnPray}
        onCommentPress={mockOnComment}
        onSharePress={mockOnShare}
      />
    );

    expect(getByText('Test User')).toBeTruthy();
  });

  it('renders interaction counts correctly', () => {
    const { getByText } = render(
      <PrayerCard
        prayer={mockPrayer}
        onPrayPress={mockOnPray}
        onCommentPress={mockOnComment}
        onSharePress={mockOnShare}
      />
    );

    expect(getByText('5')).toBeTruthy(); // prayer count
    expect(getByText('2')).toBeTruthy(); // comment count
    expect(getByText('1')).toBeTruthy(); // share count
  });

  it('calls onPrayPress when pray button is pressed', () => {
    const { getByTestId } = render(
      <PrayerCard
        prayer={mockPrayer}
        onPrayPress={mockOnPray}
        onCommentPress={mockOnComment}
        onSharePress={mockOnShare}
      />
    );

    fireEvent.press(getByTestId('pray-button'));
    expect(mockOnPray).toHaveBeenCalledWith('1');
  });

  it('calls onCommentPress when comment button is pressed', () => {
    const { getByTestId } = render(
      <PrayerCard
        prayer={mockPrayer}
        onPrayPress={mockOnPray}
        onCommentPress={mockOnComment}
        onSharePress={mockOnShare}
      />
    );

    fireEvent.press(getByTestId('comment-button'));
    expect(mockOnComment).toHaveBeenCalledWith('1');
  });

  it('calls onSharePress when share button is pressed', () => {
    const { getByTestId } = render(
      <PrayerCard
        prayer={mockPrayer}
        onPrayPress={mockOnPray}
        onCommentPress={mockOnComment}
        onSharePress={mockOnShare}
      />
    );

    fireEvent.press(getByTestId('share-button'));
    expect(mockOnShare).toHaveBeenCalledWith('1');
  });

  it('renders tags correctly', () => {
    const { getByText } = render(
      <PrayerCard
        prayer={mockPrayer}
        onPrayPress={mockOnPray}
        onCommentPress={mockOnComment}
        onSharePress={mockOnShare}
      />
    );

    expect(getByText('#healing')).toBeTruthy();
    expect(getByText('#family')).toBeTruthy();
  });

  it('shows anonymous indicator when prayer is anonymous', () => {
    const anonymousPrayer = { ...mockPrayer, is_anonymous: true };
    
    const { getByText } = render(
      <PrayerCard
        prayer={anonymousPrayer}
        onPrayPress={mockOnPray}
        onCommentPress={mockOnComment}
        onSharePress={mockOnShare}
      />
    );

    expect(getByText('Anonymous')).toBeTruthy();
  });
});

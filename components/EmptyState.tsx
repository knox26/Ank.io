import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
}

/**
 * Reusable empty state component for when lists/charts have no data.
 */
export const EmptyState = React.memo(
  ({ icon: Icon, title, subtitle }: EmptyStateProps) => {
    return (
      <View
        className="flex-1 items-center justify-center py-24 px-8"
        accessibilityRole="text"
        accessibilityLabel={`${title}. ${subtitle ?? ''}`}
      >
        {Icon && (
          <View className="mb-4 bg-gray-100 dark:bg-slate-800 p-4 rounded-2xl">
            <Icon size={32} color="#94a3b8" />
          </View>
        )}
        <Text className="text-gray-500 dark:text-gray-400 text-lg font-semibold text-center">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-gray-400 dark:text-gray-500 text-sm mt-2 text-center">
            {subtitle}
          </Text>
        )}
      </View>
    );
  }
);

EmptyState.displayName = 'EmptyState';

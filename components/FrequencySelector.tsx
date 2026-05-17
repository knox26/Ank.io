import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Frequency = 'daily' | 'weekly' | 'monthly';

interface FrequencySelectorProps {
  selected: Frequency;
  onSelect: (freq: Frequency) => void;
}

const FREQUENCIES: readonly Frequency[] = ['daily', 'weekly', 'monthly'] as const;

export function FrequencySelector({ selected, onSelect }: FrequencySelectorProps) {
  return (
    <View className="mb-6">
      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        Frequency
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {FREQUENCIES.map((freq) => (
          <Pressable
            key={freq}
            onPress={() => onSelect(freq)}
            className={`px-4 py-2 rounded-full border ${
              selected === freq
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
            }`}
            accessibilityRole="button"
            accessibilityLabel={`Frequency: ${freq}`}
            accessibilityState={{ selected: selected === freq }}
          >
            <Text
              className={`capitalize ${
                selected === freq
                  ? 'text-white'
                  : 'text-slate-700 dark:text-slate-300'
              } font-medium`}
            >
              {freq}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

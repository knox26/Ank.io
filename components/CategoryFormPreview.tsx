import { Layers } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { CATEGORY_ICONS } from '../constants/Icons';

interface CategoryFormPreviewProps {
  name: string;
  selectedIcon: string;
  selectedColor: string;
}

export const CategoryFormPreview = React.memo(
  ({ name, selectedIcon, selectedColor }: CategoryFormPreviewProps) => (
    <View className="items-center justify-center mb-8">
      <View
        className="w-24 h-24 rounded-3xl items-center justify-center shadow-lg"
        style={{ backgroundColor: selectedColor }}
      >
        {React.createElement(
          CATEGORY_ICONS.find((i) => i.name === selectedIcon)?.icon ||
            Layers,
          { size: 48, color: '#fff' }
        )}
      </View>
      <Text className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
        {name || 'Label'}
      </Text>
    </View>
  )
);

CategoryFormPreview.displayName = 'CategoryFormPreview';

import { Layers } from 'lucide-react-native';
import React from 'react';
import { ICON_MAP } from '../constants/Icons';

interface CategoryIconProps {
  /** The icon name string stored in the category record */
  name: string;
  /** Icon color */
  color: string;
  /** Icon size in pixels */
  size?: number;
}

/**
 * Renders a category icon from the icon registry.
 * Falls back to Layers icon if the name is not found.
 * Memoized to prevent unnecessary re-renders in lists.
 */
export const CategoryIcon = React.memo(
  ({ name, color, size = 20 }: CategoryIconProps) => {
    const Icon = ICON_MAP[name] || Layers;
    return <Icon size={size} color={color} />;
  }
);

CategoryIcon.displayName = 'CategoryIcon';

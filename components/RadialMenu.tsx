import { useTheme } from '../hooks/useTheme';
import { formatCurrency } from '../lib/currency';
import { Category, ExpenseTemplate } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { FAB_CENTER_OFFSET_FROM_VISUAL_BOTTOM } from '../constants/Layout';
import React, { useEffect, useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface RadialMenuProps {
  templates: ExpenseTemplate[];
  categories: ReadonlyMap<number, Category>;
  currency: string;
  highlightedId: number | null;
  /** Called once on mount with exact center positions (pure math, no measurement) */
  onRegisterPositions: (items: { id: number; x: number; y: number }[]) => void;
  /** Bottom safe-area inset for nav bar clearance */
  bottomInset?: number;
}

const ARC_RADIUS = 130;
const ITEM_SIZE = 64;

function computeArcCenters(
  templates: ExpenseTemplate[],
  arcCenterX: number,
  arcCenterY: number
): { id: number; x: number; y: number }[] {
  const total = templates.length;
  if (total === 0) return [];

  // Semi-circle from ~200° to ~340°
  const startAngle = Math.PI * 1.1;
  const endAngle = Math.PI * 1.9;

  return templates.map((t, index) => {
    const angle =
      total === 1
        ? Math.PI * 1.5
        : startAngle + (endAngle - startAngle) * (index / (total - 1));

    return {
      id: t.id,
      // Center of item (not top-left corner)
      x: arcCenterX + ARC_RADIUS * Math.cos(angle),
      y: arcCenterY + ARC_RADIUS * Math.sin(angle),
    };
  });
}

export function RadialMenu({
  templates,
  categories,
  currency,
  highlightedId,
  onRegisterPositions,
  bottomInset = 0,
}: RadialMenuProps) {
  const { isDark } = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  // Reactive to screen size changes (rotation, split-screen, foldables)
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const arcCenterX = screenWidth / 2;
  const arcCenterY = screenHeight - FAB_CENTER_OFFSET_FROM_VISUAL_BOTTOM - bottomInset;
  const centers = useMemo(
    () => computeArcCenters(templates, arcCenterX, arcCenterY),
    [templates, arcCenterX, arcCenterY]
  );

  useEffect(() => {
    onRegisterPositions(centers);
  }, [centers, onRegisterPositions]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const arcStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Build items with corner positions (for rendering)
  const items = templates.map((template, index) => {
    const center = centers[index];
    const category = categories.get(template.category_id ?? -1);
    return {
      template,
      category,
      // top-left corner for absolute positioning
      left: center.x - ITEM_SIZE / 2,
      top: center.y - ITEM_SIZE / 2,
    };
  });

  return (
    <Animated.View
      accessibilityViewIsModal
      accessibilityLabel="Template quick-add menu. Select a template to add the expense."
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        },
        overlayStyle,
      ]}
      pointerEvents="box-none"
    >
      {/* Dark backdrop — decorative, accessibilityViewIsModal on parent handles focus trap */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
        }}
      />

      {/* Template items */}
      <Animated.View
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, arcStyle]}
        pointerEvents="box-none"
      >
        {items.map((item) => {
          const isHighlighted = item.template.id === highlightedId;
          const catColor = item.category?.color ?? '#94a3b8';

          return (
            <View
              key={item.template.id}
              accessibilityRole="button"
              accessibilityLabel={`Quick-add ${item.template.name}: ${formatCurrency(item.template.amount, currency)}`}
              accessibilityHint="Adds this expense immediately"
              style={{
                position: 'absolute',
                left: item.left,
                top: item.top,
                width: ITEM_SIZE,
                height: ITEM_SIZE,
              }}
            >
              <View
                style={{
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                  borderRadius: ITEM_SIZE / 2,
                  backgroundColor: isHighlighted
                    ? catColor
                    : (isDark ? '#1e293b' : '#f1f5f9'),
                  borderWidth: 2,
                  borderColor: isHighlighted
                    ? catColor
                    : (isDark ? '#334155' : '#cbd5e1'),
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: isHighlighted ? 1.15 : 1 }],
                  shadowColor: isHighlighted ? catColor : '#000',
                  shadowOffset: { width: 0, height: isHighlighted ? 6 : 2 },
                  shadowOpacity: isHighlighted ? 0.5 : 0.08,
                  shadowRadius: isHighlighted ? 14 : 4,
                  elevation: isHighlighted ? 10 : 2,
                }}
              >
                <CategoryIcon
                  name={item.category?.icon ?? 'layers'}
                  color={isHighlighted ? '#fff' : catColor}
                  size={isHighlighted ? 18 : 20}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    color: isHighlighted ? '#ffffff' : (isDark ? '#e2e8f0' : '#334155'),
                    fontSize: 10,
                    fontWeight: '700',
                    marginTop: 1,
                  }}
                >
                  {formatCurrency(item.template.amount, currency)}
                </Text>
              </View>
              <View
                style={{
                  position: 'absolute',
                  top: ITEM_SIZE + 4,
                  left: -20,
                  width: ITEM_SIZE + 40,
                  alignItems: 'center',
                }}
                pointerEvents="none"
              >
                <Text
                  numberOfLines={1}
                  style={{
                    color: isHighlighted ? '#ffffff' : '#f1f5f9',
                    fontSize: 12,
                    fontWeight: isHighlighted ? '800' : '600',
                    textAlign: 'center',
                  }}
                >
                  {item.template.name}
                </Text>
              </View>
            </View>
          );
        })}
      </Animated.View>

      {/* Empty state */}
      {templates.length === 0 && (
        <View
          style={{
            position: 'absolute',
            top: arcCenterY - 60,
            left: 40,
            right: 40,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
            No templates yet
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
            Create a template from the home screen to use quick-add
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

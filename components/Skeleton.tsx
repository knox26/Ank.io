import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

// ─── Base Skeleton Bone ──────────────────────────────────────────

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * A single shimmer "bone" — an animated placeholder rectangle.
 * Uses Reanimated for smooth 60fps animation.
 */
export const Skeleton = React.memo(
  ({ width, height, borderRadius = 8, style }: SkeletonProps) => {
    const shimmer = useSharedValue(0);

    useEffect(() => {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1200 }),
        -1, // infinite
        true // reverse
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
    }));

    return (
      <Animated.View
        style={[
          {
            width,
            height,
            borderRadius,
            backgroundColor: '#e2e8f0', // slate-200
          },
          animatedStyle,
          style,
        ]}
        className="dark:bg-slate-800"
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// ─── Home Screen Skeleton ────────────────────────────────────────

export const HomeSkeleton = () => (
  <View className="flex-1 bg-gray-50 dark:bg-slate-950 p-4">
    {/* Total Spent Card */}
    <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 mb-4">
      <Skeleton width={180} height={14} borderRadius={4} />
      <View style={{ marginTop: 12 }}>
        <Skeleton width={200} height={36} borderRadius={6} />
      </View>
      <View style={{ marginTop: 20 }}>
        <View className="flex-row justify-between mb-2">
          <Skeleton width={100} height={10} borderRadius={4} />
          <Skeleton width={30} height={10} borderRadius={4} />
        </View>
        <Skeleton width="100%" height={12} borderRadius={6} />
      </View>
    </View>

    {/* Action Buttons */}
    <View className="flex-row gap-2 mb-4">
      <View className="flex-1">
        <Skeleton width="100%" height={48} borderRadius={12} />
      </View>
      <View className="flex-1">
        <Skeleton width="100%" height={48} borderRadius={12} />
      </View>
    </View>

    {/* Categories Label */}
    <Skeleton width={100} height={20} borderRadius={4} style={{ marginBottom: 16 }} />

    {/* Category Grid */}
    <View className="flex-row flex-wrap justify-between">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View
          key={i}
          className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 border border-gray-100 dark:border-slate-800"
          style={{ width: '48%' }}
        >
          <View className="flex-row justify-between mb-3">
            <Skeleton width={36} height={36} borderRadius={8} />
            <Skeleton width={40} height={16} borderRadius={4} />
          </View>
          <Skeleton width={80} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width={60} height={10} borderRadius={4} />
        </View>
      ))}
    </View>
  </View>
);

// ─── Expenses Screen Skeleton ────────────────────────────────────

export const ExpensesSkeleton = () => (
  <View className="flex-1 bg-gray-50 dark:bg-slate-950">
    {/* Filter Bar */}
    <View className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Skeleton width={18} height={18} borderRadius={4} />
          <Skeleton width={50} height={12} borderRadius={4} style={{ marginLeft: 8 }} />
        </View>
        <Skeleton width={50} height={14} borderRadius={4} />
      </View>
    </View>

    {/* Expense List */}
    <View className="px-4 mt-4">
      {/* Date Header */}
      <Skeleton width={120} height={12} borderRadius={4} style={{ marginBottom: 12 }} />

      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View
          key={i}
          className="flex-row items-center bg-white dark:bg-slate-900 p-4 mb-2 rounded-xl border border-gray-100 dark:border-slate-800"
        >
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Skeleton width={100} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width={140} height={12} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width={60} height={10} borderRadius={4} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Skeleton width={60} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width={16} height={16} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  </View>
);

// ─── Analytics Screen Skeleton ───────────────────────────────────

export const AnalyticsSkeleton = () => (
  <View className="flex-1 bg-gray-50 dark:bg-slate-950 p-3">
    {/* Pie Chart Card */}
    <View className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 items-center mb-4">
      <Skeleton width={250} height={20} borderRadius={4} style={{ alignSelf: 'flex-start', marginBottom: 16 }} />
      <Skeleton width={180} height={180} borderRadius={90} />
      <View className="flex-row flex-wrap mt-4" style={{ gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width={100} height={32} borderRadius={12} />
        ))}
      </View>
    </View>

    {/* Bar Chart Card */}
    <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
      <Skeleton width={220} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
      <View className="flex-row items-end justify-between" style={{ height: 200, paddingTop: 20 }}>
        {[80, 120, 60, 160, 100, 140].map((h, i) => (
          <Skeleton key={i} width={22} height={h} borderRadius={4} />
        ))}
      </View>
    </View>
  </View>
);

// ─── Budget Screen Skeleton ──────────────────────────────────────

export const BudgetSkeleton = () => (
  <View className="flex-1 bg-gray-50 dark:bg-slate-950 p-4">
    {/* Currency Selector */}
    <Skeleton width={130} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
    <View className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-100 dark:border-slate-800 mb-4">
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', padding: 12 }}>
            <Skeleton width={24} height={24} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>

    {/* Info Box */}
    <Skeleton width="100%" height={60} borderRadius={12} style={{ marginBottom: 16 }} />

    {/* Category Budget Items */}
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <View
        key={i}
        className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 flex-row items-center justify-between mb-2"
      >
        <View className="flex-row items-center flex-1">
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
          <View>
            <Skeleton width={80} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width={60} height={12} borderRadius={4} />
          </View>
        </View>
        <Skeleton width={56} height={36} borderRadius={8} />
      </View>
    ))}
  </View>
);

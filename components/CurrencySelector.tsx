import React from 'react';
import { Pressable, Text, View } from 'react-native';

const currencies = ['$', '€', '₹', '£', '¥'];

interface CurrencySelectorProps {
  currency: string;
  onSelect: (currency: string) => void;
  isDark: boolean;
}

export const CurrencySelector = React.memo(
  ({ currency, onSelect, isDark }: CurrencySelectorProps) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
        Display Currency
      </Text>
      <View className="flex-row items-center bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
        {currencies.map((curr) => {
          const isActive = currency === curr;
          const activeBg = isDark ? '#ffffff' : '#404040';
          const activeText = isDark ? '#000000' : '#ffffff';
          const inactiveText = isDark ? '#a3a3a3' : '#737373';

          return (
            <Pressable
              key={curr}
              onPress={() => onSelect(curr)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 12,
                borderRadius: 8,
                backgroundColor: isActive ? activeBg : 'transparent',
              }}
              accessibilityRole="button"
              accessibilityLabel={`Select ${curr} currency`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: isActive ? activeText : inactiveText,
                }}
              >
                {curr}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  )
);

CurrencySelector.displayName = 'CurrencySelector';

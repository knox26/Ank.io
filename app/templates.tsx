import { StatusBar } from 'expo-status-bar';
import { ClipboardList } from 'lucide-react-native';
import React from 'react';
import {
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { TemplateItem } from '../components/TemplateItem';
import { EmptyState } from '../components/EmptyState';
import { useTemplateList } from '../hooks/useTemplateList';
import { useCategoryStore } from '../store/useCategoryStore';

export default function TemplatesScreen() {
  const {
    templates,
    isLoading,
    categoryMap,
    currency,
    handleDelete,
    handleEdit,
    handleUseTemplate,
    onRefresh,
  } = useTemplateList();
  const categories = useCategoryStore((s) => s.categories);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-950" edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View className="px-4 pt-4 pb-3">
        <Text className="text-xl font-bold text-slate-800 dark:text-white">
          Expense Templates
        </Text>
      </View>

      <View className="flex-1 px-4 pt-4">
        <FlashList
          data={templates}
          keyExtractor={(item) => item.id.toString()}
          refreshing={isLoading}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TemplateItem
              template={item}
              category={categoryMap.get(item.category_id ?? -1)}
              currency={currency}
              onPress={handleUseTemplate}
              onEdit={handleEdit}
              onDelete={(template) => handleDelete(template.id)}
              onSwipeDelete={(template) => handleDelete(template.id)}
            />
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View className="mt-20">
                <EmptyState
                  icon={ClipboardList}
                  title="No expense templates"
                  subtitle="Save an expense as a template from the add screen"
                />
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

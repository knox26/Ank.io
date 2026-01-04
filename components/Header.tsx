import { Moon, Sun } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Expense Tracker",
}) => {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <SafeAreaView
      edges={["top"]}
      className="bg-gray-50 dark:bg-slate-950 border-b border-gray-50 dark:border-slate-950 shadow-sm"
    >
      <View className="flex-row items-center justify-between px-4 py-3 h-14">
        <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {title}
        </Text>
        <TouchableOpacity
          onPress={toggleColorScheme}
          className="p-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800"
        >
          {colorScheme === "dark" ? (
            <Sun size={24} color="#FFFFFF" />
          ) : (
            <Moon size={24} color="#475569" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

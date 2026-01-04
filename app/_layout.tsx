import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Heart } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import "../global.css";
import { useStore } from "../store/useStore";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf"),
  });

  const { initializeApp, isLoading } = useStore();
  const { colorScheme } = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (loaded && !isLoading) {
      SplashScreen.hideAsync();

      // Keep the custom splash for 2.5 seconds
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [loaded, isLoading]);

  if (!loaded || isLoading) {
    return null;
  }

  const isDark = colorScheme === "dark";

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <View className="flex-1">
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="add-category"
            options={{ presentation: "modal", headerShown: false }}
          />
        </Stack>

        {showSplash && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut.duration(500)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
            }}
            className="bg-white dark:bg-slate-950 items-center justify-center"
          >
            <Animated.View
              entering={FadeIn.delay(200).duration(800)}
              className="items-center"
            >
              <View className="flex-row items-center mb-1">
                <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium tracking-widest uppercase">
                  made with{" "}
                </Text>
                <Heart size={12} color="#ef4444" fill="#ef4444" />
                <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium tracking-widest uppercase">
                  {" "}
                  by
                </Text>
              </View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Bhavitavya Jadhav
              </Text>

              <View className="absolute -bottom-24">
                <View className="flex-row space-x-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-600/60 animate-pulse" />
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-600/30 animate-pulse" />
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </ThemeProvider>
  );
}

import { Tabs, router } from "expo-router";
import { Home, List, PieChart, Plus, Wallet } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Platform, TouchableOpacity, View } from "react-native";
import { CurvedTabBarBackground } from "../../components/CurvedTabBarBackground";
import { Header } from "../../components/Header";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const activeColor = isDark ? "#fff" : "#0f172a";
  const inactiveColor = isDark ? "#64748b" : "#94a3b8";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === "ios" ? 100 : 80,
          paddingBottom: Platform.OS === "ios" ? 35 : 20,
          paddingTop: 10,
        },
        tabBarBackground: () => <CurvedTabBarBackground />,
        header: ({ options }) => <Header title={options.title} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => <PieChart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add Expense",
          tabBarButton: (props) => {
            const { delayLongPress, disabled, onBlur, ...rest } = props;
            return (
              <TouchableOpacity
                {...rest}
                disabled={disabled === null ? undefined : disabled}
                delayLongPress={
                  typeof delayLongPress === "number"
                    ? delayLongPress
                    : undefined
                }
                style={{
                  top: -32,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => router.push("/modal")}
              >
                <View
                  className="bg-slate-700 dark:bg-white rounded-full w-16 h-16 items-center justify-center shadow-lg shadow-black/20 dark:shadow-white/20"
                  style={{
                    elevation: 8,
                    shadowColor: isDark ? "#fff" : "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                  }}
                >
                  <Plus
                    size={32}
                    color={isDark ? "#000" : "#fff"}
                    strokeWidth={2.5}
                  />
                </View>
              </TouchableOpacity>
            );
          },
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color }) => <List size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

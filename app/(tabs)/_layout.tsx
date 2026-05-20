import { Tabs, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Home, List, PieChart, Plus, Wallet } from 'lucide-react-native';
import { Platform, View, PanResponder } from 'react-native';
import { CurvedTabBarBackground } from '../../components/CurvedTabBarBackground';
import { Header } from '../../components/Header';
import { useTheme } from '../../hooks/useTheme';
import { RadialMenu } from '../../components/RadialMenu';
import { useTemplateStore } from '../../store/useTemplateStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useExpenseStore } from '../../store/useExpenseStore';
import { ExpenseTemplate } from '../../types';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface TemplatePos {
  id: number;
  x: number;
  y: number;
}

const LONG_PRESS_MS = 600;
const TAP_MOVE_SLOP = 8; // px — ignore micro-moves below this to avoid dead taps on sensitive digitizers

export default function TabLayout() {
  const { isDark, colors } = useTheme();

  const templates = useTemplateStore((s) => s.templates);
  const categoryMap = useCategoryStore((s) => s.categoryMap);
  const currency = useSettingsStore((s) => s.currency);
  const dismissTemplateHint = useSettingsStore((s) => s.dismissTemplateHint);

  const [radialVisible, setRadialVisible] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Refs — avoid stale closures inside PanResponder callbacks
  const radialVisibleRef = useRef(false);
  const highlightedIdRef = useRef<number | null>(null);
  const templatePositionsRef = useRef<TemplatePos[]>([]);
  const templatesRef = useRef<ExpenseTemplate[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMovedRef = useRef(false);
  const grantPageXRef = useRef(0);
  const grantPageYRef = useRef(0);

  useEffect(() => { radialVisibleRef.current = radialVisible; }, [radialVisible]);
  useEffect(() => { highlightedIdRef.current = highlightedId; }, [highlightedId]);
  useEffect(() => { templatesRef.current = templates; }, [templates]);

  const handleRegisterPositions = useCallback((positions: TemplatePos[]) => {
    templatePositionsRef.current = positions;
  }, []);

  const dismissRadial = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setRadialVisible(false);
    setHighlightedId(null);
    hasMovedRef.current = false;
  }, []);

  // PanResponder for the "+" button — created once, stable
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => !radialVisibleRef.current,

      onPanResponderGrant: (evt) => {
        hasMovedRef.current = false;
        grantPageXRef.current = evt.nativeEvent.pageX;
        grantPageYRef.current = evt.nativeEvent.pageY;

        timerRef.current = setTimeout(() => {
          setRadialVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        }, LONG_PRESS_MS);
      },

      onPanResponderMove: (evt) => {
        const dx = evt.nativeEvent.pageX - grantPageXRef.current;
        const dy = evt.nativeEvent.pageY - grantPageYRef.current;
        if (Math.hypot(dx, dy) > TAP_MOVE_SLOP) {
          hasMovedRef.current = true;
        }

        if (!radialVisibleRef.current) return;

        const { pageX, pageY } = evt.nativeEvent;
        const positions = templatePositionsRef.current;
        const count = positions.length;
        if (count === 0) return;

        // Dynamic threshold: ~65% of inter-item spacing, clamped to 30–80px
        let threshold = 80;
        if (count > 1) {
          const first = positions[0];
          const last = positions[count - 1];
          const arcSpan = Math.hypot(last.x - first.x, last.y - first.y);
          const avgSpacing = arcSpan / (count - 1);
          threshold = Math.max(30, Math.min(80, avgSpacing * 0.65));
        }

        let closestId: number | null = null;
        let closestDist = Infinity;

        for (const pos of positions) {
          const dist = Math.hypot(pageX - pos.x, pageY - pos.y);
          if (dist < closestDist && dist < threshold) {
            closestDist = dist;
            closestId = pos.id;
          }
        }
        setHighlightedId(closestId);
      },

      onPanResponderRelease: () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        const wasRadial = radialVisibleRef.current;
        const selectedId = highlightedIdRef.current;

        if (wasRadial && selectedId !== null) {
          const template = templatesRef.current.find((t) => t.id === selectedId);
          if (template && template.category_id !== null) {
            useExpenseStore.getState().addExpense({
              amount: template.amount,
              category_id: template.category_id,
              date: new Date().toISOString(),
              note: template.note || undefined,
              is_recurring: false,
              recurrence_frequency: null,
              recurring_template_id: null,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            // First template use — dismiss onboarding hint
            dismissTemplateHint();
          }
        } else if (!wasRadial && !hasMovedRef.current) {
          // Quick tap (no hold, no significant move) → normal add modal
          router.push('/modal');
        }

        setRadialVisible(false);
        setHighlightedId(null);
        hasMovedRef.current = false;
      },

      onPanResponderTerminate: () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setRadialVisible(false);
        setHighlightedId(null);
        hasMovedRef.current = false;
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.active,
          tabBarInactiveTintColor: colors.inactive,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: Platform.OS === 'ios' ? 100 : 80,
            paddingBottom: Platform.OS === 'ios' ? 35 : 20,
            paddingTop: 10,
          },
          tabBarBackground: () => <CurvedTabBarBackground />,
          header: ({ options }) => <Header title={options.title} />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color }) => <PieChart size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Add Expense',
            tabBarButton: () => (
              <View
                {...panResponder.panHandlers}
                style={{
                  top: -32,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Add new expense"
                accessibilityHint="Double-tap and hold to open the template quick-add menu"
              >
                <View
                  pointerEvents="none"
                  className="bg-slate-700 dark:bg-white rounded-full w-16 h-16 items-center justify-center shadow-lg shadow-black/20 dark:shadow-white/20"
                  style={{
                    elevation: 8,
                    shadowColor: isDark ? '#fff' : '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                  }}
                >
                  <Plus
                    size={32}
                    color={isDark ? '#000' : '#fff'}
                    strokeWidth={2.5}
                  />
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: 'Expenses',
            tabBarIcon: ({ color }) => <List size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: 'Budget',
            tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
          }}
        />
      </Tabs>

      {radialVisible && (
        <RadialMenu
          templates={templates}
          categories={categoryMap}
          currency={currency}
          highlightedId={highlightedId}
          onRegisterPositions={handleRegisterPositions}
        />
      )}
    </View>
  );
}

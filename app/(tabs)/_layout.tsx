import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import React, { useState } from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeColor = '#2563eb'; // xanh đậm
  const inactiveColor = '#6b7280'; // xám nhạt

  const [unreadCount] = useState<number>(10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: '#f8fafc',
        },
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'New Feed',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="newspaper.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notification',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="bell.fill" color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="person.crop.circle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

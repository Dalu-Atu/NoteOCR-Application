import React from "react";
import { Redirect, Tabs, useRouter } from "expo-router";
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";

import { useAuth } from "../../contexts/AuthContext";

export default function TabLayout() {
  const router = useRouter();
  const { isLoading, isAuthenticated, hasOnboarded } = useAuth();

  // Still checking AsyncStorage for a stored session/onboarding flag —
  // show a blank loading state rather than flashing the tabs then
  // redirecting a moment later.
  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Gate order matters: onboarding first (every new install), then auth.
  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }
  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  // Authenticated + onboarded — render the real tab bar (unchanged from
  // what you already had).
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: "#2563eb",
          tabBarInactiveTintColor: "#64748b",
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="documents"
          options={{
            title: "Documents",
            tabBarIcon: ({ color }) => (
              <Ionicons name="document-text-outline" size={22} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="scan"
          options={{
            title: "",
            tabBarButton: () => <View style={{ flex: 1 }} />,
          }}
        />

        <Tabs.Screen
          name="folders"
          options={{
            title: "Folders",
            tabBarIcon: ({ color }) => (
              <Feather name="folder" size={21} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            tabBarIcon: ({ color }) => (
              <Feather name="more-horizontal" size={22} color={color} />
            ),
          }}
        />
      </Tabs>

      <View style={styles.floatingButtonContainer} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/scan")}
          style={styles.floatingButtonWrapper}
        >
          <View style={styles.floatingButton}>
            <Feather name="plus" size={26} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 0,
    borderTopColor: "#ffffff",
    height: Platform.OS === "ios" ? 85 : 68,
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBarItem: {
    paddingBottom: 2,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
  floatingButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Platform.OS === "ios" ? 58 : 42,
    alignItems: "center",
    zIndex: 20,
  },
  floatingButtonWrapper: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingButton: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
});

import React from "react";
import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";

export default function TabLayout() {
  const router = useRouter();

  return (
    // Wrapping View lets us layer the floating button ON TOP of the tab bar
    // as a completely separate element, instead of fighting the tab bar's
    // own clipping/overflow behavior.
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
        {/* 1. Home */}
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

        {/* 2. Documents */}
        <Tabs.Screen
          name="documents"
          options={{
            title: "Documents",
            tabBarIcon: ({ color }) => (
              <Ionicons name="document-text-outline" size={22} color={color} />
            ),
          }}
        />

        {/* 3. Scan slot — reserves the middle column but renders nothing itself.
               The visible circle is drawn separately below as an overlay. */}
        <Tabs.Screen
          name="scan"
          options={{
            title: "",
            // flex: 1 keeps this tab occupying equal width so Documents/Folders
            // don't drift toward the center. tabBarButton returning a plain
            // View (no Pressable) means tapping here does nothing — the real
            // tap target is the overlay TouchableOpacity below.
            tabBarButton: () => <View style={{ flex: 1 }} />,
          }}
        />

        {/* 4. Folders */}
        <Tabs.Screen
          name="folders"
          options={{
            title: "Folders",
            tabBarIcon: ({ color }) => (
              <Feather name="folder" size={21} color={color} />
            ),
          }}
        />

        {/* 5. More */}
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

      {/* Floating button, rendered as a sibling ON TOP of <Tabs>, not inside
          the tab bar. This sidesteps all overflow/clipping quirks. */}
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
  // Full-width, transparent container that sits above the tab bar.
  // alignItems: 'center' centers the button horizontally without any
  // manual margin math.
  floatingButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Platform.OS === "ios" ? 58 : 42, // tunes how far it overlaps the bar
    alignItems: "center",
    zIndex: 20,
  },
  // White halo ring so the dark circle doesn't look like it's cutting
  // straight into the tab bar background.
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
  // Solid dark circle with the plus icon.
  floatingButton: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
});

import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { getTheme, AppTheme } from "../utils/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Slide = {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  stat: string;
};

const SLIDES: Slide[] = [
  {
    key: "accuracy",
    icon: "check-circle",
    title: "99.2% Accuracy",
    description:
      "Accurately converts handwritten notes or letters into a well formatted document instnatly",
    stat: "Recognized by 1000+ professionals",
  },
  {
    key: "format",
    icon: "layout",
    title: "Format Preserved",
    description:
      "Tables, bold text, structure and everything stays intact. Your document looks exactly as you wrote it.",
    stat: "Zero formatting loss",
  },
  {
    key: "export",
    icon: "download-cloud",
    title: "Export Anywhere",
    description:
      "Convert to Word, Excel, PDF, or plain text. Seamlessly integrate with your workflow.",
    stat: "4+ export formats",
  },
  {
    key: "security",
    icon: "lock",
    title: "Enterprise Security",
    description:
      "SOC 2 & GDPR compliant. Your data is encrypted and can only be accessed by you.",
    stat: "AES-256 encryption",
  },
];

export default function OnboardingScreen() {
  const { isDark } = useAppTheme();
  const { completeOnboarding } = useAuth();
  const router = useRouter();

  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  async function handleSkipOrFinish() {
    await completeOnboarding();
    router.replace("/auth");
  }

  function handleNext() {
    if (isLastSlide) {
      handleSkipOrFinish();
      return;
    }
    scrollRef.current?.scrollTo({
      x: (activeIndex + 1) * SCREEN_WIDTH,
      animated: true,
    });
  }

  function handleMomentumScrollEnd(e: any) {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={
              isDark
                ? require("../assets/images/logo-white.png")
                : require("../assets/images/logo-dark.png")
            }
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logo}>NoteOCR</Text>
        </View>

        <TouchableOpacity
          onPress={handleSkipOrFinish}
          style={styles.skipButton}
        >
          <Text style={[styles.skipText, isLastSlide && styles.skipTextHidden]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => (
          <View key={slide.key} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.slideContent}>
              <View style={styles.iconOuterRing}>
                <View style={styles.iconInnerCircle}>
                  <Feather name={slide.icon} size={42} color={theme.emerald} />
                </View>
              </View>

              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>

              <View style={styles.badge}>
                <Feather
                  name="zap"
                  size={14}
                  color={theme.emerald}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.badgeText}>{slide.stat}</Text>
              </View>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Footer Area */}
      <View style={styles.footer}>
        {/* Animated Dots */}
        <View style={styles.paginationContainer}>
          {SLIDES.map((_, i) => {
            const inputRange = [
              (i - 1) * SCREEN_WIDTH,
              i * SCREEN_WIDTH,
              (i + 1) * SCREEN_WIDTH,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });

            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });

            const dotColor = scrollX.interpolate({
              inputRange,
              outputRange: [
                theme.textSecondary,
                theme.emerald,
                theme.textSecondary,
              ],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: dotColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={handleNext}
        >
          <Text style={styles.primaryButtonText}>
            {isLastSlide ? "Get Started" : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 8,
    },
    logoContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    logoImage: {
      width: 24,
      height: 24,
      marginRight: 8,
    },
    logo: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    skipButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    skipText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    skipTextHidden: {
      opacity: 0,
    },
    scrollView: {
      flex: 1,
    },
    slide: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    slideContent: {
      alignItems: "center",
      width: "100%",
      transform: [{ translateY: -20 }],
    },
    iconOuterRing: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.emeraldChip,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 40,
    },
    iconInnerCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.bg,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.emerald,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.textPrimary,
      textAlign: "center",
      marginBottom: 16,
      letterSpacing: -0.5,
    },
    description: {
      fontSize: 16,
      lineHeight: 26,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 32,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 999,
      backgroundColor: theme.emeraldChip,
    },
    badgeText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.emerald,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 36,
      paddingTop: 16,
    },
    paginationContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
      height: 8,
    },
    dot: {
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    primaryButton: {
      backgroundColor: theme.emerald,
      borderRadius: 16,
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.emerald,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 5,
    },
    primaryButtonText: {
      color: "#ffffff",
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
  });
}

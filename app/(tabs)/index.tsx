// import { Feather } from "@expo/vector-icons";
// import {
//   Image,
//   Platform,
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   useColorScheme,
//   View,
// } from "react-native";

// export default function DashboardScreen() {
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === "light";

//   return (
//     <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
//       <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* 1. TOP NAVBAR */}
//         <View style={styles.headerBar}>
//           <View style={styles.logoContainer}>
//             <Image
//               source={
//                 isDark
//                   ? require("../../assets/images/logo-white.png")
//                   : require("../../assets/images/logo-dark.png")
//               }
//               style={styles.logoImage}
//               resizeMode="contain"
//             />
//             <Text style={[styles.logoText, isDark && styles.darkText]}>
//               NoteOCR
//             </Text>
//           </View>

//           <View style={styles.headerActions}>
//             <TouchableOpacity style={styles.iconButton}>
//               <Feather
//                 name="search"
//                 size={20}
//                 color={isDark ? "#f8fafc" : "#334155"}
//               />
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.iconButton}>
//               <Feather
//                 name="bell"
//                 size={20}
//                 color={isDark ? "#f8fafc" : "#334155"}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* 2. USER GREETING & AVATAR */}
//         <View style={styles.userSection}>
//           <View>
//             <Text style={[styles.greetingText, isDark && styles.darkText]}>
//               Hi, joe
//             </Text>
//             <Text style={styles.subGreetingText}>
//               Welcome back to your dashboard
//             </Text>
//           </View>

//           <Image
//             source={{
//               uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
//             }}
//             style={styles.avatar}
//           />
//         </View>

//         {/* 3. ACTION CARDS — modern color-coded style */}
//         <View style={styles.actionRow}>
//           {/* Card 1: Convert Handwriting — emerald accent (primary) */}
//           <TouchableOpacity
//             style={[styles.actionCard, { backgroundColor: "#ecfdf5" }]}
//             activeOpacity={0.85}
//             android_ripple={{ color: "#a7f3d0", borderless: false }}
//           >
//             <View style={styles.watermarkClip}>
//               <Feather
//                 name="edit-3"
//                 size={80}
//                 color="#10b981"
//                 style={styles.watermarkIcon}
//               />
//             </View>

//             <View style={styles.cardTopRow}>
//               <View style={[styles.iconBadge, { backgroundColor: "#10b981" }]}>
//                 <Feather name="edit-3" size={19} color="#ffffff" />
//               </View>
//               <View style={styles.chevronButton}>
//                 <Feather name="chevron-right" size={14} color="#10b981" />
//               </View>
//             </View>

//             <Text
//               style={styles.actionCardTitle}
//               numberOfLines={1}
//               adjustsFontSizeToFit
//               minimumFontScale={0.8}
//             >
//               Convert Handwriting
//             </Text>
//             <Text style={styles.actionCardSubtitle} numberOfLines={2}>
//               Upload images to convert them into editable documents.
//             </Text>
//           </TouchableOpacity>

//           {/* Card 2: Edit Document — amber accent (secondary) */}
//           <TouchableOpacity
//             style={[styles.actionCard, { backgroundColor: "#fffbeb" }]}
//             activeOpacity={0.85}
//             android_ripple={{ color: "#fde68a", borderless: false }}
//           >
//             <View style={styles.watermarkClip}>
//               <Feather
//                 name="file-text"
//                 size={80}
//                 color="#f59e0b"
//                 style={styles.watermarkIcon}
//               />
//             </View>

//             <View style={styles.cardTopRow}>
//               <View style={[styles.iconBadge, { backgroundColor: "#f59e0b" }]}>
//                 <Feather name="file-text" size={19} color="#ffffff" />
//               </View>
//               <View style={styles.chevronButton}>
//                 <Feather name="chevron-right" size={14} color="#f59e0b" />
//               </View>
//             </View>

//             <Text
//               style={styles.actionCardTitle}
//               numberOfLines={1}
//               adjustsFontSizeToFit
//               minimumFontScale={0.8}
//             >
//               Edit Document
//             </Text>
//             <Text style={styles.actionCardSubtitle} numberOfLines={2}>
//               Upload a document or start from a blank slate.
//             </Text>
//           </TouchableOpacity>
//         </View>
//         {/* 4. OVERVIEW SECTION */}
//         <View style={styles.overviewCard}>
//           <View style={styles.overviewHeader}>
//             <Text style={styles.overviewTitle}>Overview</Text>
//             <TouchableOpacity style={styles.periodPill} activeOpacity={0.7}>
//               <Text style={styles.periodPillText}>Monthly</Text>
//               <Feather name="chevron-down" size={14} color="#64748b" />
//             </TouchableOpacity>
//           </View>

//           {/* Stat tiles */}
//           <View style={styles.statRow}>
//             <View style={styles.statBox}>
//               <View
//                 style={[styles.statIconBadge, { backgroundColor: "#eff6ff" }]}
//               >
//                 <Feather name="file-text" size={15} color="#2563eb" />
//               </View>
//               <Text style={styles.statValue}>25</Text>
//               <Text style={styles.statLabel}>Total Documents</Text>
//             </View>

//             <View style={styles.statDivider} />

//             <View style={styles.statBox}>
//               <View
//                 style={[styles.statIconBadge, { backgroundColor: "#fff7ed" }]}
//               >
//                 <Feather name="folder" size={15} color="#f97316" />
//               </View>
//               <Text style={styles.statValue}>4</Text>
//               <Text style={styles.statLabel}>Total Folders</Text>
//             </View>
//           </View>

//           {/* Usage bar — flat, real-world SaaS style, not a gauge */}
//           <View style={styles.usageSection}>
//             <View style={styles.usageHeaderRow}>
//               <Text style={styles.usageLabel}>Page usage</Text>
//               <View style={styles.usagePercentPill}>
//                 <Text style={styles.usagePercentText}>28% used</Text>
//               </View>
//             </View>

//             <View style={styles.progressTrack}>
//               <View style={[styles.progressFill, { width: "28%" }]} />
//             </View>

//             <Text style={styles.usageSubtext}>
//               1,416 of 5,000 pages used · 3,584 remaining
//             </Text>

//             <View style={styles.usageButtonRow}>
//               <TouchableOpacity
//                 style={styles.primaryUsageButton}
//                 activeOpacity={0.85}
//               >
//                 <Feather name="plus" size={14} color="#ffffff" />
//                 <Text style={styles.primaryUsageButtonText}>
//                   Add More Pages
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.secondaryUsageButton}
//                 activeOpacity={0.85}
//               >
//                 <Text style={styles.secondaryUsageButtonText}>Manage Plan</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#f8fafc",
//     paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
//   },
//   darkSafeArea: {
//     backgroundColor: "#0f172a",
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 100,
//   },

//   /* HEADER NAVBAR */
//   headerBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 14,
//   },
//   logoContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   logoImage: {
//     width: 28,
//     height: 28,
//   },
//   logoText: {
//     fontSize: 20,
//     fontWeight: "800",
//     color: "#0f172a",
//     letterSpacing: -0.4,
//   },
//   headerActions: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//   },
//   iconButton: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   /* USER SECTION */
//   userSection: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginTop: 16,
//     marginBottom: 20,
//   },
//   greetingText: {
//     fontSize: 20,
//     fontWeight: "800",
//     color: "#0f172a",
//   },
//   darkText: {
//     color: "#f8fafc",
//   },
//   subGreetingText: {
//     fontSize: 13,
//     color: "#64748b",
//     marginTop: 5,
//   },
//   avatar: {
//     width: 42,
//     height: 42,
//     borderRadius: 24,
//     borderWidth: 2,
//     borderColor: "#ffffff",
//   },

//   /* ACTION CARDS — modern style */
//   actionRow: {
//     flexDirection: "row",
//     gap: 12,
//     marginBottom: 20,
//   },
//   actionCard: {
//     flex: 1,
//     height: 168,
//     borderRadius: 24,
//     padding: 16,
//     overflow: "hidden", // clips the watermark icon to the card's rounded corners
//     shadowColor: "#1e293b",
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 3,
//   },
//   // Faint oversized icon in the bottom-right corner, purely decorative
//   watermarkClip: {
//     position: "absolute",
//     right: -18,
//     bottom: -18,
//     opacity: 0.1,
//   },
//   watermarkIcon: {
//     transform: [{ rotate: "-8deg" }],
//   },
//   cardTopRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     marginBottom: 16,
//   },
//   // Small circular "button" around the chevron — makes it read as a tap
//   // target rather than a stray decorative arrow.
//   chevronButton: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: "rgba(255,255,255,0.7)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   iconBadge: {
//     width: 40,
//     height: 40,
//     borderRadius: 13,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#1e293b",
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.15,
//     shadowRadius: 5,
//     elevation: 3,
//   },
//   actionCardTitle: {
//     fontSize: 15,
//     fontWeight: "800",
//     color: "#0f172a",
//     marginBottom: 6,
//   },
//   actionCardSubtitle: {
//     fontSize: 11.5,
//     color: "#64748b",
//     lineHeight: 16,
//   },
//   /* OVERVIEW SECTION */
//   overviewCard: {
//     backgroundColor: "#ffffff",
//     borderRadius: 24,
//     padding: 20,
//     marginBottom: 20,
//     shadowColor: "#1e293b",
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.06,
//     shadowRadius: 12,
//     elevation: 2,
//   },
//   overviewHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   overviewTitle: {
//     fontSize: 17,
//     fontWeight: "800",
//     color: "#0f172a",
//   },
//   periodPill: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 20,
//     backgroundColor: "#f1f5f9",
//   },
//   periodPillText: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#475569",
//   },

//   /* Stat tiles */
//   statRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingBottom: 20,
//     marginBottom: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f1f5f9",
//   },
//   statBox: {
//     flex: 1,
//   },
//   statIconBadge: {
//     width: 32,
//     height: 32,
//     borderRadius: 10,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 10,
//   },
//   statValue: {
//     fontSize: 22,
//     fontWeight: "800",
//     color: "#0f172a",
//     marginBottom: 2,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: "#64748b",
//   },
//   statDivider: {
//     width: 1,
//     height: 44,
//     backgroundColor: "#f1f5f9",
//     marginHorizontal: 16,
//   },

//   /* Usage bar */
//   usageSection: {},
//   usageHeaderRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 10,
//   },
//   usageLabel: {
//     fontSize: 13,
//     fontWeight: "700",
//     color: "#334155",
//   },
//   usagePercentPill: {
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     backgroundColor: "#ecfdf5",
//   },
//   usagePercentText: {
//     fontSize: 11,
//     fontWeight: "700",
//     color: "#10b981",
//   },
//   progressTrack: {
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#f1f5f9",
//     overflow: "hidden",
//   },
//   progressFill: {
//     height: "100%",
//     borderRadius: 4,
//     backgroundColor: "#10b981",
//   },
//   usageSubtext: {
//     fontSize: 12,
//     color: "#94a3b8",
//     marginTop: 8,
//     marginBottom: 16,
//   },
//   usageButtonRow: {
//     flexDirection: "row",
//     gap: 10,
//   },
//   primaryUsageButton: {
//     flex: 1,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 6,
//     backgroundColor: "#10b981",
//     paddingVertical: 12,
//     borderRadius: 14,
//   },
//   primaryUsageButtonText: {
//     color: "#ffffff",
//     fontSize: 13,
//     fontWeight: "700",
//   },
//   secondaryUsageButton: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f8fafc",
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//     paddingVertical: 12,
//     borderRadius: 14,
//   },
//   secondaryUsageButtonText: {
//     color: "#334155",
//     fontSize: 13,
//     fontWeight: "700",
//   },
// });

import { Feather } from "@expo/vector-icons";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. TOP NAVBAR */}
        <View style={styles.headerBar}>
          <View style={styles.logoContainer}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>N</Text>
            </View>
            <Text style={styles.logoText}>NoteOCR</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Feather name="search" size={18} color="#0a0a0a" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Feather name="bell" size={18} color="#0a0a0a" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. USER GREETING & AVATAR */}
        <View style={styles.userSection}>
          <View>
            <Text style={styles.greetingText}>Hi, joe</Text>
            <Text style={styles.subGreetingText}>
              Welcome back to your dashboard
            </Text>
          </View>

          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
            }}
            style={styles.avatar}
          />
        </View>

        {/* 3. ACTION CARDS — bento: one inverted (black), one outlined (white) */}
        <View style={styles.actionRow}>
          {/* Card 1: Convert Handwriting — solid black, primary action */}
          <TouchableOpacity style={styles.actionCardDark} activeOpacity={0.85}>
            <View style={styles.watermarkClipDark}>
              <Feather
                name="edit-3"
                size={80}
                color="#ffffff"
                style={styles.watermarkIcon}
              />
            </View>

            <View style={styles.cardTopRow}>
              <View style={styles.iconBadgeLight}>
                <Feather name="edit-3" size={18} color="#0a0a0a" />
              </View>
              <View style={styles.chevronButtonDark}>
                <Feather name="chevron-right" size={14} color="#ffffff" />
              </View>
            </View>

            <Text
              style={styles.actionCardTitleDark}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Convert Handwriting
            </Text>
            <Text style={styles.actionCardSubtitleDark} numberOfLines={2}>
              Upload images to convert them into editable documents.
            </Text>
          </TouchableOpacity>

          {/* Card 2: Edit Document — white, outlined, secondary action */}
          <TouchableOpacity style={styles.actionCardLight} activeOpacity={0.85}>
            <View style={styles.watermarkClipLight}>
              <Feather
                name="file-text"
                size={80}
                color="#0a0a0a"
                style={styles.watermarkIcon}
              />
            </View>

            <View style={styles.cardTopRow}>
              <View style={styles.iconBadgeDark}>
                <Feather name="file-text" size={18} color="#ffffff" />
              </View>
              <View style={styles.chevronButtonLight}>
                <Feather name="chevron-right" size={14} color="#0a0a0a" />
              </View>
            </View>

            <Text
              style={styles.actionCardTitleLight}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Edit Document
            </Text>
            <Text style={styles.actionCardSubtitleLight} numberOfLines={2}>
              Upload a document or start from a blank slate.
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. OVERVIEW SECTION — bento grid, monochrome */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Overview</Text>
            <TouchableOpacity style={styles.periodPill} activeOpacity={0.7}>
              <Text style={styles.periodPillText}>Monthly</Text>
              <Feather name="chevron-down" size={13} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Stat tiles */}
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconBadge}>
                <Feather name="file-text" size={14} color="#0a0a0a" />
              </View>
              <Text style={styles.statValue}>25</Text>
              <Text style={styles.statLabel}>Total Documents</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View style={styles.statIconBadge}>
                <Feather name="folder" size={14} color="#0a0a0a" />
              </View>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>Total Folders</Text>
            </View>
          </View>

          {/* Usage bar — flat, monochrome */}
          <View style={styles.usageSection}>
            <View style={styles.usageHeaderRow}>
              <Text style={styles.usageLabel}>Page usage</Text>
              <Text style={styles.usagePercentText}>28% used</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: "28%" }]} />
            </View>

            <Text style={styles.usageSubtext}>
              1,416 of 5,000 pages · 3,584 remaining
            </Text>

            <View style={styles.usageButtonRow}>
              <TouchableOpacity
                style={styles.primaryUsageButton}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={14} color="#ffffff" />
                <Text style={styles.primaryUsageButtonText}>
                  Add More Pages
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryUsageButton}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryUsageButtonText}>Manage Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 5. RECENT DOCUMENTS — monochrome list */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.overviewTitle}>Recent Documents</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentList}>
            {[
              { name: "QleoOdE.docx", date: "Jun 14, 2026", type: "doc" },
              {
                name: "notecor_table_178144.xlsx",
                date: "Jun 14, 2026",
                type: "sheet",
              },
              {
                name: "notecor_word_178144.docx",
                date: "Jun 14, 2026",
                type: "doc",
              },
              {
                name: "CHAPTER-V-approved.pdf",
                date: "Jun 14, 2026",
                type: "pdf",
              },
            ].map((doc, i) => (
              <TouchableOpacity
                key={doc.name}
                style={[styles.recentRow, i === 3 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
              >
                <View style={styles.recentIconBadge}>
                  <Feather
                    name={
                      doc.type === "sheet"
                        ? "grid"
                        : doc.type === "pdf"
                          ? "file"
                          : "file-text"
                    }
                    size={15}
                    color="#0a0a0a"
                  />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={styles.recentMeta}>{doc.date} · Personal</Text>
                </View>
                <Feather name="more-vertical" size={16} color="#a1a1aa" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  darkSafeArea: {
    backgroundColor: "#0a0a0a",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  /* HEADER NAVBAR */
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoMark: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
  },
  logoMarkText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0a0a0a",
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0a0a0a",
  },

  /* USER SECTION */
  userSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0a0a0a",
    letterSpacing: -0.4,
  },
  subGreetingText: {
    fontSize: 13,
    color: "#71717a",
    marginTop: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },

  /* ACTION CARDS — bento, monochrome */
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionCardDark: {
    flex: 1,
    height: 168,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#0a0a0a",
    overflow: "hidden",
  },
  actionCardLight: {
    flex: 1,
    height: 168,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    overflow: "hidden",
  },
  watermarkClipDark: {
    position: "absolute",
    right: -18,
    bottom: -18,
    opacity: 0.08,
  },
  watermarkClipLight: {
    position: "absolute",
    right: -18,
    bottom: -18,
    opacity: 0.04,
  },
  watermarkIcon: {
    transform: [{ rotate: "-8deg" }],
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconBadgeLight: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBadgeDark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
  },
  chevronButtonDark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  chevronButtonLight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
    justifyContent: "center",
    alignItems: "center",
  },
  actionCardTitleDark: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
  },
  actionCardSubtitleDark: {
    fontSize: 11.5,
    color: "#a1a1aa",
    lineHeight: 16,
  },
  actionCardTitleLight: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a0a0a",
    marginBottom: 6,
  },
  actionCardSubtitleLight: {
    fontSize: 11.5,
    color: "#71717a",
    lineHeight: 16,
  },

  /* OVERVIEW SECTION — bento grid */
  overviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 20,
    marginBottom: 16,
  },
  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  overviewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a0a0a",
  },
  periodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  periodPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3f3f46",
  },

  /* Stat tiles */
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 18,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  statBox: {
    flex: 1,
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f4f4f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0a0a0a",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#71717a",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#f4f4f5",
    marginHorizontal: 16,
  },

  /* Usage bar */
  usageHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  usageLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3f3f46",
  },
  usagePercentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#f4f4f5",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#0a0a0a",
  },
  usageSubtext: {
    fontSize: 12,
    color: "#a1a1aa",
    marginTop: 8,
    marginBottom: 16,
  },
  usageButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryUsageButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0a0a0a",
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryUsageButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryUsageButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryUsageButtonText: {
    color: "#0a0a0a",
    fontSize: 13,
    fontWeight: "600",
  },

  /* RECENT DOCUMENTS */
  recentSection: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 20,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#71717a",
  },
  recentList: {},
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  recentIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
    justifyContent: "center",
    alignItems: "center",
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0a0a0a",
    marginBottom: 2,
  },
  recentMeta: {
    fontSize: 11.5,
    color: "#a1a1aa",
  },
});
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { onForceLogout } from "@/service/api";
import {
  checkAuth as checkAuthRequest,
  login as loginRequest,
  signup as signupRequest,
} from "@/service/authService";
import {
  DocumentItem,
  FolderItem,
  mapDocuments,
  mapFolders,
  mapOverview,
  OverviewData,
} from "@/utils/mapUserData";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

const TOKEN_KEY = "@noteocr_auth_token";
const ONBOARDED_KEY = "@noteocr_has_onboarded";

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  plan: string;
}

function mapUser(raw: any): User {
  return {
    id: raw._id,
    name: raw.name,
    email: raw.email,
    isVerified: raw.isVerified,
    plan: raw.subscription.plan,
  };
}

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  user: User | null;
  documents: DocumentItem[];
  folders: FolderItem[];
  overview: OverviewData | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);

  useEffect(() => {
    onForceLogout(() => {
      logout();
      router.replace("/auth");
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [token, onboarded] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(ONBOARDED_KEY),
        ]);

        setHasOnboarded(onboarded === "true");

        if (token) {
          try {
            const data = await checkAuthRequest(token);
            setUser(mapUser(data.user));
            setDocuments(mapDocuments(data.user.folders));
            setFolders(mapFolders(data.user.folders));
            setOverview(mapOverview(data.user));
            setIsAuthenticated(true);
          } catch (err) {
            // token exists but backend rejected it (expired/invalid)
            await AsyncStorage.removeItem(TOKEN_KEY);
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
        setHasOnboarded(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const data = await loginRequest({ email, password });
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setUser(mapUser(data.user));
    setDocuments(mapDocuments(data.user.folders));
    setFolders(mapFolders(data.user.folders));
    setOverview(mapOverview(data.user));
    setIsAuthenticated(true);
  }

  async function signup(name: string, email: string, password: string) {
    const data = await signupRequest({ name, email, password });
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setUser(mapUser(data.user));
    setDocuments(mapDocuments(data.user.folders));
    setFolders(mapFolders(data.user.folders));
    setOverview(mapOverview(data.user));
    setIsAuthenticated(true);
  }

  async function loginWithGoogle() {
    const redirectUri = "noteocrapplication://auth/callback";
    const authUrl = `${process.env.EXPO_PUBLIC_API_URL}/auth/google?platform=mobile`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== "success" || !result.url) {
      return;
    }

    const url = new URL(result.url);
    const token = url.searchParams.get("token");
    const error = url.searchParams.get("error");

    if (error) {
      throw new Error("Google sign-in failed. Please try again.");
    }

    if (!token) {
      throw new Error("No token received from Google sign-in.");
    }

    await AsyncStorage.setItem(TOKEN_KEY, token);

    const data = await checkAuthRequest(token); // pass it explicitly
    setUser(mapUser(data.user));
    setDocuments(mapDocuments(data.user.folders));
    setFolders(mapFolders(data.user.folders));
    setOverview(mapOverview(data.user));
    setIsAuthenticated(true);
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
    setUser(null);
    setDocuments([]);
    setFolders([]);
    setOverview(null);
  }

  async function completeOnboarding() {
    await AsyncStorage.setItem(ONBOARDED_KEY, "true");
    setHasOnboarded(true);
  }

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      hasOnboarded,
      user,
      documents,
      folders,
      overview,
      login,
      signup,
      loginWithGoogle,
      logout,
      completeOnboarding,
    }),
    [
      isLoading,
      isAuthenticated,
      hasOnboarded,
      user,
      documents,
      folders,
      overview,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

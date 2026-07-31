import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { onForceLogout } from "@/services/api";
import {
  checkAuth as checkAuthRequest,
  login as loginRequest,
  signup as signupRequest,
} from "@/services/authService";
import {
  DocumentItem,
  FolderItem,
  mapDocuments,
  mapFolders,
  mapOverview,
  mapTrash,
  OverviewData,
  TrashItem,
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
  trash: TrashItem[];
  overview: OverviewData | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // undefined = "haven't checked AsyncStorage yet"
  // null      = "checked, no token stored"
  // string    = "have a token"
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    onForceLogout(() => {
      logout();
      router.replace("/auth");
    });
  }, []);

  // Bootstrap: read persisted token + onboarding flag once on mount.
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, onboarded] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(ONBOARDED_KEY),
        ]);
        setHasOnboarded(onboarded === "true");
        setToken(storedToken); // string if present, null if not
      } catch {
        setToken(null);
        setHasOnboarded(false);
      }
    })();
  }, []);

  // The single source of truth for user + documents + folders + trash +
  // overview. Runs whenever `token` is a real string; polls every 10s for
  // cross-device sync, and refetches on app foreground thanks to the
  // focusManager wiring in _layout.tsx.
  const userDataQuery = useQuery({
    queryKey: ["userData", token],
    queryFn: () => checkAuthRequest(token as string),
    enabled: typeof token === "string",
    refetchInterval: 10000,
  });

  // If the stored token is invalid/expired, checkAuth will error — treat
  // that the same way the old code did: drop the token and sign out.
  useEffect(() => {
    if (typeof token === "string" && userDataQuery.isError) {
      AsyncStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, [userDataQuery.isError, token]);

  const data = userDataQuery.data;
  const user = useMemo(() => (data ? mapUser(data.user) : null), [data]);
  const documents = useMemo(
    () => (data ? mapDocuments(data.user.folders) : []),
    [data],
  );
  const folders = useMemo(
    () => (data ? mapFolders(data.user.folders) : []),
    [data],
  );
  const trash = useMemo(() => (data ? mapTrash(data.user.trash) : []), [data]);
  const overview = useMemo(
    () => (data ? mapOverview(data.user) : null),
    [data],
  );

  const isAuthenticated = typeof token === "string" && !!data;
  const isLoading =
    token === undefined ||
    (typeof token === "string" && userDataQuery.isLoading);

  async function login(email: string, password: string) {
    const responseData = await loginRequest({ email, password });
    await AsyncStorage.setItem(TOKEN_KEY, responseData.token);
    // Seed the cache directly — login already returns the full user
    // payload, so there's no need for a second round-trip via checkAuth.
    queryClient.setQueryData(["userData", responseData.token], responseData);
    setToken(responseData.token);
  }

  async function signup(name: string, email: string, password: string) {
    const responseData = await signupRequest({ name, email, password });
    await AsyncStorage.setItem(TOKEN_KEY, responseData.token);
    queryClient.setQueryData(["userData", responseData.token], responseData);
    setToken(responseData.token);
  }

  async function loginWithGoogle() {
    const redirectUri = "noteocrapplication://auth/callback";
    const authUrl = `${process.env.EXPO_PUBLIC_API_URL}/auth/google?platform=mobile`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== "success" || !result.url) {
      return;
    }

    const url = new URL(result.url);
    const oauthToken = url.searchParams.get("token");
    const oauthError = url.searchParams.get("error");

    if (oauthError) {
      throw new Error("Google sign-in failed. Please try again.");
    }
    if (!oauthToken) {
      throw new Error("No token received from Google sign-in.");
    }

    await AsyncStorage.setItem(TOKEN_KEY, oauthToken);
    const responseData = await checkAuthRequest(oauthToken);
    queryClient.setQueryData(["userData", oauthToken], responseData);
    setToken(oauthToken);
  }

  // Kept for backward compatibility with existing callers (e.g.
  // useDocumentActions) — now just invalidates the query so React Query
  // handles the refetch/dedup instead of us doing it by hand.
  async function refreshUserData() {
    if (typeof token !== "string") return;
    await queryClient.invalidateQueries({ queryKey: ["userData", token] });
  }

  async function logout() {
    const previousToken = token;
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    if (typeof previousToken === "string") {
      queryClient.removeQueries({ queryKey: ["userData", previousToken] });
    }
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
      trash,
      overview,
      login,
      signup,
      loginWithGoogle,
      logout,
      completeOnboarding,
      refreshUserData,
      token: typeof token === "string" ? token : null,
    }),
    [
      isLoading,
      isAuthenticated,
      hasOnboarded,
      user,
      documents,
      folders,
      trash,
      overview,
      token,
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

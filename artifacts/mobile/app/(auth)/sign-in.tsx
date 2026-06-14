import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useSSO } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
}

const CREAM = "#f5f0e8";
const GOLD = "#c8a96e";
const DARK = "#2d2417";
const MUTED = "#9c8e7a";

export default function SignInScreen() {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [loading, setLoading] = React.useState<"google" | "apple" | null>(null);

  const handleSSO = useCallback(async (strategy: "oauth_google" | "oauth_apple") => {
    setLoading(strategy === "oauth_google" ? "google" : "apple");
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ decorateUrl }) => {
            router.replace(decorateUrl("/(home)") as any);
          },
        });
      }
    } catch (err) {
      console.error("SSO error:", JSON.stringify(err, null, 2));
    } finally {
      setLoading(null);
    }
  }, [startSSOFlow, router]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Logo / title */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>✓</Text>
        </View>
        <Text style={styles.title}>Yapılacaklar</Text>
        <Text style={styles.subtitle}>
          Görevlerini bulutta saklamak için{"\n"}giriş yap
        </Text>

        {/* Google button */}
        <TouchableOpacity
          style={[styles.btn, styles.btnGoogle]}
          onPress={() => handleSSO("oauth_google")}
          activeOpacity={0.85}
          disabled={loading !== null}
        >
          {loading === "google" ? (
            <ActivityIndicator color={DARK} />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.btnText, { color: DARK }]}>Google ile giriş yap</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Apple button (iOS only) */}
        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={[styles.btn, styles.btnApple]}
            onPress={() => handleSSO("oauth_apple")}
            activeOpacity={0.85}
            disabled={loading !== null}
          >
            {loading === "apple" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.appleIcon}></Text>
                <Text style={[styles.btnText, { color: "#fff" }]}>Apple ile giriş yap</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.legal}>
          Giriş yaparak gizlilik politikasını kabul etmiş olursun.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: 16,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 36,
    color: "#fff",
    fontWeight: "bold",
  },
  title: {
    fontSize: 32,
    fontFamily: "PlayfairDisplay_700Bold",
    color: DARK,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    minHeight: 52,
  },
  btnGoogle: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e0d8cc",
  },
  btnApple: {
    backgroundColor: DARK,
  },
  btnText: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    letterSpacing: 0.2,
  },
  googleIcon: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
    color: "#4285F4",
  },
  appleIcon: {
    fontSize: 18,
    color: "#fff",
  },
  legal: {
    fontSize: 11,
    fontFamily: "Lato_300Light",
    color: MUTED,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16,
  },
});

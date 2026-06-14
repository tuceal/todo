import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { TodoProvider } from "@/context/TodoContext";

export default function HomeLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f0e8" }}>
        <ActivityIndicator color="#c8a96e" />
      </View>
    );
  }

  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  return (
    <TodoProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </TodoProvider>
  );
}

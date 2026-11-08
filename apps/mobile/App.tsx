import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { FONT_FILES } from "./src/text";
import { api, clearTokens, hasSession } from "./src/api";
import { Login } from "./src/screens/Login";
import { Profiles } from "./src/screens/Profiles";
import { Athlete } from "./src/athlete/Athlete";
import { C, Loading } from "./src/ui";

type Route = { name: "loading" } | { name: "login" } | { name: "profiles" } | { name: "member"; id: string; single: boolean };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "loading" });
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  useEffect(() => { hasSession().then((s) => setRoute(s ? { name: "profiles" } : { name: "login" })); }, []);
  const openMember = useCallback((id: string) => setRoute({ name: "member", id, single: false }), []);
  const logout = async () => { await api("/auth/logout", { method: "POST" }).catch(() => undefined); await clearTokens(); setRoute({ name: "login" }); };

  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: "#f8fafc" }} />;
  if (route.name === "login") {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <StatusBar style="light" />
        <View style={{ flex: 1, width: "100%", maxWidth: 560, alignSelf: "center" }}>
          <Login onSignedIn={() => setRoute({ name: "profiles" })} />
        </View>
      </View>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, width: "100%", maxWidth: 560, alignSelf: "center" }}>
        {route.name === "loading" && <Loading />}
        {route.name === "profiles" && <Profiles onOpen={openMember} onLogout={logout} />}
        {route.name === "member" && <Athlete memberId={route.id} onSwitchGym={() => setRoute({ name: "profiles" })} onLogout={logout} />}
      </View>
    </SafeAreaView>
  );
}

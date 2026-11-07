import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { api, clearTokens, hasSession } from "./src/api";
import { Login } from "./src/screens/Login";
import { Profiles } from "./src/screens/Profiles";
import { Member } from "./src/screens/Member";
import { C, Loading } from "./src/ui";

type Route = { name: "loading" } | { name: "login" } | { name: "profiles" } | { name: "member"; id: string; single: boolean };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "loading" });
  useEffect(() => { hasSession().then((s) => setRoute(s ? { name: "profiles" } : { name: "login" })); }, []);
  const openMember = useCallback((id: string) => setRoute({ name: "member", id, single: false }), []);
  const logout = async () => { await api("/auth/logout", { method: "POST" }).catch(() => undefined); await clearTokens(); setRoute({ name: "login" }); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, width: "100%", maxWidth: 560, alignSelf: "center" }}>
        {route.name === "loading" && <Loading />}
        {route.name === "login" && <Login onSignedIn={() => setRoute({ name: "profiles" })} />}
        {route.name === "profiles" && <Profiles onOpen={openMember} onLogout={logout} />}
        {route.name === "member" && <Member memberId={route.id} onBack={() => setRoute({ name: "profiles" })} />}
      </View>
    </SafeAreaView>
  );
}

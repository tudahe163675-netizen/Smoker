import { useAuth } from "@/hooks/useAuth";
import { BarApiService } from "@/services/barApi";
import { BarDetail, Combo } from "@/types/barType";
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BarDetailScreen() {
  // Lấy param id
const { id: barId } = useLocalSearchParams<{ id: string }>();

  const { authState } = useAuth();
  const token = authState.token!;
  const barApi = new BarApiService(token);

  const [barDetail, setBarDetail] = useState<BarDetail | null>(null);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBarDetail = useCallback(async () => {
    if (!barId) return;


    setLoading(true);
    try {
      const detailRes = await barApi.getBarDetail(barId);
       console.log(detailRes);
      if (detailRes.success && detailRes.data) {
        setBarDetail(detailRes.data);

        const combosRes = await barApi.getBarCombos(barId);

        console.log(combosRes);
        
        if (combosRes.success && combosRes.data) {
          setCombos(combosRes.data);
        }
      }
    } catch (err) {
      console.error("Error fetching bar detail:", err);
    } finally {
      setLoading(false);
    }
  }, [barId]);

  useEffect(() => {
    fetchBarDetail();
  }, [fetchBarDetail]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text>Đang tải...</Text>
      </View>
    );
  }

  if (!barDetail) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Không tìm thấy thông tin bar</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12 }}>
        {barDetail.name}
      </Text>
      <Text style={{ marginBottom: 12 }}>{barDetail.address}</Text>

      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
        Combo
      </Text>
      <FlatList
        data={combos}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View
            style={{
              marginBottom: 12,
              padding: 12,
              backgroundColor: "#fff",
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: "600" }}>{item.name}</Text>
            <Text>{item.description}</Text>
            <Text style={{ color: "#ef4444" }}>{item.price.toLocaleString()}đ</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

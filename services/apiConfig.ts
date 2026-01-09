// API Configuration - có thể dùng chung BE với web
// Để chạy trên điện thoại, thay localhost bằng IP máy tính hoặc domain
// Ví dụ: "http://192.168.1.100:9999/api" (IP local network)
// Hoặc: "https://smoker-node.onrender.com/api" (production)

// Lấy từ environment variable hoặc dùng default
const getBaseUrl = () => {
  // Nếu có EXPO_PUBLIC_API_URL thì dùng
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Development: dùng localhost (chỉ hoạt động trên emulator/simulator)
  // Để test trên điện thoại thật, cần thay bằng IP máy tính
  // Ví dụ: "http://192.168.1.100:9999/api"
  return __DEV__ 
    ? "http://localhost:9999/api"  // Emulator/Simulator
    : "https://smoker-node.onrender.com/api"; // Production
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
};
// API service for Vietnam location data from open.oapi.vn
const BASE_URL = "https://open.oapi.vn/location";

export interface LocationItem {
  id: string;
  name: string;
  typeText?: string;
}

interface LocationApiResponse {
  code: string;
  data?: LocationItem[];
  message?: string;
}

export class LocationApiService {
  /**
   * Get all provinces
   */
  async getProvinces(query: string = "", page: number = 0, size: number = 100): Promise<LocationItem[]> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      if (query) {
        params.append("query", query);
      }
      
      const response = await fetch(`${BASE_URL}/provinces?${params.toString()}`);
      const data: LocationApiResponse = await response.json();
      
      if (data.code === "success") {
        return data.data || [];
      }
      throw new Error(data.message || "Failed to fetch provinces");
    } catch (error) {
      console.error('[LocationApi] Failed to fetch provinces:', error);
      throw error;
    }
  }

  /**
   * Get districts by province ID
   */
  async getDistricts(provinceId: string, query: string = "", page: number = 0, size: number = 100): Promise<LocationItem[]> {
    if (!provinceId) {
      throw new Error("provinceId is required");
    }
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      if (query) {
        params.append("query", query);
      }
      
      const response = await fetch(`${BASE_URL}/districts/${provinceId}?${params.toString()}`);
      const data: LocationApiResponse = await response.json();
      
      if (data.code === "success") {
        return data.data || [];
      }
      throw new Error(data.message || "Failed to fetch districts");
    } catch (error) {
      console.error('[LocationApi] Failed to fetch districts:', error);
      throw error;
    }
  }

  /**
   * Get wards by district ID
   */
  async getWards(districtId: string, query: string = "", page: number = 0, size: number = 100): Promise<LocationItem[]> {
    if (!districtId) {
      throw new Error("districtId is required");
    }
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      if (query) {
        params.append("query", query);
      }
      
      const response = await fetch(`${BASE_URL}/wards/${districtId}?${params.toString()}`);
      const data: LocationApiResponse = await response.json();
      
      if (data.code === "success") {
        return data.data || [];
      }
      throw new Error(data.message || "Failed to fetch wards");
    } catch (error) {
      console.error('[LocationApi] Failed to fetch wards:', error);
      throw error;
    }
  }
}




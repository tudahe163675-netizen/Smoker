
import { API_CONFIG } from "./apiConfig";
import { PublicProfileResponse } from "@/types/profileType";

const publicProfileApi = {
  getByEntityId: async (entityAccountId: string): Promise<PublicProfileResponse> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user/by-entity/${entityAccountId}`);
      const json = await response.json();
      return json;
    } catch (error) {
      return {
        success: false,
      };
    }
  }
};

export default publicProfileApi;



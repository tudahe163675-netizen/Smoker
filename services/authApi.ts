import { Role } from "@/constants/authData";
import { API_CONFIG } from "./apiConfig";

export const loginApi = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const json = await response.json();
    return json;
  } catch (error) {
    return {
      success: false,
      message: "Không thể kết nối tới server",
    };
  }
};

export const upgradeRoleApi = async (email: string, newRole: Role) => {
};

export const registerApi = async (
  email: string,
  password: string,
  confirmPassword: string
) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        confirmPassword,
      }),
    });

    const json = await response.json();
    return json;
  } catch (error) {
    return {
      success: false,
      message: "Không thể kết nối tới server",
    };
  }
};

export const fetchUserEntities = async (userId: string, token: string) => {
try {
    const response = await fetch(
    `${API_CONFIG.BASE_URL}/user/${userId}/entities`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const json = await response.json();  
  return json;
} catch (error) {
  console.log("fetchUserEntities ",error);
}
};
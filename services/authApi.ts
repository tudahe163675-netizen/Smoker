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
    console.log("fetchUserEntities ", error);
  }
};

export const forgotPasswordApi = async (
  email: string,
) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
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

export const verifyOtpApi = async (
  email: string,
  otp: string,
) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        otp
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

export const resetPasswordApi = async (
  email: string,
  newPassword: string,
  confirmPassword: string
) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        newPassword,
        confirmPassword
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

export const changePasswordApi = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  token: string,
) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
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
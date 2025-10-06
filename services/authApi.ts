import { AUTH_CONSTANTS, Role } from "@/constants/authData";

export const loginApi = async (email: string, password: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = AUTH_CONSTANTS.FAKE_USERS.find(
        (u) => u.email === email && u.password === password
      );
      if (user) {
        const fakeResponse = {
          success: true,
          data: {
            token: 'fake-jwt-token-' + Math.random().toString(36).substr(2, 9),
            role: user.role,
          },
          message: 'Đăng nhập thành công',
        };
        resolve(fakeResponse);
      } else {
        resolve({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không đúng',
        });
      }
    }, 1000); // Simulate network delay
  });
};

export const upgradeRoleApi = async (email: string, newRole: Role) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = AUTH_CONSTANTS.FAKE_USERS.find((u) => u.email === email);
      if (user) {
        // Fake cập nhật role (thực tế chỉ trả về success, client sẽ cập nhật state)
        const fakeResponse = {
          success: true,
          data: {
            newRole,
          },
          message: 'Nâng cấp vai trò thành công',
        };
        resolve(fakeResponse);
      } else {
        resolve({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }
    }, 1000); // Simulate network delay
  });
};
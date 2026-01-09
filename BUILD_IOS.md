# Hướng dẫn Build iOS Development Build

## Bước 1: Unlock Apple Account (nếu bị lock)

1. Vào https://iforgot.apple.com
2. Reset password hoặc unlock account
3. Đợi email xác nhận từ Apple

## Bước 2: Build iOS Development Build

```bash
eas build --profile development --platform ios
```

Khi hỏi:
- **"Do you want to log in to your Apple account?"** → Chọn **Yes**
- Nhập **Apple ID** và **Password**
- EAS sẽ tự động tạo credentials

## Bước 3: Chờ build hoàn thành

- Build trên cloud (EAS servers)
- Thời gian: ~15-30 phút
- Sẽ có link download khi xong

## Bước 4: Cài đặt trên iPhone

1. Download file `.ipa` từ EAS
2. Cài đặt qua:
   - **TestFlight** (nếu có Apple Developer Program)
   - **Ad Hoc** (nếu có device UDID đã đăng ký)
   - Hoặc dùng **Apple Configurator 2** trên Mac

## Lưu ý

- Cần **Apple Developer Program** ($99/năm) để cài trên device thật
- Hoặc dùng **free Apple ID** nhưng chỉ cài được 7 ngày, cần rebuild
- Development build có thể test đầy đủ livestream với camera/mic thật



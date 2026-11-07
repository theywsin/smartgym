# SmartGym mobile (athletes)

Expo app for athletes: OTP sign-in, gym profiles, membership status, rotating QR check-in pass,
workout program, payments and online debt payment, and support tickets.

- Tokens: access + refresh tokens from `/api/v1/auth/otp/verify` with `X-Client: mobile`, stored in the
  OS keychain/keystore via `expo-secure-store` (memory only on the web preview). Refresh rotates on 401.
- API origin: set `EXPO_PUBLIC_API_URL=https://your-domain` before `npx expo start` or an EAS build.

```
cd apps/mobile
npm install
EXPO_PUBLIC_API_URL=https://your-domain npx expo start
npx tsc --noEmit
```

Store builds use EAS (`npx eas build -p android|ios`), which needs an Expo account and, for iOS, an Apple developer account.
This package is intentionally outside the npm workspaces so React Native's dependency tree does not mix with the web app.

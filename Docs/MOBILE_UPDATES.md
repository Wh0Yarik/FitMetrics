## Обновления мобильного приложения

Коротко: если меняются только экраны/логика/стили (JS/TS), обновляем через **EAS Update** без пересборки APK.  
Если меняется нативная часть (android/ios или зависимости) — нужна новая сборка.

### 1) OTA‑обновления (без переустановки APK)
Используем **EAS Update**.

Команда:
```bash
cd packages/mobile
eas update --branch production --message "UI fixes"
```

Поведение для пользователя:
- приложение при запуске проверяет наличие обновлений;
- при наличии — в разделе **Аккаунт** появляется баннер «Доступно обновление»;
- пользователь нажимает «Обновить» → приложение перезапускается и применяет апдейт.

Примечания:
- OTA работает только для JS/TS (экраны, стили, логика);
- не требует переустановки APK.

### 2) Когда нужна новая сборка
Если меняется что-то нативное:
- зависимости с нативными модулями;
- изменения в `android/` или `ios/`;
- конфиги Expo‑плагинов.

Тогда собираем новую APK (локально или через EAS).

#### Локальная сборка (release APK)
```bash
cd android
NODE_ENV=production ./gradlew assembleRelease
```

APK будет тут:
```
android/app/build/outputs/apk/release/app-release.apk
```

Установка по ADB:
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

#### EAS Build (production)
```bash
eas build -p android --profile production
```

### 3) Быстро проверить, что обновления включены
В `packages/mobile/src/features/profile/screens/ProfileScreen.tsx` есть баннер обновлений.  
Если он не появляется — убедись, что:
- `expo-updates` есть в зависимостях;
- dev‑клиент пересобран после подключения `expo-updates`.

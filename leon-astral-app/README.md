# Leon Astral — app Android (Expo)

App de horóscopo personalizado da Arktos Leon. Backend: Supabase `leon-astral` (rimgeohwknrwgvjburqq).

- Pacote Android: `com.arktosleon.leonastral` · esquema de retorno do login: `leonastral://auth`
- Login Google e Facebook via Supabase (PKCE pelo navegador do celular)
- Telas: login, cadastro, hoje, meu mapa, conversa com a Estela

## Rodar
```
npm install        # Expo SDK 58
npx expo start
```
## Build
- APK de teste: `eas build -p android --profile preview`
- Google Play (.aab): `eas build -p android --profile production`

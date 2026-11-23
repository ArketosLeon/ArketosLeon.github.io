// Mantém classes que o R8 remove no build de release e que derrubam o app ao abrir
// (WorkManager/Room geram WorkDatabase_Impl por reflexão).
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const REGRAS = `
# --- Leon Astral: regras de manutenção (plugins/withKeepRules.js) ---
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-keep class androidx.work.impl.WorkDatabase_Impl { *; }
-keep class androidx.work.** { *; }
-dontwarn androidx.work.**
`;

module.exports = function withKeepRules(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const arquivo = path.join(cfg.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      const atual = fs.existsSync(arquivo) ? fs.readFileSync(arquivo, 'utf8') : '';
      if (!atual.includes('Leon Astral: regras de manutenção')) {
        fs.writeFileSync(arquivo, atual + REGRAS);
      }
      return cfg;
    },
  ]);
};

// Anúncios (AdMob). Por enquanto usa os IDs de TESTE do Google, que mostram anúncios de mentira.
// Quando a conta AdMob estiver pronta, troque IDS pelos 4 blocos reais e o androidAppId no app.json.
import { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

export const IDS = {
  recompensado: TestIds.REWARDED, // leon_recompensado
  intersticial: TestIds.INTERSTITIAL, // leon_intersticial
  banner: TestIds.BANNER, // leon_banner
  nativo: TestIds.NATIVE, // leon_nativo_hoje
};

// Mostra um vídeo recompensado. Resolve true só se a pessoa assistiu até ganhar a recompensa.
export function verRecompensado(): Promise<boolean> {
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(IDS.recompensado, { requestNonPersonalizedAdsOnly: true });
    let ganhou = false, terminou = false, abriu = false;
    const subs: (() => void)[] = [];
    const fim = (v: boolean) => { if (terminou) return; terminou = true; subs.forEach((u) => u()); resolve(v); };
    subs.push(ad.addAdEventListener(RewardedAdEventType.LOADED, () => { abriu = true; ad.show().catch(() => fim(false)); }));
    subs.push(ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => { ganhou = true; }));
    subs.push(ad.addAdEventListener(AdEventType.CLOSED, () => fim(ganhou)));
    subs.push(ad.addAdEventListener(AdEventType.ERROR, () => fim(false)));
    ad.load();
    setTimeout(() => { if (!abriu) fim(false); }, 15000); // não carregou em 15 s
  });
}

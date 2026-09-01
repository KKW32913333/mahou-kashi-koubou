// ============================================================
// Google Analytics 4（GA4）設定
// ------------------------------------------------------------
// 下の GA4_MEASUREMENT_ID を、あなた自身のGA4測定IDに書き換えてください。
// 設定するまでは何も送信されず、エラーにもなりません。
//
// 測定IDの取得方法:
// 1. https://analytics.google.com を開く
// 2. 「管理」→ 対象プロパティ →「データストリーム」→ 該当のウェブストリームを選択
// 3. 「測定ID」（G-XXXXXXXXXX の形式）をコピーして下に貼り付け
// ============================================================
const GA4_MEASUREMENT_ID = "G-YM2KN6LD1H";

(function () {
  "use strict";
  let enabled = false;

  const isConfigured = GA4_MEASUREMENT_ID && GA4_MEASUREMENT_ID !== "G-XXXXXXXXXX";

  if (isConfigured) {
    try {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_MEASUREMENT_ID;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", GA4_MEASUREMENT_ID, { send_page_view: true });
      enabled = true;
    } catch (e) {
      console.warn("[analytics.js] GA4 initialization failed:", e);
      enabled = false;
    }
  }

  // カスタムイベントを送信する。未設定の場合は何もしない（エラーにもならない）。
  function track(eventName, params) {
    if (!enabled || typeof window.gtag !== "function") return;
    try {
      window.gtag("event", eventName, params || {});
    } catch (e) {
      console.warn("[analytics.js] track failed:", e);
    }
  }

  window.CandyAnalytics = {
    enabled: () => enabled,
    track
  };
})();

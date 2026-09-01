// ============================================================
// Firebase設定（オンラインランキング用）
// ------------------------------------------------------------
// 下の firebaseConfig を、あなた自身の Firebase プロジェクトの値に
// 書き換えてください。設定するまでは自動的にローカル表示（サンプル
// ランキング＋自分の記録のみ）にフォールバックし、エラーにはなりません。
//
// 取得方法は README.md の「Firebase ランキング設定」を参照してください。
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyD2hcs9rsUQLlVr215MXdtqNgT7iTtJUnE...",
  authDomain:        "mahou-kashi-koubou.firebaseapp.com",
  projectId:         "mahou-kashi-koubou",
  storageBucket:      "mahou-kashi-koubou.firebasestorage.app",
  messagingSenderId: "74452903353",
  appId:             "1:74452903353:web:28add72b83f5187f2e0268"
};

(function () {
  "use strict";
  let db = null;
  let enabled = false;

  try {
    const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";
    if (!isConfigured) {
      console.log("[firebase.js] firebaseConfig is still the placeholder — using local fallback (this is expected until you edit firebase.js).");
    } else if (!window.firebase) {
      console.warn("[firebase.js] the Firebase SDK script tags did not load (network blocked / CDN unreachable?) — using local fallback.");
    } else {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      enabled = true;
      console.log("[firebase.js] Firebase initialized successfully. Use CandyFirebase.testConnection() in the console, or the 'クラウド同期コード' screen's connection test, to verify Firestore read/write actually works (a valid config can still fail if Firestore rules block access).");
    }
  } catch (e) {
    console.warn("[firebase.js] initialization threw an error, falling back to local ranking:", e);
    enabled = false;
  }

  // プレイヤーの記録を保存（ドキュメントIDはデバイスごとの匿名ID。
  // 同じ端末から再送すると上書きされる = 各プレイヤー1件のシンプルな方式）
  async function submitScore(playerId, name, score) {
    if (!enabled) return false;
    try {
      await db.collection("scores").doc(playerId).set({
        name: String(name || "こうぼう").slice(0, 12),
        score: Number(score) || 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (e) {
      console.warn("[firebase.js] submitScore failed (" + (e.code || e.message) + "). If this says 'permission-denied', check your Firestore security rules.", e);
      return false;
    }
  }

  // 上位N件を取得
  async function fetchTopScores(limitCount) {
    if (!enabled) return null;
    try {
      const snap = await db.collection("scores")
        .orderBy("score", "desc")
        .limit(limitCount || 20)
        .get();
      return snap.docs.map(d => ({ id: d.id, name: d.data().name, score: d.data().score }));
    } catch (e) {
      console.warn("[firebase.js] fetchTopScores failed (" + (e.code || e.message) + "). If this says 'permission-denied', check your Firestore security rules.", e);
      return null;
    }
  }

  // ------------------------------------------------------------
  // クラウドセーブ（同期コード方式）
  // バックエンドサーバーやカスタム認証を使わず、プレイヤーが控えておく
  // 短い「同期コード」をドキュメントIDとして進行状況を保存/復元する。
  // 同じコードを知っていれば誰でも読み書きできる前提のシンプルな方式
  // （パスワードではない）なので、コードは十分な長さ・ランダム性を持たせる。
  // ------------------------------------------------------------
  async function saveCloudState(code, dataObj) {
    if (!enabled || !code) return false;
    try {
      await db.collection("cloudSaves").doc(code).set({
        data: JSON.stringify(dataObj),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) {
      console.warn("[firebase.js] saveCloudState failed (" + (e.code || e.message) + "). If this says 'permission-denied', check your Firestore security rules for the cloudSaves collection.", e);
      return false;
    }
  }

  async function loadCloudState(code) {
    if (!enabled || !code) return null;
    try {
      const doc = await db.collection("cloudSaves").doc(code).get();
      if (!doc.exists) return null;
      return JSON.parse(doc.data().data);
    } catch (e) {
      console.warn("[firebase.js] loadCloudState failed (" + (e.code || e.message) + "). If this says 'permission-denied', check your Firestore security rules for the cloudSaves collection.", e);
      return null;
    }
  }

  // 実際にFirestoreへ書き込み→読み込みを試し、設定が正しく機能しているかを
  // その場で診断する。「設定したのに反映されない」原因切り分け用。
  async function testConnection() {
    if (!enabled) return { ok: false, reason: "not-configured" };
    try {
      const ref = db.collection("_connectionTest").doc("ping");
      await ref.set({ t: Date.now() });
      await ref.get();
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e.code || e.message || "unknown" };
    }
  }

  window.CandyFirebase = {
    enabled: () => enabled,
    submitScore,
    fetchTopScores,
    saveCloudState,
    loadCloudState,
    testConnection
  };
})();

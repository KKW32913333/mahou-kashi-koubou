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
    if (isConfigured && window.firebase) {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      enabled = true;
    }
  } catch (e) {
    console.warn("[firebase.js] initialization failed, falling back to local ranking:", e);
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
      console.warn("[firebase.js] submitScore failed:", e);
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
      console.warn("[firebase.js] fetchTopScores failed:", e);
      return null;
    }
  }

  window.CandyFirebase = {
    enabled: () => enabled,
    submitScore,
    fetchTopScores
  };
})();

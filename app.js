// 두 기기 동기화 (구글 Firebase). config.js가 비어 있으면 이 기기에만 저장하는 모드로 동작한다.
import { FIREBASE_CONFIG, FAMILY } from './config.js';

const done = (v) => { if (window.__resolveDB) { window.__resolveDB(v); window.__resolveDB = null; } };
setTimeout(() => done(null), 10000); // 인터넷이 안 되거나 로딩이 막히면 이 기기 모드로

const V = '10.12.2';
const acct = () => document.getElementById('acct');
const say = (m) => { const t = document.getElementById('toast'); if (!t) return; t.textContent = m; t.className = 'toast'; t.hidden = false; setTimeout(() => (t.hidden = true), 3000); };

async function start() {
  if (!FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey) { done(null); return; }
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const auth = A.getAuth(app);
  let fs;
  try { fs = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); }
  catch (e) { fs = F.getFirestore(app); }
  const base = `families/${FAMILY || 'home'}/`;

  const mapErr = (e, write) => ({ code: e && e.code === 'permission-denied' ? (write ? 'invalid_argument' : 'revoked') : 'unavailable', message: (e && e.message) || '' });

  // 달력 코드가 쓰는 저장소 모양에 맞춘 연결부
  const adapter = {
    collection(p) {
      return {
        onSnapshot(next, err) {
          return F.onSnapshot(F.collection(fs, base + p),
            (s) => next({ docs: s.docs.map((d) => ({ id: d.id, data: () => d.data() })), empty: s.empty, size: s.size }),
            (e) => err && err(mapErr(e, false)));
        },
      };
    },
    doc(p) {
      const ref = F.doc(fs, base + p);
      return {
        set: (b) => F.setDoc(ref, b).catch((e) => { throw mapErr(e, true); }),
        delete: () => F.deleteDoc(ref).catch((e) => { throw mapErr(e, true); }),
        onSnapshot(next, err) {
          return F.onSnapshot(ref, (s) => next({ exists: s.exists(), data: () => s.data() }), (e) => err && err(mapErr(e, false)));
        },
      };
    },
  };

  const btn = acct();
  let first = true;
  A.onAuthStateChanged(auth, (user) => {
    if (!first) { location.reload(); return; }
    first = false;
    btn.hidden = false;
    if (user) {
      btn.textContent = '로그아웃';
      btn.title = user.email || '';
      btn.onclick = () => { if (btn.dataset.sure) A.signOut(auth); else { btn.dataset.sure = '1'; btn.textContent = '한 번 더 누르면 로그아웃'; setTimeout(() => { delete btn.dataset.sure; btn.textContent = '로그아웃'; }, 3000); } };
      done(adapter);
    } else {
      btn.textContent = '구글 로그인';
      btn.onclick = async () => {
        const provider = new A.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try { await A.signInWithPopup(auth, provider); }
        catch (e) {
          if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) A.signInWithRedirect(auth, provider);
          else if (e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') say('로그인하지 못했어요. 다시 해주세요');
        }
      };
      done(null);
    }
  });
}
start().catch(() => done(null));

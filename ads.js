// 앱(안드로이드)에서만 화면 맨 위에 광고 배너를 띄운다. 웹에서는 아무 일도 하지 않는다.
// 애드몹 계정이 생기면 AD_UNIT_ID를 내 배너 광고 ID로 바꾸고 TESTING을 false로 바꾼다.
(function () {
  var AD_UNIT_ID = 'ca-app-pub-3940256099942544/9214589741'; // 구글 공식 테스트 배너
  var TESTING = true;

  var cap = window.Capacitor;
  var native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  document.documentElement.classList.toggle('native', native);
  if (!native) return;
  var AdMob = cap.Plugins && cap.Plugins.AdMob;
  if (!AdMob) return;

  function setH(h) { document.documentElement.style.setProperty('--ad-h', (h || 0) + 'px'); dispatchEvent(new Event('resize')); }
  AdMob.addListener('bannerAdSizeChanged', function (s) { setH(s && s.height); });
  AdMob.addListener('bannerAdFailedToLoad', function () { setH(0); });

  AdMob.initialize({ initializeForTesting: TESTING })
    .then(function () {
      return AdMob.showBanner({ adId: AD_UNIT_ID, adSize: 'ADAPTIVE_BANNER', position: 'TOP_CENTER', margin: 0, isTesting: TESTING });
    })
    .catch(function () { setH(0); });
})();

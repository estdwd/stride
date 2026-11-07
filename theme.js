/* Stride theme: runs before paint. Modes: dark (default), light, auto */
(function () {
  var KEY = 'stride_theme';
  function mode() { try { return localStorage.getItem(KEY) || 'dark'; } catch (e) { return 'dark'; } }
  function resolve(m) { return m === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : m; }
  function apply() {
    var r = resolve(mode());
    document.documentElement.setAttribute('data-theme', r);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', r === 'light' ? '#f5f5f3' : '#0c0c0e');
  }
  window.strideTheme = {
    get: mode,
    set: function (m) { try { localStorage.setItem(KEY, m); } catch (e) {} apply(); },
    next: function () { var o = ['dark', 'light', 'auto']; var n = o[(o.indexOf(mode()) + 1) % 3]; this.set(n); return n; }
  };
  apply();
  try { matchMedia('(prefers-color-scheme: light)').addEventListener('change', apply); } catch (e) {}
})();

/* Recording cursor: inactive unless the page URL has ?rec.
   Draws a custom cursor + tap ripples for screen recordings. Settings come from the
   recorder window that opened this page; otherwise a plain dot cursor is used. */
(function () {
  if (!new URLSearchParams(location.search).has('rec')) return;

  var off = null;
  function start(o) {
    if (off) off();
    var s = +o.s || 36, c = /^#[0-9a-f]{6}$/i.test(o.c) ? o.c : '#ffffff';
    var img = typeof o.img === 'string' && o.img.indexOf('data:image/') === 0 ? o.img : '';
    var st = document.createElement('style');
    st.textContent = '*{cursor:none!important}' +
      '#__rc{position:fixed;inset:0;pointer-events:none;z-index:2147483647}' +
      '#__rc .c{position:absolute;left:0;top:0;transition:transform .1s,opacity .2s;opacity:0}' +
      '#__rc .r{position:absolute;width:' + s + 'px;height:' + s + 'px;margin:-' + s / 2 + 'px 0 0 -' + s / 2 + 'px;border-radius:50%;border:3px solid ' + c + ';animation:__rcr .5s ease-out forwards;box-shadow:0 0 6px #0004}' +
      '@keyframes __rcr{from{transform:scale(.6);opacity:1}to{transform:scale(2.2);opacity:0}}';
    document.head.appendChild(st);
    var root = document.createElement('div'); root.id = '__rc'; document.body.appendChild(root);

    function arrow(f, k, z) {
      return '<svg width="' + z + '" height="' + z * 1.4 + '" viewBox="0 0 20 28" style="display:block;filter:drop-shadow(0 2px 3px #0006)"><path d="M1 1v22l6-6 4 9 4-2-4-9h8z" fill="' + f + '" stroke="' + k + '" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    }
    function centered(w, h) { return 'margin:-' + h / 2 + 'px 0 0 -' + w / 2 + 'px;width:' + w + 'px;height:' + h + 'px;'; }
    var html = {
      dot: '<div style="' + centered(s, s) + 'border-radius:50%;background:' + c + '80;border:2px solid ' + c + ';box-shadow:0 2px 8px #0005"></div>',
      ring: '<div style="' + centered(s, s) + 'border-radius:50%;border:3px solid ' + c + ';box-shadow:0 0 6px #0005"></div>',
      arrow: arrow(c, c === '#000000' ? '#fff' : '#000', s * .6),
      halo: '<div style="position:absolute;' + centered(s * 1.3, s * 1.3) + 'border-radius:50%;background:' + c + '55"></div>' + arrow('#fff', '#000', s * .55),
      hand: '<div style="font-size:' + s + 'px;line-height:1;margin:-' + s * .08 + 'px 0 0 -' + s * .42 + 'px">👆</div>',
      img: img ? '<img src="' + img + '" style="display:block;width:' + s + 'px;' + (o.hot === 'center' ? 'margin:-' + s / 2 + 'px 0 0 -' + s / 2 + 'px;' : '') + '">' : ''
    }[o.t] || '';
    var cur = null;
    if (html) { cur = document.createElement('div'); cur.className = 'c'; cur.innerHTML = html; root.appendChild(cur); }
    var squish = ['dot', 'ring', 'img', 'hand'].indexOf(o.t) > -1, x = 0, y = 0, down = false;

    function place() { if (cur) cur.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + (down && squish ? .8 : 1) + ')'; }
    function mv(e) { x = e.clientX; y = e.clientY; if (cur) cur.style.opacity = 1; place(); }
    function dn(e) {
      mv(e); down = true; place();
      if (o.tap === false) return;
      var r = document.createElement('div'); r.className = 'r'; r.style.left = x + 'px'; r.style.top = y + 'px';
      root.appendChild(r); setTimeout(function () { r.remove(); }, 600);
    }
    function up() { down = false; place(); }
    function lv() { if (cur) cur.style.opacity = 0; }
    addEventListener('pointermove', mv, true); addEventListener('pointerdown', dn, true);
    addEventListener('pointerup', up, true); document.addEventListener('mouseleave', lv);
    off = function () {
      removeEventListener('pointermove', mv, true); removeEventListener('pointerdown', dn, true);
      removeEventListener('pointerup', up, true); document.removeEventListener('mouseleave', lv);
      root.remove(); st.remove(); off = null;
    };
  }

  var got = false;
  addEventListener('message', function (e) {
    if (e.data && e.data.__rc) { got = true; start(e.data.__rc); }
  });
  function init() {
    try { if (window.opener) window.opener.postMessage({ __rcHello: 1 }, '*'); } catch (e) {}
    setTimeout(function () { if (!got) start({ t: 'dot' }); }, 800);
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();

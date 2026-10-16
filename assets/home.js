/* أدواتي — منطق الصفحة الرئيسية: بحث الأدوات + مشاركة واتساب */
(function () {
  'use strict';

  /* ---------- بحث فوري في الأدوات ---------- */
  var input = document.getElementById('toolSearch');
  var grid = document.getElementById('toolsGrid');
  var empty = document.getElementById('noResults');
  if (input && grid) {
    input.addEventListener('input', function () {
      var q = input.value.trim();
      var shown = 0;
      var cards = grid.querySelectorAll('.tool-card');
      for (var i = 0; i < cards.length; i++) {
        var link = cards[i].querySelector('.card-link');
        var t = link ? link.textContent : '';
        var hit = !q || t.indexOf(q) !== -1;
        cards[i].style.display = hit ? '' : 'none';
        if (hit) shown++;
      }
      if (empty) empty.hidden = shown > 0;
    });
  }

  /* ---------- مشاركة الأداة عبر واتساب ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.share-btn') : null;
    if (!btn) return;
    var lang = document.documentElement.lang || 'ar';
    var card = btn.closest ? btn.closest('.tool-card') : null;
    var h3 = card ? card.querySelector('h3') : null;
    var title = (h3 && h3.textContent ? h3.textContent.trim() : '') || document.title;
    var url = btn.getAttribute('data-url') || location.href;
    var msg = lang === 'en'
      ? title + ' — try it free on Adawati: ' + url
      : title + ' — جرّبها مجاناً على أدواتي: ' + url;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
})();

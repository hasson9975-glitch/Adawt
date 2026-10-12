/* أدواتي - منطق الأدوات (يعمل كله داخل المتصفح، لا تُرفع ملفاتك لأي خادم) */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function downloadURI(uri, filename) {
    var a = document.createElement('a');
    a.href = uri;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' بايت';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' ك.ب';
    return (bytes / (1024 * 1024)).toFixed(2) + ' م.ب';
  }

  /* ---------- ضغط الصور ---------- */
  var cFile = $('compressFile'), cQuality = $('compressQuality'), cQVal = $('compressQualityVal');
  if (cFile) {
    var cImg = null, cOrigSize = 0, cName = '';
    if (cQuality && cQVal) {
      cQuality.addEventListener('input', function () { cQVal.textContent = cQuality.value + '%'; });
    }
    cFile.addEventListener('change', function () {
      var f = cFile.files[0];
      if (!f) return;
      cName = f.name.replace(/\.[^.]+$/, '');
      cOrigSize = f.size;
      loadImage(f).then(function (img) {
        cImg = img;
        $('compressBtn').disabled = false;
        $('compressInfo').innerHTML = 'الصورة الأصلية: ' + img.naturalWidth + '×' + img.naturalHeight + ' بكسل (' + formatBytes(cOrigSize) + ')';
      });
    });
    $('compressBtn').addEventListener('click', function () {
      if (!cImg) return;
      var q = (cQuality ? cQuality.value : 70) / 100;
      var canvas = document.createElement('canvas');
      canvas.width = cImg.naturalWidth;
      canvas.height = cImg.naturalHeight;
      canvas.getContext('2d').drawImage(cImg, 0, 0);
      var uri = canvas.toDataURL('image/jpeg', q);
      var approx = Math.round(uri.length * 0.75);
      var res = $('compressResult');
      res.classList.add('show');
      res.innerHTML = '<div class="stat">' + formatBytes(approx) + '<small>الحجم بعد الضغط (تقريبي)</small></div>' +
        '<div class="stat">' + Math.max(0, Math.round((1 - approx / cOrigSize) * 100)) + '%<small>نسبة التوفير</small></div><br>' +
        '<button class="btn" id="compressDownload">تحميل الصورة المضغوطة</button>';
      $('compressDownload').addEventListener('click', function () {
        downloadURI(uri, cName + '-compressed.jpg');
      });
    });
  }

  /* ---------- تحويل صيغ الصور ---------- */
  var vFile = $('convertFile');
  if (vFile) {
    var vImg = null, vName = '';
    vFile.addEventListener('change', function () {
      var f = vFile.files[0];
      if (!f) return;
      vName = f.name.replace(/\.[^.]+$/, '');
      loadImage(f).then(function (img) {
        vImg = img;
        $('convertBtn').disabled = false;
        var prev = document.createElement('canvas');
        prev.width = img.naturalWidth; prev.height = img.naturalHeight;
        prev.getContext('2d').drawImage(img, 0, 0);
        var box = $('convertPreview');
        box.classList.add('show');
        box.innerHTML = '';
        var im = document.createElement('img');
        im.src = prev.toDataURL('image/jpeg', 0.85);
        im.style.maxHeight = '220px';
        box.appendChild(im);
      });
    });
    $('convertBtn').addEventListener('click', function () {
      if (!vImg) return;
      var fmt = $('convertFormat').value;
      var mime = fmt === 'png' ? 'image/png' : (fmt === 'webp' ? 'image/webp' : 'image/jpeg');
      var canvas = document.createElement('canvas');
      canvas.width = vImg.naturalWidth; canvas.height = vImg.naturalHeight;
      var ctx = canvas.getContext('2d');
      if (fmt === 'jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(vImg, 0, 0);
      downloadURI(canvas.toDataURL(mime, 0.92), vName + '.' + fmt);
    });
  }

  /* ---------- تغيير حجم الصور ---------- */
  var rFile = $('resizeFile');
  if (rFile) {
    var rImg = null, rName = '', rRatio = 1;
    rFile.addEventListener('change', function () {
      var f = rFile.files[0];
      if (!f) return;
      rName = f.name.replace(/\.[^.]+$/, '');
      loadImage(f).then(function (img) {
        rImg = img;
        rRatio = img.naturalHeight / img.naturalWidth;
        $('resizeW').value = img.naturalWidth;
        $('resizeH').value = img.naturalHeight;
        $('resizeBtn').disabled = false;
        $('resizeInfo').textContent = 'الأبعاد الأصلية: ' + img.naturalWidth + '×' + img.naturalHeight + ' بكسل';
      });
    });
    $('resizeW').addEventListener('input', function () {
      if ($('keepRatio').checked && rRatio) $('resizeH').value = Math.round($('resizeW').value * rRatio);
    });
    $('resizeH').addEventListener('input', function () {
      if ($('keepRatio').checked && rRatio) $('resizeW').value = Math.round($('resizeH').value / rRatio);
    });
    $('resizePercent').addEventListener('input', function () {
      $('resizePercentVal').textContent = $('resizePercent').value + '%';
    });
    document.querySelectorAll('input[name="resizeMode"]').forEach(function (el) {
      el.addEventListener('change', function () {
        var byPct = document.querySelector('input[name="resizeMode"]:checked').value === 'percent';
        $('resizeByDims').style.display = byPct ? 'none' : 'block';
        $('resizeByPercent').style.display = byPct ? 'block' : 'none';
      });
    });
    $('resizeBtn').addEventListener('click', function () {
      if (!rImg) return;
      var byPct = document.querySelector('input[name="resizeMode"]:checked').value === 'percent';
      var w, h;
      if (byPct) {
        var p = $('resizePercent').value / 100;
        w = Math.max(1, Math.round(rImg.naturalWidth * p));
        h = Math.max(1, Math.round(rImg.naturalHeight * p));
      } else {
        w = Math.max(1, parseInt($('resizeW').value, 10) || rImg.naturalWidth);
        h = Math.max(1, parseInt($('resizeH').value, 10) || rImg.naturalHeight);
      }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(rImg, 0, 0, w, h);
      downloadURI(canvas.toDataURL('image/png'), rName + '-' + w + 'x' + h + '.png');
    });
  }

  /* ---------- عداد الكلمات والحروف ---------- */
  var tInput = $('counterInput');
  if (tInput) {
    tInput.addEventListener('input', function () {
      var txt = tInput.value;
      var chars = txt.length;
      var charsNoSpaces = txt.replace(/\s/g, '').length;
      var words = txt.trim() === '' ? 0 : txt.trim().split(/\s+/).length;
      var lines = txt === '' ? 0 : txt.split('\n').length;
      $('statChars').firstChild.textContent = chars + ' ';
      $('statCharsNoSpaces').firstChild.textContent = charsNoSpaces + ' ';
      $('statWords').firstChild.textContent = words + ' ';
      $('statLines').firstChild.textContent = lines + ' ';
    });
  }

  /* ---------- مولد كلمات المرور ---------- */
  var pLen = $('pwLength');
  if (pLen) {
    pLen.addEventListener('input', function () { $('pwLengthVal').textContent = pLen.value; });
    $('pwGenerate').addEventListener('click', function () {
      var len = parseInt(pLen.value, 10);
      var sets = ['abcdefghijkmnopqrstuvwxyz'];
      if ($('pwUpper').checked) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ');
      if ($('pwDigits').checked) sets.push('23456789');
      if ($('pwSymbols').checked) sets.push('!@#$%^&*()-_=+[]{}');
      var all = sets.join('');
      var pw = '';
      var cryptoObj = window.crypto || window.msCrypto;
      var rand = new Uint32Array(len);
      cryptoObj.getRandomValues(rand);
      for (var i = 0; i < len; i++) pw += all[rand[i] % all.length];
      $('pwOutput').value = pw;
      $('pwCopy').disabled = false;
    });
    $('pwCopy').addEventListener('click', function () {
      var out = $('pwOutput');
      out.select();
      try { document.execCommand('copy'); } catch (e) {}
      if (navigator.clipboard) navigator.clipboard.writeText(out.value);
      $('pwCopy').textContent = 'تم النسخ ✓';
      setTimeout(function () { $('pwCopy').textContent = 'نسخ كلمة المرور'; }, 1500);
    });
  }

  /* ---------- إزالة التشكيل ---------- */
  var dInput = $('tashkeelInput');
  if (dInput) {
    $('tashkeelBtn').addEventListener('click', function () {
      var out = dInput.value.replace(/[ً-ٰٟ]/g, '');
      $('tashkeelOutput').value = out;
      var box = $('tashkeelResult');
      box.classList.add('show');
      $('tashkeelCopy').disabled = false;
    });
    $('tashkeelCopy').addEventListener('click', function () {
      var out = $('tashkeelOutput');
      out.select();
      try { document.execCommand('copy'); } catch (e) {}
      if (navigator.clipboard) navigator.clipboard.writeText(out.value);
      $('tashkeelCopy').textContent = 'تم النسخ ✓';
      setTimeout(function () { $('tashkeelCopy').textContent = 'نسخ النص'; }, 1500);
    });
  }
})();

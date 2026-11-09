(function () {
  var glint = new window.Codeglint();
  var sampleJson = '{"enabled": true, "count": 3, "items": ["a", 2, null], "title": "Atlas demo"}';
  var sampleJs = 'const value = { enabled: true, count: 3 };\nfor (const item of value.items ?? []) { console.log(item); }';
  var malformedJson = '{"enabled": true, "count": 3, "items": [1, 2, 3';
  var escapedText = '<script>alert("xss")</script> & "quoted"';

  document.getElementById('json-demo').innerHTML = glint.highlight(sampleJson, { language: 'json' });
  document.getElementById('js-demo').innerHTML = glint.highlight(sampleJs, { language: 'javascript' });
  document.getElementById('broken-demo').innerHTML = glint.highlight(malformedJson, { language: 'json' });
  document.getElementById('escaped-demo').innerHTML = glint.highlight(escapedText, { language: 'plaintext' });

  document.getElementById('theme-toggle').addEventListener('click', function () {
    var root = document.documentElement;
    var bright = root.dataset.theme !== 'dark';
    root.dataset.theme = bright ? 'dark' : 'light';
    var lightLink = document.querySelector('link[href="../src/themes/light.css"]');
    var darkLink = document.querySelector('link[href="../src/themes/dark.css"]');

    if (bright) {
      lightLink.disabled = true;
      darkLink.disabled = false;
      document.getElementById('theme-toggle').textContent = 'Switch to light';
    } else {
      lightLink.disabled = false;
      darkLink.disabled = true;
      document.getElementById('theme-toggle').textContent = 'Switch to dark';
    }
  });
})();

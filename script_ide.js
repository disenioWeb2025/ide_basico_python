// ========== MANUAL TURTLE MODAL ==========

// Renderizador Markdown básico (títulos, listas, code inline y bloques)
function renderMarkdownBasico(md) {
  if (!md) return "<p>Manual no disponible.</p>";
  const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] || c));
  // Bloques de código ```lang ... ```
  md = md.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) =>
    `<pre><code class="lang-${lang || ''}">${esc(code)}</code></pre>`
  );
  // Backticks inline `code`
  md = md.replace(/`([^`]+)`/g, (m, code) => `<code>${esc(code)}</code>`);
  // Títulos
  md = md.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
         .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
         .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
         .replace(/^### (.*)$/gm, '<h3>$1</h3>')
         .replace(/^## (.*)$/gm, '<h2>$1</h2>')
         .replace(/^# (.*)$/gm, '<h1>$1</h1>');
  // Listas (líneas con "- ")
  md = md.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
  // Agrupar <li> contiguos en <ul>
  md = md.replace(/(?:^(?:<li>.*<\/li>\s*)+)/gm, block => `<ul>\n${block.trim()}\n</ul>\n`);
  // Párrafos: líneas que no empiezan con tags comunes
  md = md.replace(/^(?!<(h\d|ul|li|pre|\/li|\/ul))(.+)$/gm, '<p>$2</p>');
  return md;
}

(function setupManualTurtle() {
  const btn = document.getElementById('btnManualTurtle');
  const modal = document.getElementById('modalManual');
  const cerrar = document.getElementById('cerrarManual');
  const cont = document.getElementById('manualContenido');

  if (!btn || !modal || !cerrar || !cont) return;

  btn.addEventListener('click', () => {
    const md = (window.PLANTILLAS && window.PLANTILLAS.manual_turtle_md) || '# Manual no disponible';
    cont.innerHTML = renderMarkdownBasico(md);
    modal.style.display = 'flex';
  });

  cerrar.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Cerrar clickeando fuera del contenido
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      modal.style.display = 'none';
    }
  });
})();

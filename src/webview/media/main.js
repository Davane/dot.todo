(function () {
  const vscode = acquireVsCodeApi();

  const root = document.getElementById('root');
  const hideCompletedEl = document.getElementById('hideCompleted');

  let lastModel = { lines: [] };

  function textSpan(text) {
    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = text;
    return span;
  }

  function renderSpans(spans, host) {
    const frag = document.createDocumentFragment();
    for (const s of spans || []) {
      if (s.kind === 'text') {
        frag.appendChild(textSpan(s.text));
      } else if (s.kind === 'time') {
        const el = document.createElement('span');
        el.className = 'time-chip';
        el.textContent = s.text;
        frag.appendChild(el);
      } else if (s.kind === 'fileRef') {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'file-ref' + (s.fileExists ? '' : ' file-ref--missing');
        el.textContent = s.text;
        el.title = s.fileExists
          ? s.resolvedUri || s.rawPath
          : 'Missing: ' + s.rawPath;
        el.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          vscode.postMessage({
            type: 'openFile',
            resolvedUri: s.resolvedUri,
            rawPath: s.rawPath,
          });
        });
        frag.appendChild(el);
      }
    }
    host.appendChild(frag);
  }

  function render() {
    const model = lastModel;
    root.innerHTML = '';
    const hideDone = hideCompletedEl && hideCompletedEl.checked;

    for (const row of model.lines || []) {
      if (row.type === 'empty') {
        const el = document.createElement('div');
        el.className = 'row row--empty';
        root.appendChild(el);
        continue;
      }
      if (row.type === 'section') {
        const h = document.createElement('h2');
        h.className = 'section-title';
        h.textContent = row.title;
        root.appendChild(h);
        continue;
      }
      if (row.type === 'plain') {
        const p = document.createElement('p');
        p.className = 'plain';
        p.textContent = row.text;
        root.appendChild(p);
        continue;
      }
      if (row.type === 'todo') {
        if (hideDone && row.checked) {
          continue;
        }
        const wrap = document.createElement('div');
        wrap.className =
          'row todo-row' + (row.checked ? ' todo-row--done' : '');

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'todo-cb';
        cb.checked = !!row.checked;
        cb.setAttribute('aria-label', 'Toggle task');
        cb.addEventListener('click', (e) => {
          e.preventDefault();
          vscode.postMessage({ type: 'toggleCheckbox', line: row.line });
        });

        const body = document.createElement('div');
        body.className = 'todo-body';
        renderSpans(row.spans, body);

        wrap.appendChild(cb);
        wrap.appendChild(body);
        root.appendChild(wrap);
      }
    }
  }

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg && msg.type === 'updateModel') {
      lastModel = msg.payload || { lines: [] };
      render();
    }
  });

  if (hideCompletedEl) {
    hideCompletedEl.addEventListener('change', () => {
      render();
    });
  }

  vscode.postMessage({ type: 'ready' });
})();

const API = {
  base: '/api',
  async req(method, path, body = null) {
    const opts = { method, credentials: 'include', headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(this.base + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw data;
    return data;
  },
  get:    (p)    => API.req('GET',    p),
  post:   (p, b) => API.req('POST',   p, b),
  put:    (p, b) => API.req('PUT',    p, b),
  delete: (p)    => API.req('DELETE', p),
};

async function getSessao() {
  return API.get('/auth/sessao');
}

async function logout() {
  try { await API.post('/auth/logout'); } catch (_) {}
  window.location.href = '/';
}

async function exigirLogin() {
  const s = await getSessao();
  if (!s.logado) { window.location.href = '/pages/login.html'; return null; }
  return s.usuario;
}

// Navbar unificada — funciona em todas as páginas
async function atualizarNav() {
  const s = await getSessao();

  const els = {
    login:    document.getElementById('nav-login'),
    cadastro: document.getElementById('nav-cadastro'),
    painel:   document.getElementById('nav-painel'),
    logout:   document.getElementById('nav-logout'),
    nome:     document.getElementById('nav-nome'),
  };

  if (s.logado) {
    els.login    && (els.login.style.display    = 'none');
    els.cadastro && (els.cadastro.style.display = 'none');
    els.painel   && (els.painel.style.display   = 'list-item');
    els.nome     && (els.nome.style.display     = 'list-item');
    els.nome     && (els.nome.textContent       = s.usuario.nome.split(' ')[0]);
    if (els.logout) {
      els.logout.style.display = 'list-item';
      // garante que o botão interno tem o handler, independente do onclick no HTML
      const btn = els.logout.querySelector('button') || els.logout;
      btn.onclick = logout;
    }
  } else {
    els.painel   && (els.painel.style.display   = 'none');
    els.logout   && (els.logout.style.display   = 'none');
    els.nome     && (els.nome.style.display     = 'none');
    els.login    && (els.login.style.display    = 'list-item');
    els.cadastro && (els.cadastro.style.display = 'list-item');
  }
}

function mostrarErro(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.className = 'alerta alerta-erro';
}

function mostrarSucesso(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.className = 'alerta alerta-sucesso';
}

function emojiEspecie(e) {
  return { cachorro: '🐶', gato: '🐱', outro: '🐾' }[e] || '🐾';
}

document.addEventListener('DOMContentLoaded', async () => {
  // Se já logado, redireciona
  const s = await getSessao();
  if (s.logado) { window.location.href = '/'; return; }

  atualizarNav();

  // ── Login ──────────────────────────────────────────────────────────────────
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alerta = document.getElementById('alerta-login');
      const btn    = formLogin.querySelector('button[type=submit]');

      const email = document.getElementById('email').value.trim();
      const senha = document.getElementById('senha').value;

      if (!email || !senha) { mostrarErro(alerta, 'Preencha todos os campos.'); return; }

      btn.disabled = true;
      btn.textContent = 'Entrando…';

      try {
        await API.post('/auth/login', { email, senha });
        window.location.href = '/';
      } catch (err) {
        mostrarErro(alerta, err.erro || 'Erro ao fazer login.');
        btn.disabled = false;
        btn.textContent = 'Entrar';
      }
    });
  }

  // ── Cadastro ───────────────────────────────────────────────────────────────
  const formCadastro = document.getElementById('form-cadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alerta = document.getElementById('alerta-cadastro');
      const btn    = formCadastro.querySelector('button[type=submit]');

      const nome   = document.getElementById('nome').value.trim();
      const email  = document.getElementById('email').value.trim();
      const senha  = document.getElementById('senha').value;
      const senha2 = document.getElementById('senha2').value;
      const tipo   = document.getElementById('tipo').value;
      const telefone = document.getElementById('telefone')?.value.trim();
      const cidade   = document.getElementById('cidade')?.value.trim();

      if (!nome || !email || !senha || !tipo) {
        mostrarErro(alerta, 'Preencha todos os campos obrigatórios.'); return;
      }
      if (senha.length < 6) {
        mostrarErro(alerta, 'A senha deve ter no mínimo 6 caracteres.'); return;
      }
      if (senha !== senha2) {
        mostrarErro(alerta, 'As senhas não coincidem.'); return;
      }

      btn.disabled = true;
      btn.textContent = 'Cadastrando…';

      try {
        await API.post('/auth/cadastro', { nome, email, senha, tipo, telefone, cidade });
        window.location.href = '/';
      } catch (err) {
        const msg = err.erros ? err.erros.map(e => e.msg).join(' | ') : (err.erro || 'Erro ao cadastrar.');
        mostrarErro(alerta, msg);
        btn.disabled = false;
        btn.textContent = 'Criar conta';
      }
    });
  }
});

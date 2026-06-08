document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await exigirLogin();
  atualizarNav();

  // Saudação
  const el = document.getElementById('painel-nome');
  if (el) el.textContent = usuario.nome.split(' ')[0];

  const badgeTipo = document.getElementById('badge-tipo');
  if (badgeTipo) badgeTipo.textContent = usuario.tipo === 'doador' ? '🏠 Doador' : '🐾 Adotante';

  // Abas
  const abas    = document.querySelectorAll('.aba');
  const paineis = document.querySelectorAll('.painel-aba');

  abas.forEach(aba => {
    aba.addEventListener('click', () => {
      abas.forEach(a => a.classList.remove('ativa'));
      paineis.forEach(p => p.classList.remove('ativo'));
      aba.classList.add('ativa');
      document.getElementById('painel-' + aba.dataset.aba)?.classList.add('ativo');
    });
  });

  // ── Cadastrar animal ──────────────────────────────────────────────────────
  const formAnimal = document.getElementById('form-animal');
  const alertaAnimal = document.getElementById('alerta-animal');

  formAnimal?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = formAnimal.querySelector('button[type=submit]');

    const dados = {
      nome:      document.getElementById('a-nome').value.trim(),
      especie:   document.getElementById('a-especie').value,
      sexo:      document.getElementById('a-sexo').value,
      raca:      document.getElementById('a-raca').value.trim(),
      idade_anos:document.getElementById('a-idade').value || null,
      porte:     document.getElementById('a-porte').value,
      descricao: document.getElementById('a-descricao').value.trim(),
      vacinado:  document.getElementById('a-vacinado').checked,
      castrado:  document.getElementById('a-castrado').checked,
      foto_url:  document.getElementById('a-foto').value.trim() || null,
    };

    if (!dados.nome || !dados.especie || !dados.sexo) {
      mostrarErro(alertaAnimal, 'Preencha os campos obrigatórios.'); return;
    }

    btn.disabled = true;
    btn.textContent = 'Cadastrando…';

    try {
      await API.post('/animais', dados);
      mostrarSucesso(alertaAnimal, '🐾 Animal cadastrado com sucesso!');
      formAnimal.reset();
      carregarMeusAnimais();
    } catch (err) {
      const msg = err.erros ? err.erros.map(e => e.msg).join(' | ') : (err.erro || 'Erro.');
      mostrarErro(alertaAnimal, msg);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Cadastrar animal';
    }
  });

  // ── Meus animais ──────────────────────────────────────────────────────────
  async function carregarMeusAnimais() {
    const lista = document.getElementById('lista-meus-animais');
    if (!lista) return;
    lista.innerHTML = '<p class="carregando">Carregando…</p>';
    try {
      const animais = await API.get('/animais/meus');
      if (animais.length === 0) {
        lista.innerHTML = '<p class="vazio-msg">Você ainda não cadastrou nenhum animal.</p>';
        return;
      }
      lista.innerHTML = animais.map(a => `
        <div class="item-animal">
          <div class="item-animal-info">
            <span class="item-emoji">${emojiEspecie(a.especie)}</span>
            <div>
              <strong>${a.nome}</strong>
              <small>${a.especie} · ${a.sexo} · <span class="status-badge status-${a.status}">${a.status.replace('_', ' ')}</span></small>
              ${a.pedidos_pendentes > 0 ? `<small class="alerta-pedido">⚡ ${a.pedidos_pendentes} pedido(s) pendente(s)</small>` : ''}
            </div>
          </div>
          <div class="item-animal-acoes">
            <select class="select-status" data-id="${a.id}">
              <option value="disponivel" ${a.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
              <option value="em_processo" ${a.status === 'em_processo' ? 'selected' : ''}>Em processo</option>
              <option value="adotado" ${a.status === 'adotado' ? 'selected' : ''}>Adotado</option>
            </select>
            <button class="btn btn-perigo btn-sm" data-remover="${a.id}">Remover</button>
          </div>
        </div>
      `).join('');

      lista.querySelectorAll('.select-status').forEach(sel => {
        sel.addEventListener('change', async () => {
          try {
            await API.put(`/animais/${sel.dataset.id}/status`, { status: sel.value });
          } catch (err) {
            alert('Erro ao atualizar status.');
          }
        });
      });

      lista.querySelectorAll('[data-remover]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Remover este animal?')) return;
          try {
            await API.delete(`/animais/${btn.dataset.remover}`);
            carregarMeusAnimais();
          } catch { alert('Erro ao remover.'); }
        });
      });
    } catch { lista.innerHTML = '<p class="erro-geral">Erro ao carregar.</p>'; }
  }

  // ── Solicitações recebidas ────────────────────────────────────────────────
  async function carregarRecebidas() {
    const lista = document.getElementById('lista-recebidas');
    if (!lista) return;
    lista.innerHTML = '<p class="carregando">Carregando…</p>';
    try {
      const solic = await API.get('/solicitacoes/recebidas');
      if (solic.length === 0) {
        lista.innerHTML = '<p class="vazio-msg">Nenhuma solicitação recebida ainda.</p>';
        return;
      }
      lista.innerHTML = solic.map(s => `
        <div class="item-solic">
          <div class="item-solic-header">
            <strong>${emojiEspecie(s.especie)} ${s.animal_nome}</strong>
            <span class="status-badge status-${s.status}">${s.status}</span>
          </div>
          <p>👤 <strong>${s.adotante_nome}</strong> — ${s.adotante_cidade || '—'}</p>
          <p>📞 ${s.adotante_telefone || '—'} · 📧 ${s.adotante_email}</p>
          <p>🏠 ${s.tipo_moradia.replace(/_/g, ' ')} · 
             🐕 Outros pets: ${s.tem_outros_pets ? 'Sim' : 'Não'} · 
             👶 Crianças: ${s.tem_criancas ? 'Sim' : 'Não'}</p>
          ${s.mensagem ? `<p class="mensagem-solic">"${s.mensagem}"</p>` : ''}
          ${s.status === 'pendente' ? `
            <div class="acoes-solic">
              <button class="btn btn-sucesso btn-sm" data-aprovar="${s.id}">✓ Aprovar</button>
              <button class="btn btn-perigo btn-sm"  data-recusar="${s.id}">✗ Recusar</button>
            </div>` : ''}
        </div>
      `).join('');

      lista.querySelectorAll('[data-aprovar]').forEach(btn => {
        btn.addEventListener('click', async () => {
          await responderSolicitacao(btn.dataset.aprovar, 'aprovada');
        });
      });
      lista.querySelectorAll('[data-recusar]').forEach(btn => {
        btn.addEventListener('click', async () => {
          await responderSolicitacao(btn.dataset.recusar, 'recusada');
        });
      });
    } catch { lista.innerHTML = '<p class="erro-geral">Erro ao carregar.</p>'; }
  }

  async function responderSolicitacao(id, status) {
    try {
      await API.put(`/solicitacoes/${id}`, { status });
      carregarRecebidas();
      carregarMeusAnimais();
    } catch { alert('Erro ao responder solicitação.'); }
  }

  // ── Minhas solicitações ───────────────────────────────────────────────────
  async function carregarMinhas() {
    const lista = document.getElementById('lista-minhas-solic');
    if (!lista) return;
    lista.innerHTML = '<p class="carregando">Carregando…</p>';
    try {
      const solic = await API.get('/solicitacoes/minhas');
      if (solic.length === 0) {
        lista.innerHTML = '<p class="vazio-msg">Você ainda não solicitou nenhuma adoção.</p>';
        return;
      }
      lista.innerHTML = solic.map(s => `
        <div class="item-solic">
          <div class="item-solic-header">
            <strong>${emojiEspecie(s.especie)} ${s.animal_nome}</strong>
            <span class="status-badge status-${s.status}">${s.status}</span>
          </div>
          <p>🏠 Doador: ${s.doador_nome} · 📍 ${s.cidade || '—'}</p>
          <p>Moradia informada: ${s.tipo_moradia.replace(/_/g, ' ')}</p>
          <a href="/pages/animal.html?id=${s.animal_id}" class="link-animal">Ver animal →</a>
        </div>
      `).join('');
    } catch { lista.innerHTML = '<p class="erro-geral">Erro ao carregar.</p>'; }
  }

  // Inicializar
  carregarMeusAnimais();
  carregarRecebidas();
  carregarMinhas();
});

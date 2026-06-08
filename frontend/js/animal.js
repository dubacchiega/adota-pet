document.addEventListener('DOMContentLoaded', async () => {
  atualizarNav();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = '/'; return; }

  const sessao = await getSessao();

  try {
    const a = await API.get('/animais/' + id);

    document.title = `${a.nome} — Adota Pet`;

    // Foto / emoji
    const fotoEl = document.getElementById('animal-foto');
    if (a.foto_url) {
      fotoEl.innerHTML = `<img src="${a.foto_url}" alt="${a.nome}">`;
    } else {
      fotoEl.innerHTML = `<span class="detalhe-emoji">${emojiEspecie(a.especie)}</span>`;
    }

    document.getElementById('animal-nome').textContent    = a.nome;
    document.getElementById('animal-especie').textContent = a.especie;
    document.getElementById('animal-sexo').textContent    = a.sexo === 'macho' ? '♂ Macho' : '♀ Fêmea';
    document.getElementById('animal-raca').textContent    = a.raca || '—';
    document.getElementById('animal-idade').textContent   = a.idade_anos != null ? `${a.idade_anos} ${a.idade_anos === 1 ? 'ano' : 'anos'}` : '—';
    document.getElementById('animal-porte').textContent   = a.porte || '—';
    document.getElementById('animal-vacinado').textContent = a.vacinado ? '✓ Sim' : '✗ Não';
    document.getElementById('animal-castrado').textContent = a.castrado ? '✓ Sim' : '✗ Não';
    document.getElementById('animal-descricao').textContent = a.descricao || 'Sem descrição.';
    document.getElementById('doador-nome').textContent    = a.doador_nome;
    document.getElementById('doador-cidade').textContent  = a.cidade || '—';

    // Bloco de adoção
    const blocoAdocao = document.getElementById('bloco-adocao');
    const msgNaoLogado = document.getElementById('msg-nao-logado');

    if (a.status !== 'disponivel') {
      blocoAdocao.innerHTML = `<p class="status-indisponivel">Este animal ${a.status === 'adotado' ? 'já foi adotado 🎉' : 'está em processo de adoção'}.</p>`;
      return;
    }

    if (!sessao.logado) {
      blocoAdocao.style.display = 'none';
      msgNaoLogado.style.display = 'block';
      return;
    }

    // É o próprio dono?
    if (sessao.usuario.id === a.usuario_id) {
      blocoAdocao.innerHTML = '<p class="info-dono">Este é um dos seus animais cadastrados.</p>';
      return;
    }

    // Formulário de solicitação
    const form   = document.getElementById('form-adocao');
    const alerta = document.getElementById('alerta-adocao');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');

      const tipo_moradia    = document.getElementById('tipo_moradia').value;
      const tem_outros_pets = document.getElementById('tem_outros_pets').checked;
      const tem_criancas    = document.getElementById('tem_criancas').checked;
      const mensagem        = document.getElementById('mensagem').value.trim();

      if (!tipo_moradia) { mostrarErro(alerta, 'Informe o tipo de moradia.'); return; }

      btn.disabled = true;
      btn.textContent = 'Enviando…';

      try {
        await API.post('/solicitacoes', {
          animal_id: parseInt(id),
          tipo_moradia,
          tem_outros_pets,
          tem_criancas,
          mensagem,
        });
        mostrarSucesso(alerta, '🎉 Solicitação enviada! O doador entrará em contato.');
        form.style.display = 'none';
      } catch (err) {
        mostrarErro(alerta, err.erro || 'Erro ao enviar solicitação.');
        btn.disabled = false;
        btn.textContent = 'Enviar solicitação';
      }
    });

  } catch (err) {
    document.getElementById('conteudo-animal').innerHTML =
      '<p class="erro-geral">Animal não encontrado.</p>';
  }
});

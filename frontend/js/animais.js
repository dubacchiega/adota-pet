document.addEventListener('DOMContentLoaded', async () => {
  atualizarNav();

  const grid    = document.getElementById('grid-animais');
  const loading = document.getElementById('loading');
  const vazio   = document.getElementById('vazio');

  const filtroEspecie = document.getElementById('filtro-especie');
  const filtroPorte   = document.getElementById('filtro-porte');
  const filtroSexo    = document.getElementById('filtro-sexo');
  const filtroCidade  = document.getElementById('filtro-cidade');
  const btnFiltrar    = document.getElementById('btn-filtrar');
  const btnLimpar     = document.getElementById('btn-limpar');

  async function carregarAnimais() {
    grid.innerHTML = '';
    loading.style.display = 'flex';
    vazio.style.display   = 'none';

    const params = new URLSearchParams();
    if (filtroEspecie?.value) params.append('especie', filtroEspecie.value);
    if (filtroPorte?.value)   params.append('porte',   filtroPorte.value);
    if (filtroSexo?.value)    params.append('sexo',    filtroSexo.value);
    if (filtroCidade?.value)  params.append('cidade',  filtroCidade.value.trim());

    try {
      const animais = await API.get('/animais?' + params.toString());
      loading.style.display = 'none';

      if (animais.length === 0) {
        vazio.style.display = 'flex';
        return;
      }

      animais.forEach(a => {
        const card = document.createElement('article');
        card.className = 'card-animal';
        card.innerHTML = `
          <a href="/pages/animal.html?id=${a.id}" class="card-link">
            <div class="card-foto">
              ${a.foto_url
                ? `<img src="${a.foto_url}" alt="${a.nome}" loading="lazy">`
                : `<span class="card-emoji">${emojiEspecie(a.especie)}</span>`
              }
              <span class="card-especie tag">${a.especie}</span>
            </div>
            <div class="card-corpo">
              <h3 class="card-nome">${a.nome}</h3>
              <div class="card-meta">
                ${a.raca ? `<span>${a.raca}</span>` : ''}
                ${a.idade_anos != null ? `<span>${a.idade_anos} ${a.idade_anos === 1 ? 'ano' : 'anos'}</span>` : ''}
                <span>${a.sexo === 'macho' ? '♂ Macho' : '♀ Fêmea'}</span>
                ${a.porte ? `<span>${a.porte}</span>` : ''}
              </div>
              <div class="card-badges">
                ${a.vacinado ? '<span class="badge badge-verde">✓ Vacinado</span>' : ''}
                ${a.castrado ? '<span class="badge badge-azul">✓ Castrado</span>' : ''}
              </div>
              <p class="card-cidade">📍 ${a.cidade || 'Localização não informada'}</p>
            </div>
          </a>
        `;
        grid.appendChild(card);
      });
    } catch (err) {
      loading.style.display = 'none';
      grid.innerHTML = '<p class="erro-geral">Erro ao carregar animais. Tente novamente.</p>';
    }
  }

  btnFiltrar?.addEventListener('click', carregarAnimais);
  btnLimpar?.addEventListener('click', () => {
    if (filtroEspecie) filtroEspecie.value = '';
    if (filtroPorte)   filtroPorte.value   = '';
    if (filtroSexo)    filtroSexo.value    = '';
    if (filtroCidade)  filtroCidade.value  = '';
    carregarAnimais();
  });

  // Filtrar com Enter no campo cidade
  filtroCidade?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') carregarAnimais();
  });

  carregarAnimais();
});

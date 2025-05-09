document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const token   = localStorage.getItem('token');
  const admin   = localStorage.getItem('admin') === 'true';
  const userId  = parseInt(localStorage.getItem('userId'), 10);

  if (!token) {
    window.location.href = '/';
    return;
  }

  const jsonHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // --- Modal de criação de anúncio ---
  const btnCriar   = document.querySelector('.btn-anuncio');
  const modal      = document.getElementById('petFormModal');
  const closeModal = document.getElementById('closeModalBtn');
  btnCriar?.addEventListener('click',   () => modal.style.display = 'block');
  closeModal?.addEventListener('click', () => modal.style.display = 'none');

  // --- Lista de anúncios ---
  async function loadAnuncios() {
    try {
      const res = await fetch(`${baseUrl}/anuncios`, { headers: jsonHeaders });
      if (!res.ok) throw new Error(`Erro ${res.status} ao carregar anúncios`);
      const anuncios = await res.json();
      renderAnuncios(anuncios);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  function renderAnuncios(anuncios) {
    const container = document.getElementById('petList');
    container.innerHTML = '';
    anuncios.forEach(a => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${a.imagem || '/static/img/placeholder.png'}" alt="${a.titulo}" />
        <h3>${a.titulo}</h3>
        <p>Idade: ${a.idade} | Sexo: ${a.sexo}</p>
        <p>☎️ ${a.telefone}</p>
        <a href="https://wa.me/${a.telefone.replace(/\D/g,'')}" target="_blank">WhatsApp</a>
        ${(admin || a.usuario_id === userId)
          ? `<button class="del-btn" data-id="${a.id}">❌</button>`
          : ''
        }
      `;
      container.appendChild(card);
    });

    // Botões de exclusão
    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Excluir anúncio?')) return;
        const res = await fetch(`${baseUrl}/anuncios/${btn.dataset.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) alert(`Erro ${res.status} ao excluir`);
        loadAnuncios();
      };
    });
  }

  // --- Upload de imagem ---
  async function uploadImagem(file) {
    const fd = new FormData();
    fd.append('imagem', file);
    const res = await fetch(`${baseUrl}/upload-imagem`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Erro ${res.status} no upload${txt ? ': ' + txt : ''}`);
    }
    return (await res.json()).image_url;
  }

  // --- Criação de anúncio (refatorada) ---
  async function createAnuncio(e) {
    e.preventDefault();
    const form      = document.getElementById('petForm');
    const fileInput = form.elements['imagem'];  // <input name="imagem">
    let imgUrl = '';

    // Upload de imagem se houver
    if (fileInput && fileInput.files.length) {
      imgUrl = await uploadImagem(fileInput.files[0]);
    }

    // Monta payload usando os names definidos no HTML
    const payload = {
      titulo:               form.elements['nome_pet'].value.trim(),
      descricao:            form.elements['descricao'].value.trim(),
      idade:                form.elements['idade'].value.trim(),
      sexo:                 form.elements['sexo'].value,
      telefone_responsavel: form.elements['telefone'].value.trim(),
      imagem_url:           imgUrl
    };

    // Envia ao back-end
    const res = await fetch(`${baseUrl}/anuncios`, {
      method:  'POST',
      headers: jsonHeaders,
      body:    JSON.stringify(payload)
    });
    if (!res.ok) {
      const errTxt = await res.text().catch(() => '');
      throw new Error(`Erro ${res.status}${errTxt ? ': ' + errTxt : ''}`);
    }

    // Fecha modal, limpa form e recarrega listagem
    form.reset();
    modal.style.display = 'none';
    loadAnuncios();
  }

  // Associa o submit do form ao handler
  document.getElementById('petForm')?.addEventListener('submit', createAnuncio);

  // Inicia a listagem
  loadAnuncios();
});

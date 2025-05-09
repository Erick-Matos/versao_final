document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const token   = localStorage.getItem('token');
  const admin   = localStorage.getItem('admin') === 'true';
  const userId  = parseInt(localStorage.getItem('userId'), 10);

  // Se não estiver autenticado, volta à home
  if (!token) {
    window.location.href = '/';
    return;
  }

  // Headers comuns com JWT
  const jsonHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // --- Modal de criação de anúncio ---
  const btnCriarAnuncio = document.querySelector('.btn-anuncio');
  const petFormModal    = document.getElementById('petFormModal');
  const closeModalBtn   = document.getElementById('closeModalBtn');

  if (btnCriarAnuncio && petFormModal) {
    btnCriarAnuncio.addEventListener('click', () => {
      petFormModal.style.display = 'block';
    });
  }
  if (closeModalBtn && petFormModal) {
    closeModalBtn.addEventListener('click', () => {
      petFormModal.style.display = 'none';
    });
  }

  // --- Carregar anúncios e renderizar cards ---
  async function loadAnuncios() {
    try {
      const res = await fetch(`${baseUrl}/anuncios`, {
        headers: jsonHeaders
      });
      if (!res.ok) throw new Error(`Erro ${res.status} ao carregar anúncios`);
      const lista = await res.json();
      renderAnuncios(lista);
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
        <img src="${a.imagem||'/static/img/placeholder.png'}" alt="${a.titulo}" />
        <h3>${a.titulo}</h3>
        <p>Idade: ${a.idade} | Sexo: ${a.sexo}</p>
        <p>☎️ ${a.telefone}</p>
        <a href="https://wa.me/${a.telefone.replace(/\D/g,'')}" target="_blank">WhatsApp</a>
        ${(admin||a.usuario_id===userId) ? `
          <button class="edit-btn" data-id="${a.id}">Editar</button>
          <button class="del-btn" data-id="${a.id}">Excluir</button>
        `: ''}
      `;
      container.appendChild(card);
    });
    attachCardEvents();
  }

  function attachCardEvents() {
    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Confirma exclusão?')) return;
        const id = btn.dataset.id;
        try {
          const res = await fetch(`${baseUrl}/anuncios/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error(`Erro ${res.status} ao excluir`);
          loadAnuncios();
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      };
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.onclick = () => {
        // TODO: implementar abrir modal de edição e preencher campos
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
    if (!res.ok) throw new Error(`Erro ${res.status} no upload de imagem`);
    const json = await res.json();
    return json.image_url;
  }

  // --- Criar anúncio ---
  async function createAnuncio(e) {
    e.preventDefault();
    try {
      const form      = document.getElementById('petForm');
      const fileInput = document.getElementById('imagem');
      let   imgUrl    = '';

      if (fileInput.files.length) {
        imgUrl = await uploadImagem(fileInput.files[0]);
      }

      const payload = {
        titulo: form.titulo.value,
        descricao: form.descricao.value,
        idade: form.idade.value,
        sexo: form.sexo.value,
        telefone_responsavel: form.telefone.value,
        imagem_url: imgUrl
      };

      const res = await fetch(`${baseUrl}/anuncios`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const msg = await res.text().catch(()=>null);
        throw new Error(`Erro ${res.status}: ${msg||res.statusText}`);
      }
      form.reset();
      petFormModal.style.display = 'none';
      loadAnuncios();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  const petForm = document.getElementById('petForm');
  if (petForm) petForm.addEventListener('submit', createAnuncio);

  // --- Logout ---
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/';
  });

  // Inicial
  loadAnuncios();
});

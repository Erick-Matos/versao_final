document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const token   = localStorage.getItem('token');
  const admin   = localStorage.getItem('admin') === 'true';
  const userId  = parseInt(localStorage.getItem('userId'),10);

  if (!token) {
    window.location.href = '/';
    return;
  }

  const jsonHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // --- Modal ---
  const btnCriar   = document.querySelector('.btn-anuncio');
  const modal      = document.getElementById('petFormModal');
  const closeModal = document.getElementById('closeModalBtn');
  btnCriar?.addEventListener('click',   ()=> modal.style.display = 'block');
  closeModal?.addEventListener('click', ()=> modal.style.display = 'none');

  // --- Carrega anúncios ---
  async function loadAnuncios() {
    try {
      const res = await fetch(`${baseUrl}/anuncios`, { headers: jsonHeaders });
      if (!res.ok) throw new Error(`Erro ${res.status} ao carregar anúncios`);
      renderAnuncios(await res.json());
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
          <button class="del-btn" data-id="${a.id}">❌</button>
        ` : ''}
      `;
      container.appendChild(card);
    });

    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Excluir anúncio?')) return;
        const id = btn.dataset.id;
        const res = await fetch(`${baseUrl}/anuncios/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) alert(`Erro ${res.status}`);
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
    if (!res.ok) throw new Error(`Erro ${res.status} no upload`);
    const json = await res.json();
    return json.image_url;
  }

  // --- Criação de anúncio ---
  async function createAnuncio(e) {
    e.preventDefault();

    try {
      const fileInput = document.getElementById('imagem');
      let imgUrl = '';
      if (fileInput && fileInput.files.length) {
        imgUrl = await uploadImagem(fileInput.files[0]);
      }

      // Captura cada campo pelo ID
      const titulo    = document.getElementById('titulo').value.trim();
      const descricao = document.getElementById('descricao').value.trim();
      const idade     = document.getElementById('idade').value.trim();
      const sexo      = document.getElementById('sexo').value.trim();
      const telefone  = document.getElementById('telefone').value.trim();

      const payload = {
        titulo,
        descricao,
        idade,
        sexo,
        telefone_responsavel: telefone,
        imagem_url: imgUrl
      };

      const res = await fetch(`${baseUrl}/anuncios`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text().catch(()=>null);
        throw new Error(`Erro ${res.status}${text?': '+text:''}`);
      }

      // Fecha modal, limpa form e recarrega
      document.getElementById('petForm').reset();
      modal.style.display = 'none';
      loadAnuncios();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  document.getElementById('petForm')?.addEventListener('submit', createAnuncio);

  // --- Inicial ---
  loadAnuncios();
});

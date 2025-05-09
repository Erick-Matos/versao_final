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
    'Content-Type':  'application/json'
  };

  // ——— Configurações do modal ———
  const btnCriar   = document.querySelector('.btn-anuncio');
  const modal      = document.getElementById('petFormModal');
  const closeModal = document.getElementById('closeModal');  // era "closeModalBtn"
  const petForm    = document.getElementById('petForm');

  btnCriar?.addEventListener('click',   () => modal.style.display = 'block');
  closeModal?.addEventListener('click', () => {
    petForm.reset();
    modal.style.display = 'none';
  });

  // ——— Função que carrega e renderiza anúncios ———
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

    // exclusão de anúncio
    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Excluir anúncio?')) return;
        const res = await fetch(`${baseUrl}/anuncios/${btn.dataset.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) alert(`Erro ${res.status} ao excluir`);
        else loadAnuncios();
      });
    });
  }

  // ——— Upload de imagem ———
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
      throw new Error(`Erro ${res.status}${txt ? ': ' + txt : ''}`);
    }
    return (await res.json()).image_url;
  }

  // ——— Criação de anúncio ———
  async function createAnuncio(e) {
    e.preventDefault();

    // pegando pelos names do seu HTML
    const nome     = petForm.elements['petName']?.value.trim();
    const idade    = petForm.elements['petAge']?.value.trim();
    const telefone = petForm.elements['petPhone']?.value.trim();
    const sexo     = petForm.elements['petSex']?.value;
    let   imgUrl   = petForm.elements['existingImageUrl']?.value || '';

    if (!nome || !idade || !telefone || !sexo) {
      return alert('Preencha todos os campos!');
    }

    // se enviou arquivo novo, sobe antes de criar anúncio
    const fileInput = petForm.elements['imagem'];
    if (fileInput && fileInput.files.length) {
      try {
        imgUrl = await uploadImagem(fileInput.files[0]);
      } catch (err) {
        return alert(err.message);
      }
    }

    const payload = {
      titulo:     nome,
      idade:      idade,
      sexo:       sexo,
      telefone:   telefone,
      imagem_url: imgUrl
    };

    try {
      const res = await fetch(`${baseUrl}/anuncios`, {
        method:  'POST',
        headers: jsonHeaders,
        body:    JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erro ${res.status}`);
      }
      petForm.reset();
      modal.style.display = 'none';
      loadAnuncios();
    } catch (err) {
      alert(err.message);
    }
  }

  petForm?.addEventListener('submit', createAnuncio);

  // carrega tudo ao abrir
  loadAnuncios();
});

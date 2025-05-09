document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const token   = localStorage.getItem('token');
  const admin   = localStorage.getItem('admin') === 'true';
  const userId  = localStorage.getItem('userId');

  if (!token) {
    // se não estiver logado, volta pra home
    return window.location.href = '/';
  }

  // Cabeçalhos comuns com JWT
  const authHeaders = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  };

  // Carrega e renderiza anúncios
  async function loadAnuncios() {
    try {
      const res = await fetch(`${baseUrl}/anuncios`, {
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Erro ao carregar anúncios');
      const lista = await res.json();
      renderAnuncios(lista);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  // Exibe os cards na tela
  function renderAnuncios(anuncios) {
    const container = document.getElementById('petList');
    container.innerHTML = '';
    anuncios.forEach(a => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${a.imagem ? a.imagem : '/static/img/placeholder.png'}" alt="${a.titulo}" />
        <h3>${a.titulo}</h3>
        <p>Idade: ${a.idade} | Sexo: ${a.sexo}</p>
        <p>☎️ ${a.telefone}</p>
        <a href="https://wa.me/${a.telefone.replace(/\D/g,'')}" target="_blank">WhatsApp</a>
        ${admin || a.usuario_id === userId 
          ? `<button data-id="${a.id}" class="edit-btn">Editar</button>
             <button data-id="${a.id}" class="del-btn">Excluir</button>` 
          : ''
        }
      `;
      container.appendChild(card);
    });
    attachCardEvents();
  }

  // Associa editar/excluir em cada card
  function attachCardEvents() {
    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Confirma exclusão?')) return;
        const id = btn.dataset.id;
        try {
          const res = await fetch(`${baseUrl}/anuncios/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (!res.ok) throw new Error('Falha ao excluir');
          loadAnuncios();
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      };
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.onclick = () => {
        // Aqui você pode abrir seu modal de edição e preencher campos com os dados
        // para então chamar updateAnuncio(id, payload)
      };
    });
  }

  // Upload de imagem antes de criar
  async function uploadImagem(file) {
    const fd = new FormData();
    fd.append('imagem', file);
    const res = await fetch(`${baseUrl}/upload-imagem`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: fd
    });
    if (!res.ok) throw new Error('Erro no upload da imagem');
    const json = await res.json();
    return json.image_url;
  }

  // Criação de anúncio via JSON
  async function createAnuncio(e) {
    e.preventDefault();
    try {
      const form = document.getElementById('petForm');
      const fileInput = document.getElementById('imagem');
      let imgUrl = '';

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
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Erro ao criar anúncio');
      form.reset();
      loadAnuncios();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  // Associa o submit do formulário de criação
  const petForm = document.getElementById('petForm');
  if (petForm) {
    petForm.addEventListener('submit', createAnuncio);
  }

  // Logout simples
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/';
  });

  // Chama inicialmente
  loadAnuncios();
});

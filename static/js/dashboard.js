document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const token   = localStorage.getItem('token');
  const admin   = localStorage.getItem('admin') === 'true';
  const userId  = parseInt(localStorage.getItem('userId'),10);

  if (!token) return window.location.href = '/';

  const jsonHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Modal
  const btnCriar   = document.querySelector('.btn-anuncio');
  const modal      = document.getElementById('petFormModal');
  const closeModal = document.getElementById('closeModalBtn');
  btnCriar?.addEventListener('click', ()=> modal.style.display='block');
  closeModal?.addEventListener('click', ()=> modal.style.display='none');

  // Carrega anúncios
  async function loadAnuncios() {
    try {
      const r = await fetch(`${baseUrl}/anuncios`, { headers: jsonHeaders });
      if (!r.ok) throw new Error(`Erro ${r.status}`);
      renderAnuncios(await r.json());
    } catch(e) {
      alert(e.message);
    }
  }

  function renderAnuncios(list) {
    const cont = document.getElementById('petList');
    cont.innerHTML = '';
    list.forEach(a => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${a.imagem||'/static/img/placeholder.png'}"/>
        <h3>${a.titulo}</h3>
        <p>Idade: ${a.idade} | Sexo: ${a.sexo}</p>
        <p>☎️ ${a.telefone}</p>
        <a href="https://wa.me/${a.telefone.replace(/\D/g,'')}" target="_blank">WhatsApp</a>
        ${(admin||a.usuario_id===userId) ? 
          `<button class="del-btn" data-id="${a.id}">❌</button>` : ''}
      `;
      cont.appendChild(card);
    });
    // Excluir
    document.querySelectorAll('.del-btn').forEach(b=>{
      b.onclick = async ()=>{
        if(!confirm('Excluir?'))return;
        const id = b.dataset.id;
        await fetch(`${baseUrl}/anuncios/${id}`, {
          method:'DELETE', headers:{'Authorization':`Bearer ${token}`}
        });
        loadAnuncios();
      };
    });
  }

  // Upload de imagem
  async function uploadImagem(file) {
    const fd = new FormData();
    fd.append('imagem', file);
    const r = await fetch(`${baseUrl}/upload-imagem`, {
      method:'POST',
      headers:{ 'Authorization': `Bearer ${token}` },
      body:fd
    });
    if (!r.ok) throw new Error(`Erro ${r.status} upload`);
    return (await r.json()).image_url;
  }

  // Cria anúncio
  async function createAnuncio(e) {
    e.preventDefault();
    const form    = document.getElementById('petForm');
    const fileIn  = document.getElementById('imagem');
    let   imgUrl  = '';

    if (fileIn.files.length) {
      imgUrl = await uploadImagem(fileIn.files[0]);
    }

    // lê pelos name=... do form
    const f = form.elements;
    const payload = {
      titulo: f['titulo'].value,
      descricao: f['descricao'].value,
      idade: f['idade'].value,
      sexo: f['sexo'].value,
      telefone_responsavel: f['telefone'].value,
      imagem_url: imgUrl
    };

    const r = await fetch(`${baseUrl}/anuncios`, {
      method:'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(`Erro ${r.status}`);
    form.reset();
    modal.style.display = 'none';
    loadAnuncios();
  }

  document.getElementById('petForm')?.addEventListener('submit', createAnuncio);

  loadAnuncios();
});

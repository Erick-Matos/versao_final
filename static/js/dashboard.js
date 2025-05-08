document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  // Elementos da página
  const petListContainer = document.getElementById('petList');
  const btnCriarAnuncio = document.querySelector('.btn-anuncio');
  const petFormModal = document.getElementById('petFormModal');
  const petForm = document.getElementById('petForm');
  const closeModalBtn = document.getElementById('closeModal');
  const existingImageUrlInput = document.getElementById('existingImageUrl');

  let editId = null; // Para identificar se estamos editando ou criando um anúncio

  // Obtém o userId e admin do localStorage
  const loggedUserId = localStorage.getItem('userId');
  // Observe que, no localStorage, os valores são armazenados como string.
  const isAdmin = localStorage.getItem('admin') === 'true';

  // Função que faz fetch dos anúncios do backend
  async function loadPets() {
    try {
      const response = await fetch(`${baseUrl}/anuncios`);
      if (!response.ok) throw new Error("Erro ao carregar anúncios");
      return await response.json();
    } catch (error) {
      console.error("Erro ao carregar anúncios:", error);
      return [];
    }
  }

  // Função que renderiza todos os anúncios
  async function renderPets() {
    const pets = await loadPets();
    petListContainer.innerHTML = ''; // Limpa o container
    pets.forEach((pet) => {
      const mensagem = 'Olá, vi seu anúncio no Adote um Amigo e estou interessado no(a) ' + pet.nome_pet + '! Poderia me passar mais informações?';
      const urlWhats = "https://wa.me/" + pet.telefone_responsavel + "?text=" + encodeURIComponent(mensagem);

      // Inicialmente, define a ação padrão (apenas o botão de WhatsApp)
      let acoesHTML = `<a class="btn-whatsapp" target="_blank" href="${urlWhats}">WhatsApp</a>`;
      
      // Se o usuário é admin, ou se o anúncio pertence ao usuário comum logado, exibe os botões de editar e excluir
      if (isAdmin || (pet.usuario && pet.usuario.id.toString() === loggedUserId)) {
        acoesHTML = `
          <button class="btn-editar" data-id="${pet.id}">Editar</button>
          <button class="btn-excluir" data-id="${pet.id}">Excluir</button>
          ${acoesHTML}
        `;
      }

      // Cria o card do anúncio
      const petCard = document.createElement('div');
      petCard.classList.add('pet-card');
      petCard.innerHTML = `
        <img src="${pet.imagem_url || 'https://placedog.net/400/400'}" alt="${pet.nome_pet}">
        <div class="pet-info">
          <h2>${pet.nome_pet} <span class="sexo">${pet.sexo}</span></h2>
          <span>Idade: ${pet.idade} anos</span>
          <div class="actions">
            ${acoesHTML}
          </div>
        </div>
      `;
      petListContainer.appendChild(petCard);
    });

    // Adiciona eventos aos botões de editar e excluir, se existirem
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        editId = e.target.getAttribute('data-id');
        openEditForm(editId);
      });
    });
    document.querySelectorAll('.btn-excluir').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idToRemove = e.target.getAttribute('data-id');
        excluirPet(idToRemove);
      });
    });
  }

  // Abre o modal para edição pré-preenchendo o formulário com os dados do anúncio
  async function openEditForm(id) {
    try {
      const pets = await loadPets();
      const pet = pets.find(p => p.id == id);
      if (pet) {
        petForm.petName.value = pet.nome_pet;
        petForm.petAge.value = pet.idade;
        petForm.petSex.value = pet.sexo;
        petForm.petPhone.value = pet.telefone_responsavel;
        // Campo oculto para manter a imagem atual
        existingImageUrlInput.value = pet.imagem_url || "";
        petFormModal.classList.add('active');
      }
    } catch (error) {
      console.error("Erro ao buscar anúncio para edição:", error);
    }
  }

  // Função para excluir o anúncio
  async function excluirPet(id) {
    if (confirm('Tem certeza que deseja excluir esse anúncio?')) {
      try {
        const response = await fetch(`${baseUrl}/anuncios/${id}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        console.log(result.msg);
        await renderPets();
      } catch (error) {
        console.error("Erro ao excluir anúncio:", error);
      }
    }
  }

  // Abre o modal para criar novo anúncio
  btnCriarAnuncio.addEventListener('click', () => {
    editId = null;
    petForm.reset();
    petFormModal.classList.add('active');
  });

  // Fecha o modal
  closeModalBtn.addEventListener('click', () => {
    petFormModal.classList.remove('active');
  });
  petFormModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      petFormModal.classList.remove('active');
    }
  });

  // Envio do formulário (para criação ou edição)
  petForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const petName = petForm.petName.value;
    const petAge = parseInt(petForm.petAge.value);
    const petSex = petForm.petSex.value;
    const petPhone = petForm.petPhone.value;
    // Usa o ID do usuário logado para enviar com o anúncio
    const usuarioId = parseInt(loggedUserId);
    let image_url = "";

    const imageInput = document.getElementById('imagem');
    if (imageInput && imageInput.files && imageInput.files[0]) {
      const formData = new FormData();
      formData.append('imagem', imageInput.files[0]);
      try {
        const responseUpload = await fetch(`${baseUrl}/upload-imagem`, {
          method: 'POST',
          body: formData
        });
        const dataUpload = await responseUpload.json();
        if (responseUpload.ok) {
          image_url = dataUpload.image_url;
        } else {
          console.error("Erro no upload da imagem:", dataUpload.erro);
        }
      } catch (error) {
        console.error("Erro ao enviar imagem:", error);
      }
    } else {
      // Se estiver editando e não tiver selecionado nova imagem, usa a atual
      if (editId) {
        image_url = existingImageUrlInput.value;
      }
    }

    // Se editId não for nulo, atualiza o anúncio; caso contrário, cria um novo
    if (editId) {
      try {
        const response = await fetch(`http://127.0.0.1:5000/anuncios/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome_pet: petName,
            idade: petAge,
            sexo: petSex,
            imagem_url: image_url,
            telefone_responsavel: petPhone
          })
        });
        const result = await response.json();
        console.log(result.msg);
      } catch (error) {
        console.error("Erro ao atualizar anúncio:", error);
      }
      editId = null;
    } else {
      try {
        const response = await fetch(`${baseUrl}/anuncios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome_pet: petName,
            idade: petAge,
            sexo: petSex,
            imagem_url: image_url,
            telefone_responsavel: petPhone,
            usuario_id: usuarioId
          })
        });
        const result = await response.json();
        console.log(result.msg);
      } catch (error) {
        console.error("Erro ao criar anúncio:", error);
      }
    }

    petFormModal.classList.remove('active');
    petForm.reset();
    await renderPets();
  });

  // Renderiza os anúncios na carga inicial
  renderPets();
});

document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  // Elemento principal que engloba os formulários e os painéis de toggle
  const container = document.getElementById('container');

  // Botões para alternar entre login e cadastro (nos painéis de toggle)
  const loginToggleBtn = document.getElementById('login');
  const registerToggleBtn = document.getElementById('register');

  // Alterna a classe "active" para exibir o formulário correto
  if (loginToggleBtn) {
    loginToggleBtn.addEventListener('click', () => {
      container.classList.remove("active");
    });
  }
  if (registerToggleBtn) {
    registerToggleBtn.addEventListener('click', () => {
      container.classList.add("active");
    });
  }

  // Função que realiza o login enviando os dados para o backend
  async function realizarLogin(email, senha) {
    try {
      const response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, senha: senha })
      });
      
      const data = await response.json();
      console.log("Resposta do login:", data);
      if (response.ok) {
        // Salva os dados no localStorage para uso em outras páginas (p.ex., no dashboard)
        localStorage.setItem('token', data.token);
        localStorage.setItem('admin', data.admin);
        localStorage.setItem('userId', data.user_id);
        // Redireciona automaticamente para o dashboard sem exibir alert
        window.location.href = "dashboard.html";
      } else {
        alert(data.msg || "E-mail ou senha incorretos!");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro ao tentar fazer login.");
    }
  }
  
  // Evento de submissão do formulário de login (o formulário de login deve ter o id "loginForm")
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const senha = document.getElementById('password').value;
      realizarLogin(email, senha);
    });
  }
  
  // Função de cadastro de usuário comum (sem telefone)
  async function realizarCadastro(nome, email, senha) {
    try {
      const response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome, email: email, senha: senha })
      });
      const data = await response.json();
      console.log("Resposta do cadastro:", data);
      if (response.ok) {
        // Informa o usuário (alert) de cadastro realizado com sucesso
        alert("Usuário cadastrado com sucesso!");
        // Limpa o formulário de cadastro
        signUpForm.reset();
      } else {
        alert(data.msg || "Erro no cadastro!");
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      alert("Erro ao tentar fazer cadastro.");
    }
  }
  
  // Evento de submissão do formulário de cadastro (o formulário deve ter o id "signUpForm")
  const signUpForm = document.getElementById('signUpForm');
  if (signUpForm) {
    signUpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const senha = document.getElementById('signupPassword').value.trim();
      await realizarCadastro(nome, email, senha);
    });
  }
  
  // Função de logout (opcional)
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
  }
  
  // Exemplo de requisição autenticada para recursos protegidos (opcional)
  async function fetchProtectedResource() {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Token não encontrado");
      const response = await fetch(`${baseUrl}/health`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.status === 401) {
        alert("Sessão expirada, por favor faça login novamente.");
        logout();
      }
      const data = await response.json();
      console.log('Dados protegidos:', data);
    } catch (error) {
      console.error("Erro na requisição protegida:", error);
    }
  }
  
  // Chamada de exemplo (pode ser removida)
  // fetchProtectedResource();
});

document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const container = document.getElementById('container');
  const loginToggleBtn = document.getElementById('login');
  const registerToggleBtn = document.getElementById('register');
  const loginForm = document.getElementById('loginForm');
  const signUpForm = document.getElementById('signUpForm');

  // Toggle entre login e cadastro
  if (loginToggleBtn)    loginToggleBtn.addEventListener('click', () => container.classList.remove("active"));
  if (registerToggleBtn) registerToggleBtn.addEventListener('click', () => container.classList.add("active"));

  // Cadastro
  if (signUpForm) {
    signUpForm.addEventListener('submit', async e => {
      e.preventDefault();
      const nome  = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const senha = document.getElementById('signupPassword').value.trim();

      const res = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, telefone: '' })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Usuário cadastrado!");
        signUpForm.reset();
        container.classList.remove("active");
      } else {
        alert(data.message || "Erro no cadastro");
      }
    });
  }

  // Login
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const senha = document.getElementById('password').value.trim();

      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('admin', data.admin);
        localStorage.setItem('userId', data.user_id);
        window.location.href = "/dashboard";
      } else {
        alert(data.message || "Erro no login");
      }
    });
  }

});

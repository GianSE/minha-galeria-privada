// --- PASSO A: INICIALIZAÇÃO ---
// Substitua pelas suas chaves do Supabase (Fase 1.4)
const SUPABASE_URL = 'https://ohxhnegyewnytbvbeuvp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeGhuZWd5ZXdueXRidmJldXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY2NjIsImV4cCI6MjA3NzI3MjY2Mn0.rqzmNabEI0KyrPx9o604igq_CctSVc81ia_T2KZ_BAA';

// Cria o "cliente" Supabase
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase conectado!'); // Um teste para vermos no console

// --- PASSO B: CÓDIGO DE LOGIN ---

// Tenta encontrar o formulário de login na página atual
const loginForm = document.getElementById('login-form');

// Se o formulário existir, adicione o "escutador" de evento
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    // Previne que a página recarregue
    event.preventDefault(); 

    // Pega os elementos do HTML
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const messageElement = document.getElementById('login-message');

    messageElement.textContent = 'Entrando...'; // Feedback visual

    // Tenta fazer o login no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput.value,
      password: passwordInput.value,
    });

    if (error) {
      // Se deu erro, mostra o erro
      console.error('Erro no login:', error.message);
      messageElement.textContent = 'Email ou senha incorretos.';
    } else {
      // Se deu certo!
      console.log('Login bem-sucedido!', data);
      messageElement.textContent = 'Logado com sucesso! Redirecionando...';

      // Redireciona o usuário para a página da galeria
      window.location.href = 'galeria.html';
    }
  });
}
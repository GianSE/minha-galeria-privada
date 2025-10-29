// --- PASSO A: INICIALIZAÇÃO ---
const SUPABASE_URL = 'https://ohxhnegyewnytbvbeuvp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeGhuZWd5ZXdueXRidmJldXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY2NjIsImV4cCI6MjA3NzI3MjY2Mn0.rqzmNabEI0KyrPx9o604igq_CctSVc81ia_T2KZ_BAA';

// Cria o "cliente" Supabase
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase conectado!');

// --- PASSO B: CÓDIGO DE LOGIN (MODIFICADO) ---

const loginForm = document.getElementById('login-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); 

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const messageElement = document.getElementById('login-message');
    
    // --- MUDANÇA AQUI ---
    // 1. Reseta o estilo e mostra a mensagem "Entrando..."
    messageElement.className = 'message'; // Reseta para a classe base
    messageElement.textContent = 'Entrando...';
    messageElement.classList.add('message-success'); // Cor verde para "Entrando"

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput.value,
      password: passwordInput.value,
    });

    if (error) {
      // --- MUDANÇA AQUI ---
      // 2. Mostra a mensagem de ERRO com a classe de erro
      console.error('Erro no login:', error.message);
      messageElement.textContent = 'Email ou senha incorretos.';
      messageElement.className = 'message message-error'; // Adiciona classe de erro
    } else {
      // --- MUDANÇA AQUI ---
      // 3. Mostra a mensagem de SUCESSO com a classe de sucesso
      console.log('Login bem-sucedido!', data);
      messageElement.textContent = 'Logado com sucesso! Redirecionando...';
      messageElement.className = 'message message-success'; // Adiciona classe de sucesso

      // 4. Adiciona um DELAY antes de redirecionar (1500ms = 1.5 segundos)
      setTimeout(() => {
        window.location.href = 'galeria.html';
      }, 1500); // Espera 1.5 segundos
    }
  });
}
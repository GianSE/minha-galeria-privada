// --- PASSO A: INICIALIZAÇÃO ---
const SUPABASE_URL = 'https://ohxhnegyewnytbvbeuvp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeGhuZWd5ZXdueXRidmJldXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY2NjIsImV4cCI6MjA3NzI3MjY2Mn0.rqzmNabEI0KyrPx9o604igq_CctSVc81ia_T2KZ_BAA';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log('Supabase conectado!');

// --- GRANDE MUDANÇA AQUI ---
// Espera o HTML carregar 100% antes de executar o código
document.addEventListener('DOMContentLoaded', () => {
    
    // --- PASSO B: CÓDIGO DE LOGIN ---
    // (Agora dentro do "escutador")

    const loginForm = document.getElementById('login-form');
    
    // Agora, loginForm NÃO será nulo
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        // Previne que a página recarregue (o bug do "?")
        event.preventDefault(); 

        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const messageElement = document.getElementById('login-message');
        
        // 1. Reseta o estilo e mostra a mensagem "Entrando..."
        messageElement.className = 'message';
        messageElement.textContent = 'Entrando...';
        messageElement.classList.add('message-success'); // Cor verde

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput.value,
          password: passwordInput.value,
        });

        if (error) {
          // 2. Mostra a mensagem de ERRO (vermelha)
          console.error('Erro no login:', error.message);
          messageElement.textContent = 'Email ou senha incorretos.';
          messageElement.className = 'message message-error';
        } else {
          // 3. Mostra a mensagem de SUCESSO (verde)
          console.log('Login bem-sucedido!', data);
          messageElement.textContent = 'Logado com sucesso! Redirecionando...';
          messageElement.className = 'message message-success';

          // 4. Adiciona um DELAY antes de redirecionar (1.5 segundos)
          setTimeout(() => {
            window.location.href = 'galeria.html';
          }, 1500); 
        }
      });
    }

}); // Fim do 'DOMContentLoaded'
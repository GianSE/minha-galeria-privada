// --- PASSO A: INICIALIZAÇÃO ---
const SUPABASE_URL = 'https://ohxhnegyewnytbvbeuvp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeGhuZWd5ZXdueXRidmJldXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY2NjIsImV4cCI6MjA3NzI3MjY2Mn0.rqzmNabEI0KyrPx9o604igq_CctSVc81ia_T2KZ_BAA';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// DEBUG: 1. Verifica se o script foi carregado
console.log('DEBUG: app.js carregado. Supabase conectado.');

// --- GRANDE MUDANÇA (CORREÇÃO DO BUG) ---
// Espera o HTML carregar 100% antes de executar o código
document.addEventListener('DOMContentLoaded', () => {
    
    // DEBUG: 2. Verifica se o HTML está 100% pronto
    console.log('DEBUG: DOM 100% carregado. Procurando formulário...');
    
    // --- PASSO B: CÓDIGO DE LOGIN ---
    const loginForm = document.getElementById('login-form');
    
    // DEBUG: 3. Verifica se o formulário foi encontrado
    console.log("DEBUG: Formulário 'login-form' encontrado:", loginForm);
    
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        // Previne que a página recarregue (o bug do "?")
        event.preventDefault(); 
        
        // DEBUG: 4. Verifica se o clique no botão foi capturado
        console.log('DEBUG: Botão de "submit" clicado! event.preventDefault() chamado.');

        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const messageElement = document.getElementById('login-message');
        
        messageElement.className = 'message';
        messageElement.textContent = 'Entrando...';
        messageElement.classList.add('message-success');

        // DEBUG: 5. Verifica os dados antes de enviar
        console.log('DEBUG: Enviando para o Supabase...', { email: emailInput.value });

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput.value,
          password: passwordInput.value,
        });

        if (error) {
          // 2. Mostra a mensagem de ERRO (vermelha)
          console.error('DEBUG: Erro do Supabase:', error.message);
          messageElement.textContent = 'Email ou senha incorretos.';
          messageElement.className = 'message message-error';
        } else {
          // 3. Mostra a mensagem de SUCESSO (verde)
          console.log('DEBUG: Sucesso! Login bem-sucedido!', data);
          messageElement.textContent = 'Logado com sucesso! Redirecionando...';
          messageElement.className = 'message message-success';

          setTimeout(() => {
            window.location.href = 'galeria.html';
          }, 1500); 
        }
      });
    } else {
        // DEBUG: 6. Mensagem de erro se o formulário NÃO for encontrado
        console.error("DEBUG: FALHA CRÍTICA! Não consegui encontrar o elemento '#login-form' no HTML.");
    }

}); // Fim do 'DOMContentLoaded'
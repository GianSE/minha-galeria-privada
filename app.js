// --- PASSO A: INICIALIZAÇÃO ---
const SUPABASE_URL = 'https://ohxhnegyewnytbvbeuvp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeGhuZWd5ZXdueXRidmJldXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY2NjIsImV4cCI6MjA3NzI3MjY2Mn0.rqzmNabEI0KyrPx9o604igq_CctSVc81ia_T2KZ_BAA';

// --- CORREÇÃO AQUI ---
// Era "Supabase.createClient" (errado)
// Agora é "supabase.createClient" (minúsculo, correto)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DEBUG: 1. Verifica se o script foi carregado
console.log('DEBUG: app.js carregado. Supabase conectado:', supabaseClient);

document.addEventListener('DOMContentLoaded', () => {
    
    // DEBUG: 2. Verifica se o HTML está 100% pronto
    console.log('DEBUG: DOM 100% carregado. Procurando formulário...');
    
    const loginForm = document.getElementById('login-form');
    
    // DEBUG: 3. Verifica se o formulário foi encontrado
    console.log("DEBUG: Formulário 'login-form' encontrado:", loginForm);
    
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        
        // DEBUG: 4. Verifica se o clique no botão foi capturado
        console.log('DEBUG: Botão de "submit" clicado!');

        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const messageElement = document.getElementById('login-message');
        
        messageElement.className = 'message';
        messageElement.textContent = 'Entrando...';
        messageElement.classList.add('message-success');

        // DEBUG: 5. Verifica os dados antes de enviar
        console.log('DEBUG: Enviando para o Supabase...', { email: emailInput.value });
        
        // --- CORREÇÃO AQUI ---
        // Usando a nova variável "supabaseClient"
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: emailInput.value,
          password: passwordInput.value,
        });

        if (error) {
          console.error('DEBUG: Erro do Supabase:', error.message);
          messageElement.textContent = 'Email ou senha incorretos.';
          messageElement.className = 'message message-error';
        } else {
          console.log('DEBUG: Sucesso! Login bem-sucedido!', data);
          messageElement.textContent = 'Logado com sucesso! Redirecionando...';
          messageElement.className = 'message message-success';

          setTimeout(() => {
            window.location.href = 'galeria.html';
          }, 1500); 
        }
      });
    } else {
        console.error("DEBUG: FALHA CRÍTICA! Não consegui encontrar o elemento '#login-form' no HTML.");
    }

});
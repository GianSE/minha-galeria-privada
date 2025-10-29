// --- PASSO A: INICIALIZAÇÃO (PÁGINA DE LOGIN) ---
const SUPABASE_URL = 'https://ohxhnegyewnytbvbeuvp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeGhuZWd5ZXdueXRidmJldXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY2NjIsImV4cCI6MjA3NzI3MjY2Mn0.rqzmNabEI0KyrPx9o604igq_CctSVc81ia_T2KZ_BAA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('DEBUG: auth.js carregado. Supabase conectado.');

document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DA PÁGINA DE LOGIN (Fase 3) ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      console.log("DEBUG: Estou na página de login.");
      
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const messageElement = document.getElementById('login-message');
        
        messageElement.className = 'message';
        messageElement.textContent = 'Entrando...';
        messageElement.classList.add('message-success');

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
            window.location.href = 'templates/galeria.html'; // Caminho da pasta
          }, 1500); 
        }
      });
    } 
});
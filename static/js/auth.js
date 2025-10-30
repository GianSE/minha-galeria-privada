// --- PASSO A: INICIALIZAÇÃO (PÁGINA DE LOGIN) ---
const SUPABASE_URL = 'https://ohxhnegyewnytbvbeuvp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeGhuZWd5ZXdueXRidmJldXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY2NjIsImV4cCI6MjA3NzI3MjY2Mn0.rqzmNabEI0KyrPx9o604igq_CctSVc81ia_T2KZ_BAA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('DEBUG: auth.js carregado. Supabase conectado.');

document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DE LOGIN (E-mail/Senha) ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      // ... (código de login existente) ...
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

    // --- MUDANÇA: LÓGICA DE LOGIN COM GOOGLE ---
    const googleLoginButton = document.getElementById('google-login-button');
    if (googleLoginButton) {
        googleLoginButton.addEventListener('click', async () => {
            // Esta função redireciona o usuário para a tela de login do Google
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // OBRIGATÓRIO: O Supabase vai redirecionar para a galeria após o login.
                    redirectTo: `${window.location.origin}/templates/galeria.html`
                }
            });

            if (error) {
                alert('Erro ao tentar conectar com Google: ' + error.message);
                console.error('Erro Google Auth:', error);
            }
        });
    }
    // --- FIM DA MUDANÇA ---
});
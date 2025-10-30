// --- PASSO A: INICIALIZAÇÃO (PÁGINA DE LOGIN) ---
const SUPABASE_URL = 'https://ohxhnegyewnytbvbeuvp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeGhuZWd5ZXdueXRidmJldXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY2NjIsImV4cCI6MjA3NzI3MjY2Mn0.rqzmNabEI0KyrPx9o604igq_CctSVc81ia_T2KZ_BAA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('DEBUG: auth.js carregado. Supabase conectado.');

document.addEventListener('DOMContentLoaded', () => {
    
    // --- MUDANÇA 1: Seleciona os elementos no início ---
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const messageElement = document.getElementById('login-message');

    // --- MUDANÇA 2: LÓGICA PARA CARREGAR E-MAIL SALVO ---
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMeCheckbox.checked = true;
    }
    // --- FIM DA MUDANÇA 2 ---

    // --- LÓGICA DE LOGIN (E-mail/Senha) ---
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        
        // (Não precisa mais buscar os elementos, já buscamos acima)
        const passwordInput = document.getElementById('login-password');
        
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

          // --- MUDANÇA 3: LÓGICA PARA SALVAR/REMOVER E-MAIL ---
          if (rememberMeCheckbox.checked) {
              localStorage.setItem('rememberedEmail', emailInput.value);
          } else {
              localStorage.removeItem('rememberedEmail');
          }
          // --- FIM DA MUDANÇA 3 ---

          setTimeout(() => {
            window.location.href = 'templates/galeria.html'; // Caminho da pasta
          }, 1500); 
        }
      });
    } 
});
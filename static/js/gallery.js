// Este é o arquivo "maestro". Ele importa e conecta tudo.
import { checkUserSession } from './gallery-service.js';
import { setupUIListeners, refreshGallery } from './gallery-ui.js';

console.log('DEBUG: gallery.js (maestro) carregado.');

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Verifica se o usuário está logado
    const user = await checkUserSession();
    
    // 2. Se estiver logado, continua
    if (user) {
        // 3. Configura todos os botões e listeners da UI
        // Esta função agora TAMBÉM define as variáveis do DOM
        setupUIListeners();
        
        // 4. Carrega as fotos pela primeira vez
        await refreshGallery();
    }
    // (Se não estiver logado, o checkUserSession já o redirecionou)
});
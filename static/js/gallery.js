// --- PASSO A: INICIALIZAÇÃO (PÁGINA DA GALERIA) ---
const SUPABASE_URL = 'https://ohxhnegyewnytbvbeuvp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeGhuZWd5ZXdueXRidmJldXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY2NjIsImV4cCI6MjA3NzI3MjY2Mn0.rqzmNabEI0KyrPx9o604igq_CctSVc81ia_T2KZ_BAA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('DEBUG: gallery.js carregado. Supabase conectado.');

// --- INÍCIO DA FASE 5: VARIÁVEIS GLOBAIS ---
let currentUser = null; // Vamos guardar o usuário aqui
const galleryGrid = document.getElementById('gallery-grid');
const uploadForm = document.getElementById('upload-form');
const logoutButton = document.getElementById('logout-button');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const fileNameSpan = document.getElementById('file-name');
const uploadMessage = document.getElementById('upload-message');

// --- INÍCIO DA FASE 5: FUNÇÃO DE CARREGAR FOTOS ---
async function loadPhotos() {
    if (!currentUser) return; // Não faz nada se o usuário não estiver logado

    galleryGrid.innerHTML = '<p>Carregando fotos...</p>';

    // 1. Lista todos os arquivos na pasta do usuário
    const { data: files, error } = await supabaseClient.storage
        .from('fotos') // Nosso bucket
        .list(currentUser.id, { // A pasta do usuário
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
        });

    if (error) {
        console.error('DEBUG: Erro ao listar arquivos:', error.message);
        galleryGrid.innerHTML = '<p class="message message-error">Erro ao carregar fotos.</p>';
        return;
    }

    if (files.length === 0) {
        galleryGrid.innerHTML = '<p>Sua galeria está vazia.</p>';
        return;
    }

    galleryGrid.innerHTML = ''; // Limpa o "Carregando..."

    // 2. Cria as URLs assinadas (temporárias e seguras) para cada foto
    for (const file of files) {
        const { data: urlData, error: urlError } = await supabaseClient.storage
            .from('fotos')
            .createSignedUrl(`${currentUser.id}/${file.name}`, 3600); // URL válida por 1 hora

        if (urlError) {
            console.error(`DEBUG: Erro ao criar URL para ${file.name}:`, urlError.message);
        } else {
            // 3. Adiciona a foto ao grid
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img src="${urlData.signedUrl}" alt="${file.name}">
                <div class="gallery-item-info">
                    <span>${file.name}</span>
                    <button class="delete-button" data-filename="${file.name}">Deletar</button>
                </div>
            `;
            galleryGrid.appendChild(item);
        }
    }
}

// --- INÍCIO DA FASE 5: FUNÇÃO DE DELETAR FOTOS ---
async function deletePhoto(filename) {
    if (!currentUser || !filename) return;

    // Pede confirmação
    if (!confirm(`Tem certeza que quer deletar a foto "${filename}"?`)) {
        return;
    }

    const { error } = await supabaseClient.storage
        .from('fotos')
        .remove([`${currentUser.id}/${filename}`]); // Remove o arquivo do storage

    if (error) {
        console.error('DEBUG: Erro ao deletar:', error.message);
        alert('Falha ao deletar a foto.');
    } else {
        console.log('DEBUG: Foto deletada com sucesso');
        loadPhotos(); // Recarrega a galeria
    }
}


// --- LÓGICA PRINCIPAL DA PÁGINA (TUDO DEPENDE DO DOM) ---
document.addEventListener('DOMContentLoaded', () => {

    // --- INÍCIO DA FASE 5: VERIFICAÇÃO DE SEGURANÇA ---
    // Esta é a função mais importante da página.
    // Ela roda ANTES de todo o resto.
    async function checkUserSession() {
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            console.error('Erro ao pegar sessão:', error.message);
            window.location.href = '../index.html'; // Falha? Vai pro login.
            return;
        }

        if (!data.session) {
            // Se não há sessão (usuário não logado)
            console.log("DEBUG: Nenhum usuário logado. Redirecionando para login.");
            window.location.href = '../index.html';
        } else {
            // Se ESTÁ logado
            console.log("DEBUG: Usuário logado!", data.session.user.email);
            currentUser = data.session.user; // Guarda o usuário
            
            // Agora que sabemos quem é o usuário, carregamos as fotos
            loadPhotos();
        }
    }
    // --- FIM DA VERIFICAÇÃO DE SEGURANÇA ---

    // --- LÓGICA DE UPLOAD (Fase 4, adaptada) ---
    if (uploadForm) {
      let selectedFile = null; 
      
      dropZone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
          selectedFile = fileInput.files[0];
          fileNameSpan.textContent = selectedFile.name;
        }
      });
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        dropZone.classList.add('drop-zone--over');
      });
      ['dragleave', 'dragend'].forEach(type => {
        dropZone.addEventListener(type, () => dropZone.classList.remove('drop-zone--over'));
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drop-zone--over');
        if (e.dataTransfer.files.length > 0) {
          selectedFile = e.dataTransfer.files[0];
          fileInput.files = e.dataTransfer.files; 
          fileNameSpan.textContent = selectedFile.name;
        }
      });

      uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const file = selectedFile; 
        if (!file || !currentUser) {
          uploadMessage.textContent = 'Por favor, selecione um arquivo.';
          uploadMessage.className = 'message message-error';
          return;
        }
        
        const filePath = `${currentUser.id}/${file.name}`;
        uploadMessage.textContent = 'Enviando foto...';
        uploadMessage.className = 'message message-success';

        const { error } = await supabaseClient.storage
          .from('fotos')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (error) {
          console.error('DEBUG: Erro no upload:', error.message);
          uploadMessage.textContent = 'Erro no upload. Tente novamente.';
          uploadMessage.className = 'message message-error';
        } else {
          console.log('DEBUG: Upload com sucesso!');
          uploadMessage.textContent = 'Foto enviada com sucesso!';
          uploadMessage.className = 'message message-success';
          uploadForm.reset(); 
          selectedFile = null;
          fileNameSpan.textContent = 'Nenhum arquivo selecionado';
          
          // --- MUDANÇA DA FASE 5 ---
          // Recarrega a galeria para mostrar a nova foto
          loadPhotos(); 
        }
      });
    } // Fim do if(uploadForm)

    // --- Lógica do Logout ---
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = '../index.html'; 
      });
    }

    // --- INÍCIO DA FASE 5: "Escutador" de cliques para DELETAR ---
    // Usamos "event delegation" para pegar cliques nos botões de deletar
    if (galleryGrid) {
        galleryGrid.addEventListener('click', (event) => {
            // Verifica se o clique foi em um botão de deletar
            if (event.target.classList.contains('delete-button')) {
                const filename = event.target.dataset.filename;
                deletePhoto(filename);
            }
        });
    }
    
    // --- FINALMENTE, RODA A VERIFICAÇÃO DE SEGURANÇA ---
    checkUserSession();
    
}); // Fim do 'DOMContentLoaded'
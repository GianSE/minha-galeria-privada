// --- PASSO A: INICIALIZAÇÃO (PÁGINA DA GALERIA) ---
const SUPABASE_URL = 'https://ohxhnegyewnytbvbeuvp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIZUI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oeGhuZWd5ZXdueXRidmJldXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY2NjIsImV4cCI6MjA3NzI3MjY2Mn0.rqzmNabEI0KyrPx9o604igq_CctSVc81ia_T2KZ_BAA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('DEBUG: gallery.js carregado. Supabase conectado.');

// --- FASE 6: Função auxiliar para formatar bytes ---
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
// --- FIM FASE 6 ---

// --- Variáveis Globais (DOM) ---
let currentUser = null; // Vamos guardar o usuário aqui
const galleryGrid = document.getElementById('gallery-grid');
const uploadForm = document.getElementById('upload-form');
const logoutButton = document.getElementById('logout-button');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const fileNameSpan = document.getElementById('file-name');
const uploadMessage = document.getElementById('upload-message');
const storageInfo = document.getElementById('storage-info'); // --- FASE 6 ---

// --- Função de CARREGAR FOTOS (Atualizada p/ Fase 6) ---
async function loadPhotos() {
    if (!currentUser) return;

    galleryGrid.innerHTML = '<p>Carregando fotos...</p>';
    let totalSize = 0; // --- FASE 6 ---

    const { data: files, error } = await supabaseClient.storage
        .from('fotos') 
        .list(currentUser.id, { 
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
        storageInfo.textContent = 'Total usado: 0 Bytes de 1 GB'; // --- FASE 6 ---
        return;
    }

    galleryGrid.innerHTML = ''; 

    for (const file of files) {
        // --- FASE 6: Soma o tamanho total ---
        if (file.metadata && file.metadata.size) {
            totalSize += file.metadata.size;
        }

        const { data: urlData, error: urlError } = await supabaseClient.storage
            .from('fotos')
            .createSignedUrl(`${currentUser.id}/${file.name}`, 3600); 

        if (urlError) {
            console.error(`DEBUG: Erro ao criar URL para ${file.name}:`, urlError.message);
        } else {
            // --- FASE 6: Atualiza o HTML do item da galeria ---
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            // Mostra o tamanho do arquivo
            const fileSize = file.metadata ? formatBytes(file.metadata.size) : 'Tamanho desconhecido';

            item.innerHTML = `
                <img src="${urlData.signedUrl}" alt="${file.name}">
                
                <div class="gallery-item-meta">
                    <span class="file-size">Tamanho: ${fileSize}</span>
                </div>
                
                <div class="gallery-item-info">
                    <span>${file.name}</span>
                </div>

                <div class="gallery-item-actions">
                    <button class="rename-button" data-filename="${file.name}">Renomear</button>
                    <button class="delete-button" data-filename="${file.name}">Deletar</button>
                </div>
            `;
            galleryGrid.appendChild(item);
        }
    }

    // --- FASE 6: Atualiza o texto do total usado ---
    storageInfo.textContent = `Total usado (apenas fotos listadas): ${formatBytes(totalSize)} de 1 GB`;
}

// --- Função de DELETAR FOTOS (Fase 5) ---
async function deletePhoto(filename) {
    if (!currentUser || !filename) return;

    if (!confirm(`Tem certeza que quer deletar a foto "${filename}"?`)) {
        return;
    }

    const { error } = await supabaseClient.storage
        .from('fotos')
        .remove([`${currentUser.id}/${filename}`]); 

    if (error) {
        console.error('DEBUG: Erro ao deletar:', error.message);
        alert('Falha ao deletar a foto.');
    } else {
        console.log('DEBUG: Foto deletada com sucesso');
        loadPhotos(); // Recarrega a galeria
    }
}

// --- FASE 6: Função de RENOMEAR FOTOS ---
async function renamePhoto(oldFilename) {
    if (!currentUser || !oldFilename) return;

    // Pega o nome e a extensão
    const extension = oldFilename.substring(oldFilename.lastIndexOf('.'));
    const oldNameOnly = oldFilename.substring(0, oldFilename.lastIndexOf('.'));

    // Pede o novo nome
    const newNameOnly = prompt("Digite o novo nome para a foto (sem a extensão):", oldNameOnly);

    // Validação
    if (!newNameOnly || newNameOnly === oldNameOnly) {
        console.log('DEBUG: Renomeação cancelada.');
        return; // Cancela se o usuário clicar "cancelar" ou não mudar o nome
    }

    const newFilename = `${newNameOnly}${extension}`;
    const oldPath = `${currentUser.id}/${oldFilename}`;
    const newPath = `${currentUser.id}/${newFilename}`;

    // Tenta mover (renomear) o arquivo
    const { error } = await supabaseClient.storage
        .from('fotos')
        .move(oldPath, newPath);

    if (error) {
        console.error('DEBUG: Erro ao renomear:', error.message);
        alert(`Falha ao renomear a foto: ${error.message}`);
    } else {
        console.log('DEBUG: Foto renomeada com sucesso!');
        loadPhotos(); // Recarrega a galeria
    }
}
// --- FIM FASE 6 ---


// --- LÓGICA PRINCIPAL DA PÁGINA (TUDO DEPENDE DO DOM) ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Verificação de Segurança (Fase 5) ---
    async function checkUserSession() {
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error || !data.session) {
            console.log("DEBUG: Nenhum usuário logado. Redirecionando para login.");
            window.location.href = '../index.html';
        } else {
            console.log("DEBUG: Usuário logado!", data.session.user.email);
            currentUser = data.session.user; // Guarda o usuário
            loadPhotos(); // Carrega as fotos
        }
    }
    // --- Fim Verificação de Segurança ---

    // --- Lógica de Upload (Fase 4) ---
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
          uploadForm.reset(); 
          selectedFile = null;
          fileNameSpan.textContent = 'Nenhum arquivo selecionado';
          
          loadPhotos(); // Recarrega a galeria
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

    // --- FASE 6: "Escutador" de cliques (Atualizado) ---
    if (galleryGrid) {
        galleryGrid.addEventListener('click', (event) => {
            const target = event.target; // O elemento exato que foi clicado
            
            // Verifica se foi o botão DELETAR
            if (target.classList.contains('delete-button')) {
                const filename = target.dataset.filename;
                deletePhoto(filename);
            }
            
            // Verifica se foi o botão RENOMEAR
            if (target.classList.contains('rename-button')) {
                const filename = target.dataset.filename;
                renamePhoto(filename);
            }
        });
    }
    
    // --- RODA A VERIFICAÇÃO DE SEGURANÇA ---
    checkUserSession();
    
}); // Fim do 'DOMContentLoaded'
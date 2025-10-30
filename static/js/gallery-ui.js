// Este arquivo lida com TODA a manipulação do DOM (Interface)
import { formatBytes } from './supabase-config.js';
import * as service from './gallery-service.js';

// --- Variáveis do DOM (definidas na inicialização) ---
let galleryGrid, uploadForm, logoutButton, fileInput, dropZone;
let fileNameSpan, uploadMessage, storageInfo;
let lightboxModal, lightboxImg, lightboxClose, lightboxPrev, lightboxNext;
let submitUploadButton, cancelUploadButton; 

// --- Variáveis de Estado da UI ---
let selectedFiles = []; 
let currentPhotoList = []; 
let currentPhotoIndex = 0; 
let touchStartX = 0, touchMoveX = 0;
let isUploading = false;
let cancelUpload = false;

// --- 1. FUNÇÕES DE RENDERIZAÇÃO E UI ---
// (Funções showMessage não muda)
function showMessage(element, text, isError = false) {
    if (!element) return; 
    element.textContent = text;
    element.className = isError ? 'message message-error' : 'message message-success';
}

// --- MUDANÇA 1: RENDER PHOTO ---
function renderPhoto(file, index) { 
    const fileSize = file.metadata ? formatBytes(file.metadata.size) : 'Tamanho desconhecido';
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
        <img src="${file.signedUrl}" alt="${file.name}" data-index="${index}">
        <div class="gallery-item-meta">
            <span class="file-size">Tamanho: ${fileSize}</span>
        </div>
        <div class="gallery-item-info">
            <span>${file.name}</span>
        </div>
        <div class="gallery-item-actions">
            <button class="download-button" data-filename="${file.name}" data-url="${file.signedUrl}">Download</button>
            <button class="rename-button" data-filename="${file.name}">Renomear</button>
            <button class="delete-button" data-filename="${file.name}">Deletar</button>
        </div>
    `;
    galleryGrid.appendChild(item);
}
// --- FIM DA MUDANÇA 1 ---

// --- 2. FUNÇÕES DO LIGHTBOX ---
// (Funções showPhotoAtIndex, openLightbox, closeLightbox não mudam)
function showPhotoAtIndex(index) { /* ... (código igual) ... */ 
    if (index < 0 || index >= currentPhotoList.length) return;
    currentPhotoIndex = index;
    lightboxImg.src = currentPhotoList[index];
    lightboxPrev.style.display = (index === 0) ? 'none' : 'block';
    lightboxNext.style.display = (index === currentPhotoList.length - 1) ? 'none' : 'block';
}
function openLightbox(index) { /* ... (código igual) ... */ 
    lightboxModal.style.display = "flex";
    showPhotoAtIndex(index);
}
function closeLightbox() { /* ... (código igual) ... */ 
    lightboxModal.style.display = "none";
}

// --- 3. FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO DA UI ---
// (Função refreshGallery não muda)
export async function refreshGallery() { /* ... (código igual) ... */ 
    if (!galleryGrid || !storageInfo) return; 
    galleryGrid.innerHTML = '<p>Carregando fotos...</p>';
    storageInfo.textContent = 'Calculando espaço usado...';
    const { photoData, totalSize, error } = await service.loadPhotos();
    if (error) {
        galleryGrid.innerHTML = `<p class="message message-error">Erro ao carregar fotos: ${error}</p>`;
        return;
    }
    currentPhotoList = []; 
    galleryGrid.innerHTML = ''; 
    if (photoData.length === 0) {
        galleryGrid.innerHTML = '<p>Sua galeria está vazia.</p>';
        storageInfo.textContent = 'Total usado: 0 Bytes de 1 GB (0.00%)';
        return;
    }
    photoData.forEach((file, index) => {
        if (file.signedUrl) {
            currentPhotoList.push(file.signedUrl); 
            renderPhoto(file, index);
        }
    });
    const totalGBemBytes = 1073741824; 
    const percentage = (totalSize / totalGBemBytes) * 100;
    storageInfo.textContent = `Total usado: ${formatBytes(totalSize)} de 1 GB (${percentage.toFixed(2)}%)`;
}

// --- 4. FUNÇÃO DE CONFIGURAÇÃO DOS EVENTOS ---

export function setupUIListeners() {
    // Define as variáveis do DOM
    galleryGrid = document.getElementById('gallery-grid');
    uploadForm = document.getElementById('upload-form');
    logoutButton = document.getElementById('logout-button');
    fileInput = document.getElementById('file-input');
    dropZone = document.getElementById('drop-zone');
    fileNameSpan = document.getElementById('file-name');
    uploadMessage = document.getElementById('upload-message');
    storageInfo = document.getElementById('storage-info');
    lightboxModal = document.getElementById('lightbox-modal');
    lightboxImg = document.getElementById('lightbox-img');
    lightboxClose = document.getElementById('lightbox-close');
    lightboxPrev = document.getElementById('lightbox-prev');
    lightboxNext = document.getElementById('lightbox-next');
    submitUploadButton = document.getElementById('submit-upload-button');
    cancelUploadButton = document.getElementById('cancel-upload-button');

    if (!uploadForm || !galleryGrid || !logoutButton || !lightboxModal) {
        console.error("DEBUG: Elementos essenciais da UI não encontrados. Verifique seu HTML.");
        return;
    }

    // --- (Função "clearSelection" não muda) ---
    function clearSelection() {
        selectedFiles = [];
        fileInput.value = null; // <- O passo mais importante para limpar
        fileNameSpan.textContent = 'Nenhum arquivo selecionado';
        cancelUploadButton.style.display = 'none'; // Esconde o botão "Limpar"
        submitUploadButton.style.display = 'block'; // Garante que "Enviar" está visível
        showMessage(uploadMessage, ''); // Limpa a mensagem
    }

    // --- (Listeners do Drag-and-Drop não mudam) ---
    function handleFileSelection(files) {
        if (files.length > 0) {
            selectedFiles = Array.from(files);
            fileNameSpan.textContent = `${selectedFiles.length} fotos selecionadas`;
            // Mostra o botão "Limpar"
            cancelUploadButton.textContent = 'Limpar Seleção';
            cancelUploadButton.style.display = 'block';
        }
    }
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFileSelection(fileInput.files));
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drop-zone--over'); });
    ['dragleave', 'dragend'].forEach(type => {
        dropZone.addEventListener(type, () => dropZone.classList.remove('drop-zone--over'));
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drop-zone--over');
        fileInput.files = e.dataTransfer.files; // Sincroniza
        handleFileSelection(e.dataTransfer.files);
    });

    // --- (Listener de Envio não muda) ---
    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (selectedFiles.length === 0) {
            showMessage(uploadMessage, 'Por favor, selecione um ou mais arquivos.', true);
            return;
        }
        if (isUploading) return; 

        // 1. Inicia o estado de upload
        isUploading = true;
        cancelUpload = false;
        cancelUploadButton.textContent = 'Cancelar Envio'; // Muda o texto
        submitUploadButton.style.display = 'none'; // Esconde "Enviar"

        const totalFiles = selectedFiles.length;
        let filesUploaded = 0;
        let errors = [];

        for (const file of selectedFiles) {
            // 2. Verifica o sinalizador de cancelamento
            if (cancelUpload) {
                showMessage(uploadMessage, 'Envio cancelado pelo usuário.', true);
                break; // Sai do loop
            }

            showMessage(uploadMessage, `Enviando ${filesUploaded + 1} de ${totalFiles}: ${file.name}...`);
            const { error } = await service.uploadPhoto(file);

            if (error) {
                console.error(`Falha ao enviar ${file.name}:`, error.message);
                errors.push(file.name);
            } else {
                filesUploaded++;
            }
        }

        // 3. Finaliza o estado de upload
        isUploading = false;
        submitUploadButton.style.display = 'block'; // Restaura "Enviar"

        if (!cancelUpload) {
            if (errors.length > 0) {
                showMessage(uploadMessage, `Envio concluído com ${errors.length} erros. ${filesUploaded} fotos enviadas.`, true);
            } else {
                showMessage(uploadMessage, `Sucesso! Todas as ${totalFiles} fotos foram enviadas.`);
            }
        }

        // 4. Limpa e recarrega
        clearSelection(); // Usa a nova função para limpar tudo
        await refreshGallery(); 
    });

    // --- (Listener do botão "Cancelar" não muda) ---
    cancelUploadButton.addEventListener('click', () => {
        if (isUploading) {
            // Lógica para CANCELAR O ENVIO
            showMessage(uploadMessage, 'Cancelando... Aguarde o término do arquivo atual.', true);
            cancelUpload = true; // Define o sinalizador
        } else {
            // Lógica para LIMPAR A SELEÇÃO
            clearSelection();
            showMessage(uploadMessage, 'Seleção limpa.', false);
        }
    });

    // --- Listener de Logout (Não muda) ---
    logoutButton.addEventListener('click', service.handleLogout);

    // --- MUDANÇA 2: LISTENERS DO GRID ---
    galleryGrid.addEventListener('click', async (event) => {
        const target = event.target;
        const filename = target.dataset.filename;

        // --- LÓGICA DO BOTÃO DE DOWNLOAD ADICIONADA ---
        if (target.classList.contains('download-button')) {
            const url = target.dataset.url;
            
            // Dá feedback ao usuário
            target.textContent = 'Baixando...';
            target.disabled = true;

            try {
                // 1. Busca o arquivo
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Falha no download: ${response.statusText}`);
                }
                // 2. Converte em um Blob (arquivo binário)
                const blob = await response.blob();
                
                // 3. Cria um link temporário na memória
                const objectUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = filename; // O nome do arquivo
                
                // 4. "Clica" no link e faz a limpeza
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // 5. Libera o URL da memória
                URL.revokeObjectURL(objectUrl);

            } catch (err) {
                console.error('Erro ao baixar foto:', err);
                alert(`Não foi possível baixar a foto. (${err.message})`);
            } finally {
                // Restaura o botão
                target.textContent = 'Download';
                target.disabled = false;
            }
        }
        // --- FIM DA LÓGICA DE DOWNLOAD ---

        if (target.classList.contains('delete-button')) {
            if (!confirm(`Tem certeza que quer deletar a foto "${filename}"?`)) return;
            const { error } = await service.deletePhoto(filename);
            if (error) alert(`Falha ao deletar: ${error.message}`);
            else await refreshGallery();
        }
        if (target.classList.contains('rename-button')) {
            const extension = filename.substring(filename.lastIndexOf('.'));
            const oldNameOnly = filename.substring(0, filename.lastIndexOf('.'));
            const newNameOnly = prompt("Digite o novo nome...", oldNameOnly);
            if (!newNameOnly || newNameOnly === oldNameOnly) return;
            const newFilename = `${newNameOnly}${extension}`;
            const { error } = await service.renamePhoto(filename, newFilename);
            if (error) alert(`Falha ao renomear: ${error.message}`);
            else await refreshGallery();
        }
        if (target.tagName === 'IMG') {
            const index = parseInt(target.dataset.index, 10);
            openLightbox(index);
        }
    });
    // --- FIM DA MUDANÇA 2 ---

    // --- Listeners do Lightbox (Não muda) ---
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxModal.addEventListener('click', (e) => { if (e.target === lightboxModal) closeLightbox(); });
    lightboxNext.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex + 1));
    lightboxPrev.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex - 1));
    document.addEventListener('keydown', (e) => { /* ... (código igual) ... */
        if (lightboxModal.style.display === 'flex') {
            if (e.key === 'ArrowRight') showPhotoAtIndex(currentPhotoIndex + 1);
            if (e.key === 'ArrowLeft') showPhotoAtIndex(currentPhotoIndex - 1);
            if (e.key === 'Escape') closeLightbox();
        }
    });
    lightboxModal.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
    lightboxModal.addEventListener('touchmove', (e) => { touchMoveX = e.touches[0].clientX; });
    lightboxModal.addEventListener('touchend', () => { /* ... (código igual) ... */
        if (touchMoveX === 0) return;
        const deltaX = touchMoveX - touchStartX;
        if (deltaX > 50) showPhotoAtIndex(currentPhotoIndex - 1);
        else if (deltaX < -50) showPhotoAtIndex(currentPhotoIndex + 1);
        touchStartX = 0;
        touchMoveX = 0;
    });
}
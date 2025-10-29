// Este arquivo lida com TODA a manipulação do DOM (Interface)
import { formatBytes } from './supabase-config.js';
import * as service from './gallery-service.js';

// --- Variáveis do DOM (definidas na inicialização) ---
let galleryGrid, uploadForm, logoutButton, fileInput, dropZone;
let fileNameSpan, uploadMessage, storageInfo;
let lightboxModal, lightboxImg, lightboxClose, lightboxPrev, lightboxNext;
let submitUploadButton, cancelUploadButton; // --- NOVO ---

// --- Variáveis de Estado da UI ---
let selectedFiles = []; 
let currentPhotoList = []; 
let currentPhotoIndex = 0; 
let touchStartX = 0, touchMoveX = 0;

// --- NOVAS Variáveis de Estado (Cancelamento) ---
let isUploading = false;
let cancelUpload = false;
// --- FIM NOVO ---


// --- 1. FUNÇÕES DE RENDERIZAÇÃO E UI ---
// (Funções showMessage e renderPhoto não mudam)
function showMessage(element, text, isError = false) {
    if (!element) return; 
    element.textContent = text;
    element.className = isError ? 'message message-error' : 'message message-success';
}

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
            <button class="rename-button" data-filename="${file.name}">Renomear</button>
            <button class="delete-button" data-filename="${file.name}">Deletar</button>
        </div>
    `;
    galleryGrid.appendChild(item);
}

// --- 2. FUNÇÕES DO LIGHTBOX ---
// (Funções showPhotoAtIndex, openLightbox, closeLightbox não mudam)
function showPhotoAtIndex(index) {
    if (index < 0 || index >= currentPhotoList.length) return;
    currentPhotoIndex = index;
    lightboxImg.src = currentPhotoList[index];
    lightboxPrev.style.display = (index === 0) ? 'none' : 'block';
    lightboxNext.style.display = (index === currentPhotoList.length - 1) ? 'none' : 'block';
}
function openLightbox(index) {
    lightboxModal.style.display = "flex";
    showPhotoAtIndex(index);
}
function closeLightbox() {
    lightboxModal.style.display = "none";
}

// --- 3. FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO DA UI ---
// (Função refreshGallery não muda)
export async function refreshGallery() {
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

    const totalGBemBytes = 1073741824; // 1 GB
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
    
    // --- MUDANÇA (Cancelamento) ---
    submitUploadButton = document.getElementById('submit-upload-button');
    cancelUploadButton = document.getElementById('cancel-upload-button');
    // --- FIM MUDANÇA ---

    if (!uploadForm || !galleryGrid || !logoutButton || !lightboxModal) {
        console.error("DEBUG: Elementos essenciais da UI não encontrados. Verifique seu HTML.");
        return;
    }

    // --- Listeners do Drag-and-Drop (Não muda) ---
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            selectedFiles = Array.from(fileInput.files);
            fileNameSpan.textContent = `${selectedFiles.length} fotos selecionadas`;
        }
    });
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drop-zone--over'); });
    ['dragleave', 'dragend'].forEach(type => {
        dropZone.addEventListener(type, () => dropZone.classList.remove('drop-zone--over'));
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drop-zone--over');
        if (e.dataTransfer.files.length > 0) {
            selectedFiles = Array.from(e.dataTransfer.files);
            fileInput.files = e.dataTransfer.files; 
            fileNameSpan.textContent = `${selectedFiles.length} fotos selecionadas`;
        }
    });

    // --- MUDANÇA (Cancelamento): Listener de Envio (Atualizado) ---
    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (selectedFiles.length === 0) {
            showMessage(uploadMessage, 'Por favor, selecione um ou mais arquivos.', true);
            return;
        }
        if (isUploading) return; // Previne duplo clique

        // 1. Inicia o estado de upload
        isUploading = true;
        cancelUpload = false;
        uploadForm.classList.add('is-uploading'); // CSS vai trocar os botões

        const totalFiles = selectedFiles.length;
        let filesUploaded = 0;
        let errors = [];

        for (const file of selectedFiles) {
            // 2. Verifica o sinalizador de cancelamento ANTES de cada upload
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

        // 3. Finaliza o estado de upload (aconteça o que acontecer)
        isUploading = false;
        uploadForm.classList.remove('is-uploading'); // CSS restaura os botões

        // 4. Reporta o resultado
        if (!cancelUpload) { // Só mostra o resultado final se não foi cancelado
            if (errors.length > 0) {
                showMessage(uploadMessage, `Envio concluído com ${errors.length} erros. ${filesUploaded} fotos enviadas.`, true);
            } else {
                showMessage(uploadMessage, `Sucesso! Todas as ${totalFiles} fotos foram enviadas.`);
            }
        }

        // 5. Limpa e recarrega
        uploadForm.reset(); 
        selectedFiles = [];
        fileNameSpan.textContent = 'Nenhum arquivo selecionado';
        await refreshGallery(); 
    });

    // --- MUDANÇA: Listener do botão "Cancelar" ---
    cancelUploadButton.addEventListener('click', () => {
        if (isUploading) {
            showMessage(uploadMessage, 'Cancelando... Aguarde o término do arquivo atual.', true);
            cancelUpload = true; // Define o sinalizador
        }
    });

    // --- Listener de Logout (Não muda) ---
    logoutButton.addEventListener('click', service.handleLogout);

    // --- Listeners do Grid (Não muda) ---
    galleryGrid.addEventListener('click', async (event) => {
        const target = event.target;
        const filename = target.dataset.filename;

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

    // --- Listeners do Lightbox (Não muda) ---
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxModal.addEventListener('click', (e) => { if (e.target === lightboxModal) closeLightbox(); });
    lightboxNext.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex + 1));
    lightboxPrev.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex - 1));
    document.addEventListener('keydown', (e) => {
        if (lightboxModal.style.display === 'flex') {
            if (e.key === 'ArrowRight') showPhotoAtIndex(currentPhotoIndex + 1);
            if (e.key === 'ArrowLeft') showPhotoAtIndex(currentPhotoIndex - 1);
            if (e.key === 'Escape') closeLightbox();
        }
    });
    lightboxModal.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
    lightboxModal.addEventListener('touchmove', (e) => { touchMoveX = e.touches[0].clientX; });
    lightboxModal.addEventListener('touchend', () => {
        if (touchMoveX === 0) return;
        const deltaX = touchMoveX - touchStartX;
        if (deltaX > 50) showPhotoAtIndex(currentPhotoIndex - 1);
        else if (deltaX < -50) showPhotoAtIndex(currentPhotoIndex + 1);
        touchStartX = 0;
        touchMoveX = 0;
    });
}
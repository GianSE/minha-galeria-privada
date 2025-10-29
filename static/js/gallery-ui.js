// Este arquivo lida com TODA a manipulação do DOM (Interface)
import { formatBytes } from './supabase-config.js';
import * as service from './gallery-service.js';

// --- MUDANÇA: Variáveis movidas para dentro de setupUIListeners ---
// As variáveis globais do DOM agora são definidas dentro da inicialização.
let galleryGrid, uploadForm, logoutButton, fileInput, dropZone;
let fileNameSpan, uploadMessage, storageInfo;
let lightboxModal, lightboxImg, lightboxClose, lightboxPrev, lightboxNext;

let selectedFile = null; // Arquivo selecionado
let currentPhotoList = []; // Lista de fotos para o lightbox
let currentPhotoIndex = 0; // Índice atual do lightbox
let touchStartX = 0, touchMoveX = 0; // Para swipe

// --- 1. RENDERIZAÇÃO ---

function showMessage(element, text, isError = false) {
    if (!element) return; // Checagem de segurança
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

// --- 2. LÓGICA DE CARREGAMENTO INICIAL ---

export async function refreshGallery() {
    if (!galleryGrid || !storageInfo) return; // Checagem

    galleryGrid.innerHTML = '<p>Carregando fotos...</p>';
    storageInfo.textContent = 'Calculando espaço usado...';

    const { photoData, totalSize, error } = await service.loadPhotos();

    if (error) {
        galleryGrid.innerHTML = `<p class="message message-error">Erro ao carregar fotos: ${error}</p>`;
        return;
    }
    
    currentPhotoList = []; // Limpa a lista de fotos

    if (photoData.length === 0) {
        galleryGrid.innerHTML = '<p>Sua galeria está vazia.</p>';
        storageInfo.textContent = 'Total usado: 0 Bytes de 1 GB (0.00%)';
        return;
    }

    galleryGrid.innerHTML = ''; // Limpa
    photoData.forEach((file, index) => {
        if (file.signedUrl) {
            currentPhotoList.push(file.signedUrl); // Adiciona a URL na nossa lista
            renderPhoto(file, index); // Passa o índice para o render
        }
    });

    const totalGBemBytes = 1073741824; // 1 GB
    const percentage = (totalSize / totalGBemBytes) * 100;
    storageInfo.textContent = `Total usado: ${formatBytes(totalSize)} de 1 GB (${percentage.toFixed(2)}%)`;
}

// --- Funções de Navegação do Lightbox ---
function showPhotoAtIndex(index) {
    if (index < 0 || index >= currentPhotoList.length) {
        return;
    }
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

// --- 3. CONFIGURAÇÃO DOS "ESCUTADORES" (LISTENERS) ---

export function setupUIListeners() {
    // --- MUDANÇA: Definição das variáveis do DOM movida para cá ---
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
    // --- FIM DA MUDANÇA ---

    // Checagem de segurança (se os elementos não existirem, não adiciona listeners)
    if (!uploadForm || !galleryGrid || !logoutButton || !lightboxModal) {
        console.error("DEBUG: Elementos essenciais da UI não encontrados. Verifique seu HTML.");
        return;
    }

    // --- Upload (Drag-and-Drop) ---
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

    // --- Envio do Formulário (Submit) ---
    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            showMessage(uploadMessage, 'Por favor, selecione um arquivo.', true);
            return;
        }
        
        showMessage(uploadMessage, 'Enviando foto...');
        const { error } = await service.uploadPhoto(selectedFile);

        if (error) {
            showMessage(uploadMessage, `Erro no upload: ${error.message}`, true);
        } else {
            showMessage(uploadMessage, 'Foto enviada com sucesso!');
            uploadForm.reset(); 
            selectedFile = null;
            fileNameSpan.textContent = 'Nenhum arquivo selecionado';
            await refreshGallery(); // Recarrega a galeria
        }
    });

    // --- Logout ---
    logoutButton.addEventListener('click', service.handleLogout);

    // --- Grid (Deletar, Renomear e Abrir Lightbox) ---
    galleryGrid.addEventListener('click', async (event) => {
        const target = event.target;
        
        if (target.classList.contains('delete-button')) {
            const filename = target.dataset.filename;
            if (!confirm(`Tem certeza que quer deletar a foto "${filename}"?`)) return;
            const { error } = await service.deletePhoto(filename);
            if (error) alert(`Falha ao deletar: ${error.message}`);
            else await refreshGallery();
        }
        
        if (target.classList.contains('rename-button')) {
            const filename = target.dataset.filename;
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

    // --- Escutadores do Lightbox ---
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) closeLightbox();
    });
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
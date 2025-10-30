// Este arquivo lida com TODA a manipulação do DOM (Interface)
import { formatBytes } from './supabase-config.js';
import *as service from './gallery-service.js';

// --- Variáveis do DOM (Desktop) ---
let galleryGrid, uploadForm, logoutButton, fileInput, dropZone;
let fileNameSpan, uploadMessage, storageInfo;
let lightboxModal, lightboxImg, lightboxClose, lightboxPrev, lightboxNext;
let submitUploadButton, cancelUploadButton; 
let navLinkView, navLinkUpload, pageView, pageUpload;
let sidebar, sidebarToggle;

// --- Novas variáveis para o Menu Móvel ---
let mobileMenuButton, mobileNavModal, mobileModalClose;
let mobileNavLinkView, mobileNavLinkUpload;

// --- Variáveis de Estado da UI ---
let selectedFiles = []; 
let currentPhotoList = []; 
let currentPhotoIndex = 0; 
let touchStartX = 0, touchMoveX = 0;
let isUploading = false;
let cancelUpload = false;

// --- Função para trocar de "página" ---
function showPage(pageIdToShow) {
    // 1. Esconde todas as páginas
    [pageView, pageUpload].forEach(page => {
        if(page) page.classList.remove('active');
    });
    // 2. Remove 'active' de todos os links (Desktop)
    [navLinkView, navLinkUpload].forEach(link => {
        if(link) link.classList.remove('active');
    });

    // 3. Mostra a página e ativa o link correto
    if (pageIdToShow === 'view') {
        if(pageView) pageView.classList.add('active');
        if(navLinkView) navLinkView.classList.add('active');
    } else if (pageIdToShow === 'upload') {
        if(pageUpload) pageUpload.classList.add('active');
        if(navLinkUpload) navLinkUpload.classList.add('active');
    }
}

// --- MUDANÇA: FUNÇÕES DO MODAL MÓVEL (As que estavam faltando) ---
function openMobileModal() {
    if (mobileNavModal) {
        mobileNavModal.classList.add('modal-open');
    }
}
function closeMobileModal() {
    if (mobileNavModal) {
        mobileNavModal.classList.remove('modal-open');
    }
}
// --- FIM DA MUDANÇA ---


// --- 1. FUNÇÕES DE RENDERIZAÇÃO E UI ---
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
            <button class="download-button" data-filename="${file.name}" data-url="${file.signedUrl}">Download</button>
            <button class="rename-button" data-filename="${file.name}">Renomear</button>
            <button class="delete-button" data-filename="${file.name}">Deletar</button>
        </div>
    `;
    // Verificação de segurança
    if (galleryGrid) {
        galleryGrid.appendChild(item);
    }
}

// --- 2. FUNÇÕES DO LIGHTBOX ---
function showPhotoAtIndex(index) { 
    if (index < 0 || index >= currentPhotoList.length) return;
    currentPhotoIndex = index;
    if(lightboxImg) lightboxImg.src = currentPhotoList[index];
    if(lightboxPrev) lightboxPrev.style.display = (index === 0) ? 'none' : 'block';
    if(lightboxNext) lightboxNext.style.display = (index === currentPhotoList.length - 1) ? 'none' : 'block';
}
function openLightbox(index) { 
    if(lightboxModal) lightboxModal.style.display = "flex";
    showPhotoAtIndex(index);
}
function closeLightbox() { 
    if(lightboxModal) lightboxModal.style.display = "none";
}

// --- 3. FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO DA UI ---
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
    const totalGBemBytes = 1073741824; 
    const percentage = (totalSize / totalGBemBytes) * 100;
    storageInfo.textContent = `Total usado: ${formatBytes(totalSize)} de 1 GB (${percentage.toFixed(2)}%)`;
}

// --- 4. FUNÇÃO DE CONFIGURAÇÃO DOS EVENTOS ---

export function setupUIListeners() {
    // --- Pega elementos do Desktop ---
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
    navLinkView = document.getElementById('nav-link-view');
    navLinkUpload = document.getElementById('nav-link-upload');
    pageView = document.getElementById('page-view');
    pageUpload = document.getElementById('page-upload');
    sidebar = document.getElementById('sidebar');
    sidebarToggle = document.getElementById('sidebar-toggle');

    // --- Pega os novos elementos do Móvel ---
    mobileMenuButton = document.getElementById('mobile-menu-button');
    mobileNavModal = document.getElementById('mobile-nav-modal');
    mobileModalClose = document.getElementById('mobile-modal-close');
    mobileNavLinkView = document.getElementById('mobile-nav-link-view');
    mobileNavLinkUpload = document.getElementById('mobile-nav-link-upload');


    // --- Listeners do Desktop (Sidebar) ---
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            sidebar.classList.toggle('expanded');
        });
    }
    if (navLinkView) {
        navLinkView.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('view');
        });
    }
    if (navLinkUpload) {
        navLinkUpload.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('upload');
        });
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', service.handleLogout);
    }

    // --- Listeners do Menu Móvel ---
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', openMobileModal);
    }
    if (mobileModalClose) {
        mobileModalClose.addEventListener('click', closeMobileModal);
    }
    if (mobileNavModal) {
        // Fecha se clicar fora da caixa (no overlay)
        mobileNavModal.addEventListener('click', (e) => {
            if (e.target === mobileNavModal) {
                closeMobileModal();
            }
        });
    }
    if (mobileNavLinkView) {
        mobileNavLinkView.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('view');
            closeMobileModal(); // Fecha o modal após clicar
        });
    }
    if (mobileNavLinkUpload) {
        mobileNavLinkUpload.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('upload');
            closeMobileModal(); // Fecha o modal após clicar
        });
    }


    // --- (Função "clearSelection") ---
    function clearSelection() {
        if (fileInput) fileInput.value = null;
        if (fileNameSpan) fileNameSpan.textContent = 'Nenhum arquivo selecionado';
        if (cancelUploadButton) cancelUploadButton.style.display = 'none';
        if (submitUploadButton) submitUploadButton.style.display = 'block';
        if (uploadMessage) showMessage(uploadMessage, '');
    }

    // --- (Função "handleFileSelection") ---
    function handleFileSelection(files) {
        if (files.length > 0) {
            selectedFiles = Array.from(files);
            if (fileNameSpan) fileNameSpan.textContent = `${selectedFiles.length} fotos selecionadas`;
            if (cancelUploadButton) {
                cancelUploadButton.textContent = 'Limpar Seleção';
                cancelUploadButton.style.display = 'block';
            }
        }
    }
    
    // --- Listeners do Upload (com verificações) ---
    if (dropZone) {
        dropZone.addEventListener('click', () => { if(fileInput) fileInput.click(); });
        if (fileInput) fileInput.addEventListener('change', () => handleFileSelection(fileInput.files));
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drop-zone--over'); });
        ['dragleave', 'dragend'].forEach(type => {
            dropZone.addEventListener(type, () => dropZone.classList.remove('drop-zone--over'));
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drop-zone--over');
            if (fileInput) fileInput.files = e.dataTransfer.files;
            handleFileSelection(e.dataTransfer.files);
        });
    }
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (selectedFiles.length === 0) {
                if(uploadMessage) showMessage(uploadMessage, 'Por favor, selecione um ou mais arquivos.', true);
                return;
            }
            if (isUploading) return; 

            isUploading = true;
            cancelUpload = false;
            if(cancelUploadButton) cancelUploadButton.textContent = 'Cancelar Envio';
            if(submitUploadButton) submitUploadButton.style.display = 'none';

            const totalFiles = selectedFiles.length;
            let filesUploaded = 0;
            let errors = [];

            for (const file of selectedFiles) {
                if (cancelUpload) {
                    if(uploadMessage) showMessage(uploadMessage, 'Envio cancelado pelo usuário.', true);
                    break;
                }
                if(uploadMessage) showMessage(uploadMessage, `Enviando ${filesUploaded + 1} de ${totalFiles}: ${file.name}...`);
                const { error } = await service.uploadPhoto(file);
                if (error) {
                    errors.push(file.name);
                } else {
                    filesUploaded++;
                }
            }

            isUploading = false;
            if(submitUploadButton) submitUploadButton.style.display = 'block';

            if (!cancelUpload) {
                if (errors.length > 0) {
                    if(uploadMessage) showMessage(uploadMessage, `Envio concluído com ${errors.length} erros. ${filesUploaded} fotos enviadas.`, true);
                } else {
                    if(uploadMessage) showMessage(uploadMessage, `Sucesso! Todas as ${totalFiles} fotos foram enviadas.`);
                }
            }
            clearSelection();
            await refreshGallery(); 
            showPage('view'); // Volta para a galeria
        });
    }
    
    if (cancelUploadButton) {
        cancelUploadButton.addEventListener('click', () => {
            if (isUploading) {
                if(uploadMessage) showMessage(uploadMessage, 'Cancelando... Aguarde o término do arquivo atual.', true);
                cancelUpload = true;
            } else {
                clearSelection();
                if(uploadMessage) showMessage(uploadMessage, 'Seleção limpa.', false);
            }
        });
    }
    
    // --- Listeners do Grid (com verificações) ---
    if (galleryGrid) {
        galleryGrid.addEventListener('click', async (event) => { 
            const target = event.target;
            const filename = target.dataset.filename;

            if (target.classList.contains('download-button')) {
                const url = target.dataset.url;
                target.textContent = 'Baixando...';
                target.disabled = true;
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Falha no download: ${response.statusText}`);
                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = objectUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(objectUrl);
                } catch (err) {
                    console.error('Erro ao baixar foto:', err);
                    alert(`Não foi possível baixar a foto. (${err.message})`);
                } finally {
                    target.textContent = 'Download';
                    target.disabled = false;
                }
            }

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
    }
    

    // --- Listeners do Lightbox (com verificações) ---
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => { if (e.target === lightboxModal) closeLightbox(); });
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
    if (lightboxNext) {
        lightboxNext.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex + 1));
    }
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex - 1));
    }
    document.addEventListener('keydown', (e) => {
        if (lightboxModal && lightboxModal.style.display === 'flex') {
            if (e.key === 'ArrowRight') showPhotoAtIndex(currentPhotoIndex + 1);
            if (e.key === 'ArrowLeft') showPhotoAtIndex(currentPhotoIndex - 1);
            if (e.key === 'Escape') closeLightbox();
        }
    });


    // Mostra a página inicial
    showPage('view'); 
}
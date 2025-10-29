// Este arquivo lida com TODA a manipulação do DOM (Interface)
import { formatBytes } from './supabase-config.js';
import * as service from './gallery-service.js';

// --- Variáveis Globais (DOM) ---
const galleryGrid = document.getElementById('gallery-grid');
const uploadForm = document.getElementById('upload-form');
const logoutButton = document.getElementById('logout-button');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const fileNameSpan = document.getElementById('file-name');
const uploadMessage = document.getElementById('upload-message');
const storageInfo = document.getElementById('storage-info');

// --- NOVAS VARIÁVEIS (Fase 6.1 - Lightbox) ---
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

// --- 1. RENDERIZAÇÃO ---

function showMessage(element, text, isError = false) {
    element.textContent = text;
    element.className = isError ? 'message message-error' : 'message message-success';
}

function renderPhoto(file) {
    const fileSize = file.metadata ? formatBytes(file.metadata.size) : 'Tamanho desconhecido';
    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    // A tag <img> agora tem 'data-src' para o lightbox
    item.innerHTML = `
        <img src="${file.signedUrl}" alt="${file.name}" data-src="${file.signedUrl}">
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

// --- 2. LÓGICA DE CARREGAMENTO INICIAL (Atualizada) ---

export async function refreshGallery() {
    galleryGrid.innerHTML = '<p>Carregando fotos...</p>';
    storageInfo.textContent = 'Calculando espaço usado...';

    const { photoData, totalSize, error } = await service.loadPhotos();

    if (error) {
        galleryGrid.innerHTML = `<p class="message message-error">Erro ao carregar fotos: ${error}</p>`;
        return;
    }

    if (photoData.length === 0) {
        galleryGrid.innerHTML = '<p>Sua galeria está vazia.</p>';
        storageInfo.textContent = 'Total usado: 0 Bytes de 1 GB (0.00%)';
        return;
    }

    galleryGrid.innerHTML = ''; // Limpa
    photoData.forEach(file => {
        if (file.signedUrl) {
            renderPhoto(file);
        }
    });

    // --- MUDANÇA AQUI (Fase 6.1 - Porcentagem) ---
    const totalGBemBytes = 1073741824; // 1 GB
    const percentage = (totalSize / totalGBemBytes) * 100;
    storageInfo.textContent = `Total usado: ${formatBytes(totalSize)} de 1 GB (${percentage.toFixed(2)}%)`;
}

// --- 3. CONFIGURAÇÃO DOS "ESCUTADORES" (LISTENERS) (Atualizada) ---

export function setupUIListeners() {
    // --- Upload (Drag-and-Drop) ---
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            selectedFile = fileInput.files[0];
            fileNameSpan.textContent = selectedFile.name;
        }
    });
    // ... (O resto do código do drag-and-drop continua igual) ...
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

    // --- Grid (Deletar, Renomear e NOVO Lightbox) ---
    galleryGrid.addEventListener('click', async (event) => {
        const target = event.target;
        const filename = target.dataset.filename;

        // Ação de Deletar
        if (target.classList.contains('delete-button')) {
            if (!confirm(`Tem certeza que quer deletar a foto "${filename}"?`)) {
                return;
            }
            const { error } = await service.deletePhoto(filename);
            if (error) alert(`Falha ao deletar: ${error.message}`);
            else await refreshGallery();
        }
        
        // Ação de Renomear
        if (target.classList.contains('rename-button')) {
            const extension = filename.substring(filename.lastIndexOf('.'));
            const oldNameOnly = filename.substring(0, filename.lastIndexOf('.'));
            const newNameOnly = prompt("Digite o novo nome para a foto (sem a extensão):", oldNameOnly);

            if (!newNameOnly || newNameOnly === oldNameOnly) {
                return; // Cancela
            }
            
            const newFilename = `${newNameOnly}${extension}`;
            const { error } = await service.renamePhoto(filename, newFilename);
            if (error) alert(`Falha ao renomear: ${error.message}`);
            else await refreshGallery();
        }

        // --- MUDANÇA AQUI (Fase 6.1 - Abrir Lightbox) ---
        // Se o clique foi em uma IMAGEM (tag IMG)
        if (target.tagName === 'IMG') {
            lightboxModal.style.display = "flex"; // Mostra o modal
            lightboxImg.src = target.src; // Coloca a imagem clicada no modal
        }
    });

    // --- MUDANÇA AQUI (Fase 6.1 - Fechar Lightbox) ---
    
    // Fecha ao clicar no "X"
    lightboxClose.addEventListener('click', () => {
        lightboxModal.style.display = "none";
    });
    
    // Fecha ao clicar no fundo (fora da imagem)
    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) { // Se o clique foi no fundo
            lightboxModal.style.display = "none";
        }
    });
}
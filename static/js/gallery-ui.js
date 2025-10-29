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

let selectedFile = null;

// --- 1. RENDERIZAÇÃO ---

function showMessage(element, text, isError = false) {
    element.textContent = text;
    element.className = isError ? 'message message-error' : 'message message-success';
}

function renderPhoto(file) {
    const fileSize = file.metadata ? formatBytes(file.metadata.size) : 'Tamanho desconhecido';
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
        <img src="${file.signedUrl}" alt="${file.name}">
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
    galleryGrid.innerHTML = '<p>Carregando fotos...</p>';
    storageInfo.textContent = 'Calculando espaço usado...';

    const { photoData, totalSize, error } = await service.loadPhotos();

    if (error) {
        galleryGrid.innerHTML = `<p class="message message-error">Erro ao carregar fotos: ${error}</p>`;
        return;
    }

    if (photoData.length === 0) {
        galleryGrid.innerHTML = '<p>Sua galeria está vazia.</p>';
        storageInfo.textContent = 'Total usado: 0 Bytes de 1 GB';
        return;
    }

    galleryGrid.innerHTML = ''; // Limpa
    photoData.forEach(file => {
        if (file.signedUrl) {
            renderPhoto(file);
        }
    });

    storageInfo.textContent = `Total usado: ${formatBytes(totalSize)} de 1 GB`;
}

// --- 3. CONFIGURAÇÃO DOS "ESCUTADORES" (LISTENERS) ---

export function setupUIListeners() {
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

    // --- Grid (Deletar e Renomear) ---
    galleryGrid.addEventListener('click', async (event) => {
        const target = event.target;
        const filename = target.dataset.filename;

        if (target.classList.contains('delete-button')) {
            if (!confirm(`Tem certeza que quer deletar a foto "${filename}"?`)) {
                return;
            }
            const { error } = await service.deletePhoto(filename);
            if (error) alert(`Falha ao deletar: ${error.message}`);
            else await refreshGallery();
        }
        
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
    });
}
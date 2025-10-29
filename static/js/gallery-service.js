// Este arquivo lida com TODA a comunicação com o Supabase
import { supabaseClient } from './supabase-config.js';

let currentUser = null;
// --- MUDANÇA AQUI: Definimos um nome de pasta compartilhada ---
const SHARED_FOLDER = 'shared';
// --- FIM DA MUDANÇA ---

// --- 1. AUTENTICAÇÃO ---

export async function checkUserSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session) {
        console.log("DEBUG: Nenhum usuário logado. Redirecionando para login.");
        window.location.href = '../index.html'; // Redireciona se não estiver logado
        return null;
    }
    console.log("DEBUG: Usuário logado!", data.session.user.email);
    currentUser = data.session.user; // Guarda o usuário
    return currentUser;
}

export async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = '../index.html'; 
}

// --- 2. STORAGE (FOTOS) ---

export async function loadPhotos() {
    if (!currentUser) return { photoData: [], totalSize: 0, error: 'Usuário não logado' };

    // --- MUDANÇA AQUI: Usa SHARED_FOLDER ao invés de currentUser.id ---
    const { data: files, error } = await supabaseClient.storage
        .from('fotos') 
        .list(SHARED_FOLDER, { // <- MUDOU AQUI
            limit: 100, offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
        });

    if (error) {
        console.error('DEBUG: Erro ao listar arquivos:', error.message);
        return { photoData: [], totalSize: 0, error: error.message };
    }

    if (!files || files.length === 0) {
        console.log("DEBUG: Nenhuma foto encontrada na pasta 'shared'.");
        return { photoData: [], totalSize: 0, error: null };
    }

    let totalSize = 0;
    const paths = [];
    for (const file of files) {
        if (file.metadata && file.metadata.size) {
            totalSize += file.metadata.size;
        }
        // --- MUDANÇA AQUI: Usa SHARED_FOLDER ao invés de currentUser.id ---
        paths.push(`${SHARED_FOLDER}/${file.name}`); // <- MUDOU AQUI
    }

    const { data: urlsData, error: urlsError } = await supabaseClient.storage
        .from('fotos')
        .createSignedUrls(paths, 3600); 

    if (urlsError) {
        console.error('DEBUG: Erro ao criar URLs:', urlsError.message);
        return { photoData: [], totalSize: 0, error: urlsError.message };
    }

    const photoData = files.map(file => {
        const urlEntry = urlsData.find(entry => entry.path.endsWith(file.name));
        return {
            ...file,
            signedUrl: urlEntry ? urlEntry.signedUrl : null
        };
    });

    return { photoData, totalSize, error: null };
}

export async function deletePhoto(filename) {
    if (!currentUser || !filename) {
        return { error: { message: "Usuário ou nome de arquivo inválido" } };
    }
    // --- MUDANÇA AQUI: Usa SHARED_FOLDER ao invés de currentUser.id ---
    const { error } = await supabaseClient.storage
        .from('fotos')
        .remove([`${SHARED_FOLDER}/${filename}`]); // <- MUDOU AQUI
    return { error };
}

export async function renamePhoto(oldFilename, newFilename) {
    if (!currentUser) {
        return { error: { message: "Usuário não logado" } };
    }
    // --- MUDANÇA AQUI: Usa SHARED_FOLDER ao invés de currentUser.id ---
    const oldPath = `${SHARED_FOLDER}/${oldFilename}`; // <- MUDOU AQUI
    const newPath = `${SHARED_FOLDER}/${newFilename}`; // <- MUDOU AQUI
    
    const { error } = await supabaseClient.storage
        .from('fotos')
        .move(oldPath, newPath);
    return { error };
}

export async function uploadPhoto(file) {
    if (!currentUser) {
        console.error("DEBUG: uploadPhoto falhou, currentUser é nulo.");
        return { error: { message: "Usuário não está logado." } };
    }
    if (!file) {
        return { error: { message: "Nenhum arquivo selecionado" } };
    }
    
    // --- MUDANÇA AQUI: Usa SHARED_FOLDER ao invés de currentUser.id ---
    const filePath = `${SHARED_FOLDER}/${file.name}`; // <- MUDOU AQUI
    console.log(`DEBUG: Enviando para ${filePath}...`);
    const { error } = await supabaseClient.storage
      .from('fotos')
      .upload(filePath, file, { 
          cacheControl: '3600', 
          upsert: false
        });
    return { error };
}
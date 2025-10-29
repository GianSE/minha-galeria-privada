// Este arquivo lida com TODA a comunicação com o Supabase
import { supabaseClient } from './supabase-config.js';

let currentUser = null;

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
    if (!currentUser) return { files: [], totalSize: 0, error: 'Usuário não logado' };

    const { data: files, error } = await supabaseClient.storage
        .from('fotos') 
        .list(currentUser.id, { 
            limit: 100, offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
        });

    if (error) {
        console.error('DEBUG: Erro ao listar arquivos:', error.message);
        return { files: [], totalSize: 0, error: error.message };
    }

    let totalSize = 0;
    for (const file of files) {
        if (file.metadata && file.metadata.size) {
            totalSize += file.metadata.size;
        }
    }

    // Pega as URLs assinadas para todos os arquivos de uma vez
    const paths = files.map(file => `${currentUser.id}/${file.name}`);
    const { data: urlsData, error: urlsError } = await supabaseClient.storage
        .from('fotos')
        .createSignedUrls(paths, 3600); // 1 hora de validade

    if (urlsError) {
        console.error('DEBUG: Erro ao criar URLs:', urlsError.message);
        return { files: [], totalSize: 0, error: urlsError.message };
    }

    // Combina os dados do arquivo com sua URL assinada
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
    if (!currentUser || !filename) return;
    const { error } = await supabaseClient.storage
        .from('fotos')
        .remove([`${currentUser.id}/${filename}`]); 
    return { error };
}

export async function renamePhoto(oldFilename, newFilename) {
    if (!currentUser) return;
    const oldPath = `${currentUser.id}/${oldFilename}`;
    const newPath = `${currentUser.id}/${newFilename}`;
    
    const { error } = await supabaseClient.storage
        .from('fotos')
        .move(oldPath, newPath);
    return { error };
}

export async function uploadPhoto(file) {
    if (!currentUser || !file) return;
    
    const filePath = `${currentUser.id}/${file.name}`;
    const { error } = await supabaseClient.storage
      .from('fotos')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    return { error };
}
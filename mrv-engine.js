let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, DOCUMENTOS: 15, 
    DICA: 16, DESC_LONGA: 17, BK_CLI: 24
};

async function iniciarApp() {
    try {
        if (typeof MAPA_GSP !== 'undefined') desenharMapas();
        await carregarPlanilha();
    } catch (err) { console.error("Erro na inicialização:", err); }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    
    try {
        const response = await fetch(URL_CSV);
        let texto = await response.text();
        if (!texto.endsWith('\n')) texto += '\n';

        const linhas = [];
        let linhaAtual = "", dentroDeAspas = false;
        for (let i = 0; i < texto.length; i++) {
            const char = texto[i];
            if (char === '"') dentroDeAspas = !dentroDeAspas;
            if ((char === '\n' || char === '\r') && !dentroDeAspas) {
                if (linhaAtual.trim()) linhas.push(linhaAtual);
                linhaAtual = "";
            } else { linhaAtual += char; }
        }

        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const colunas = [];
            let campo = "", aspas = false;
            for (let i = 0; i < linha.length; i++) {
                const char = linha[i];
                if (char === '"') aspas = !aspas;
                else if (char === ',' && !aspas) { colunas.push(campo.trim()); campo = ""; }
                else { campo += char; }
            }
            colunas.push(campo.trim());
            const catLimpa = colunas[COL.CATEGORIA] ? colunas[COL.CATEGORIA].toUpperCase() : "";
            return {
                id_path: colunas[COL.ID] ? colunas[COL.ID].toLowerCase().replace(/\s/g, '') : "",
                tipo: catLimpa.includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
                nome: colunas[COL.NOME] || "",
                nomeFull: colunas[COL.NOME_FULL] || colunas[COL.NOME] || "",
                cidade: colunas[COL.ID] || "",
                estoque: colunas[COL.ESTOQUE] || "",
                endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "",
                preco: colunas[COL.P_DE] || "Consulte",
                p_de: colunas[COL.P_DE] || "-",
                obra: colunas[COL.OBRA] || "0",
                documentos: colunas[COL.DOCUMENTOS] || "",
                dica: colunas[COL.DICA] || "",
                descLonga: colunas[COL.DESC_LONGA] || "",
                book: colunas[COL.BK_CLI] || ""
            };
        }).filter(i => i.nome && i.nome.length > 2);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro CSV:", e); }
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const estaNaGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idBusca);
    const estaNoInterior = MAPA_INTERIOR.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idBusca);

    if (estaNaGSP && mapaAtivo !== 'GSP') { trocarMapas(); }
    else if (estaNoInterior && mapaAtivo !== 'INTERIOR') { trocarMapas(); }

    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];
        nomeSelecionado = nomePath || selecionado.cidade;
        const tit = document.getElementById('cidade-titulo');
        if(tit) tit.innerText = nomeSelecionado;
        
        if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
        const el = document.getElementById(`caixa-a-${idBusca}`);
        if (el) { el.classList.add('path-ativo'); pathSelecionado = el; }
        
        document.querySelectorAll('.btRes, .separador-complexo-btn').forEach(btn => btn.classList.remove('ativo'));
        const idBotao = `btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const btnClicado = document.getElementById(idBotao);
        if (btnClicado) btnClicado.classList.add('ativo');
        
        montarVitrine(selecionado, imoveis, nomeSelecionado);
    }
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if(!painel) return;
    
    // REGRA: Complexos (tipo 'N') sobem para o topo da lista de botões
    const listaOrdenada = [...listaDaCidade].sort((a, b) => (a.tipo === 'N' ? -1 : 1));
    const listaSuperior = listaOrdenada.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div>`;
    
    // Lista de botões acima
    html += `<div style="margin-bottom:10px;">${listaSuperior.map(item => {
                const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
                return `<button class="${classe}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong> ${item.tipo === 'R' ? obterHtmlEstoque(item.estoque, item.tipo) : ''}</button>`;
            }).join('')}</div>`;

    html += `<hr style="border:0; border-top:1px solid #ddd; margin:15px 0 20px 0;">`;

    if (selecionado.tipo === 'R') {
        // --- FAIXA LARANJA COM ESTILO REFORÇADO ---
        html += `<div style="width:100%; margin:0; border-radius:4px; height:36px; background-color: #ff8c00; color: #333; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; border: none;">RES. ${selecionado.nome}</div>`;
        
        // Endereço e Botão MAPS
        html += `<div style="padding: 10px 0;">
                    <p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;">
                        <span>📍 ${selecionado.endereco}</span>
                        <a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a>
                    </p>
                 </div>`;
    } else {
        // --- LAYOUT COMPLEXO SELECIONADO ---
        html += `<div class="separador-complexo-btn" style="width:100% !important; margin:0 !important; border-radius:4px 4px 0 0; cursor:default; height:36px !important; pointer-events:none;">${selecionado.nomeFull}</div>`;
        html += `<div style="padding: 10px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        const desc = (selecionado.descLonga || "").split('\n').map(p => `<p style="margin-bottom:8px;">${p.trim()}</p>`).join('');
        html += `<div class="box-argumento" style="border-left-color: #00713a; background:#f9f9f9; margin-top:0; border-radius:0 0 4px 4px;"><label>Sobre o Complexo</label>${desc}</div>`;
    }
    
    painel.innerHTML = html;
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;
    if (!interativo) { container.style.cursor = "pointer"; container.onclick = trocarMapas; } else { container.onclick = null; }
    const pathsHtml = dados.paths.map(p => {
        const idPathNormalizado = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPathNormalizado);
        const isGSP = p.id.toLowerCase() === "grandesaopaulo";
        const clique = interativo ? (isGSP ? `onclick="trocarMapas()"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        const hover = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        const classe = (temMRV || isGSP) && interativo ? 'commrv' : '';
        return `<path id="${id}-${p.id}" name="${p.name}" d="${p.d}" class="${classe}" ${clique} ${hover}></path>`;
    }).join('');
    const zoomStyle = interativo ? 'style="transform: scale(1.15); transform-origin: center; width: 100%; height: 100%;"' : 'style="width: 100%; height: 100%;"';
    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet" ${zoomStyle}><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
}

function navegarVitrine(nome, nomeRegiao) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome); 
    if (imovel) comandoSelecao(imovel.id_path, nomeRegiao, imovel); 
}

function cliqueNoMapa(id, nome, temMRV) { if (temMRV) comandoSelecao(id, nome); }
function hoverNoMapa(nome) { const t = document.getElementById('cidade-titulo'); if(t) t.innerText = nome; }
function resetTitulo() { const t = document.getElementById('cidade-titulo'); if(t) t.innerText = nomeSelecionado || "Selecione uma região"; }
function trocarMapas() { mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; desenharMapas(); limparInterface(); }

function limparInterface() {
    nomeSelecionado = ""; pathSelecionado = null;
    const t = document.getElementById('cidade-titulo'); if(t) t.innerText = "Selecione uma região";
    const f = document.getElementById('ficha-tecnica');
    if(f) f.innerHTML = `<div style="text-align:center; color:#ccc; margin-top:100px;"><p style="font-size: 30px;">📍</p><p>Clique em algum Residencial ou em alguma região verde do mapa</p></div>`;
    document.querySelectorAll('.btRes, .separador-complexo-btn').forEach(btn => btn.classList.remove('ativo'));
}

function obterHtmlEstoque(valor, tipo) { 
    if (tipo === 'N') return ""; 
    const clean = valor ? valor.toString().toUpperCase().trim() : ""; 
    if (clean === "VENDIDO" || clean === "0") return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`; 
    return `<span class="badge-estoque">RESTAM ${valor} UN.</span>`; 
}

iniciarApp();

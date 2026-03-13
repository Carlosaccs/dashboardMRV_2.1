let DADOS_PLANILHA = [];
let pathAtivo = null;    
let imovelAtivo = null;  
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, LIMITADOR: 12, 
    REGIAO: 13, CASA_PAULISTA: 14, CAMPANHA: 15, DESC_LONGA: 17
};

async function iniciarApp() {
    try { await carregarPlanilha(); } catch (err) { console.error(err); }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    try {
        const response = await fetch(URL_CSV);
        let texto = await response.text();
        const linhasPuras = texto.split(/\r?\n/);
        DADOS_PLANILHA = linhasPuras.slice(1).map(linha => {
            const colunas = []; let campo = "", aspas = false;
            for (let i = 0; i < linha.length; i++) {
                const char = linha[i];
                if (char === '"') aspas = !aspas;
                else if (char === ',' && !aspas) { colunas.push(campo.trim()); campo = ""; }
                else { campo += char; }
            }
            colunas.push(campo.trim());
            const cat = (colunas[COL.CATEGORIA] || "").toUpperCase();
            if (!colunas[COL.NOME] || isNaN(parseInt(colunas[COL.ORDEM])) || (!cat.includes("RESIDENCIAL") && !cat.includes("COMPLEXO"))) return null;
            return {
                id_path: (colunas[COL.ID] || "").toLowerCase().replace(/\s/g, ''),
                tipo: cat.includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]),
                nome: colunas[COL.NOME],
                nomeFull: colunas[COL.NOME_FULL] || colunas[COL.NOME],
                estoque: colunas[COL.ESTOQUE],
                endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "---",
                obra: colunas[COL.OBRA] || "0",
                regiao: colunas[COL.REGIAO] || "---",
                p_de: colunas[COL.P_DE] || "---",
                p_ate: colunas[COL.P_ATE] || "---",
                limitador: colunas[COL.LIMITADOR] || "---",
                casa_paulista: colunas[COL.CASA_PAULISTA] || "---",
                descLonga: colunas[COL.DESC_LONGA] || ""
            };
        }).filter(i => i !== null);
        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        desenharMapas(); gerarListaLateral();
    } catch (e) { console.error(e); }
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const clean = valor ? valor.toString().toUpperCase().trim() : "";
    if (clean === "VENDIDO" || clean === "0") return `<span style="color:#999; text-decoration:line-through; font-size:9px;">VENDIDO</span>`;
    const num = parseInt(clean);
    if (!isNaN(num)) return `<span style="color:${num < 6 ? '#e31010' : '#666'}; font-size:9px; font-weight:bold;">RESTAM ${num} UN.</span>`;
    return `<span style="color:#666; font-size:9px;">${clean || "CONSULTAR"}</span>`;
}

function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (!imovel) return;
    const mapaAtual = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    if (!mapaAtual.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === imovel.id_path)) trocarMapas(false);
    comandoSelecao(imovel.id_path, null, imovel); 
}

function comandoSelecao(idPath, nomePath, fonte) {
    pathAtivo = idPath.toLowerCase().replace(/\s/g, '');
    const imoveisDaCidade = DADOS_PLANILHA.filter(d => d.id_path === pathAtivo);
    const selecionado = fonte || imoveisDaCidade[0];
    imovelAtivo = selecionado.nome;

    document.querySelectorAll('.ativo').forEach(el => el.classList.remove('ativo'));
    const elMapa = document.getElementById(`caixa-a-${pathAtivo}`);
    if (elMapa) elMapa.classList.add('ativo');
    
    gerarListaLateral();
    const nomeOficial = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths).find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || pathAtivo;
    document.getElementById('cidade-titulo').innerText = nomeOficial.toUpperCase();
    montarVitrine(selecionado, imoveisDaCidade, nomeOficial);
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const ativo = (pathAtivo === idNorm && interativo) ? 'ativo' : '';
        const isGSP = idNorm === "grandesaopaulo";
        const classe = (temMRV || isGSP) && interativo ? `commrv ${ativo}` : '';
        
        // Eventos de clique e hover
        const clique = interativo ? (isGSP ? `onclick="trocarMapas(true)"` : `onclick="comandoSelecao('${p.id}')"`) : "";
        const hover = interativo ? `onmouseover="document.getElementById('cidade-titulo').innerText='${p.name.toUpperCase()}'" onmouseout="resetarTitulo()"` : "";
        
        return `<path id="${id}-${idNorm}" d="${p.d}" class="${classe}" ${clique} ${hover}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function resetarTitulo() {
    const nome = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths).find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name;
    document.getElementById('cidade-titulo').innerText = nome ? nome.toUpperCase() : "SELECIONE UMA REGIÃO NO MAPA";
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
    document.getElementById('caixa-b').onclick = () => trocarMapas(true);
}

function trocarMapas(completo) { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    if (completo) { 
        pathAtivo = null; imovelAtivo = null; 
        document.getElementById('ficha-tecnica').innerHTML = `<div style="text-align:center; color:#ccc; margin-top:80px;"><p style="font-size:30px;">📍</p><p>Clique no mapa ou na lista</p></div>`;
        document.getElementById('cidade-titulo').innerText = "SELECIONE UMA REGIÃO NO MAPA";
    }
    desenharMapas(); gerarListaLateral(); 
}

function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        return `<div class="${item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'} ${ativo}" onclick="navegarVitrine('${item.nome}')">
                    <strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}
                </div>`;
    }).join('');
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    if(outros.length > 0) {
        html += `<div style="margin-bottom:8px;">${outros.map(i => `<button class="btRes" style="width:100%;" onclick="navegarVitrine('${i.nome}')"><strong>${i.nome}</strong> ${obterHtmlEstoque(i.estoque, i.tipo)}</button>`).join('')}</div><hr style="border:0; border-top:1px solid #eee; margin:10px 0;">`;
    }

    if (selecionado.tipo === 'R') {
        html += `<div style="width:100%; height:32px; background:var(--mrv-laranja); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem; border-radius:4px; text-transform:uppercase;">RES. ${selecionado.nome}</div>`;
        html += `<div style="padding: 6px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        
        // Linha 1: Entrega e Obra
        html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">
                    <div class="box-argumento"><label>Entrega</label><strong>${selecionado.entrega}</strong></div>
                    <div class="box-argumento"><label>Obra</label><strong>${selecionado.obra}%</strong></div>
                 </div>`;
        
        // Linha 2: Plantas e Estoque (NOVO CAMPO!)
        html += `<div style="display:grid; grid-template-columns:1.5fr 1fr; gap:4px; margin-top:4px;">
                    <div class="box-argumento"><label>Plantas</label><strong>${selecionado.p_de} - ${selecionado.p_ate}</strong></div>
                    <div class="box-argumento"><label>Estoque</label><strong>${selecionado.estoque} UN.</strong></div>
                 </div>`;
        
        // Linha 3: Limitador e C. Paulista
        html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:4px;">
                    <div class="box-argumento"><label>Limitador</label><strong>${selecionado.limitador}</strong></div>
                    <div class="box-argumento"><label>C. Paulista</label><strong>${selecionado.casa_paulista}</strong></div>
                 </div>`;
    } else {
        html += `<div class="separador-complexo-btn" style="width:100%;">${selecionado.nomeFull}</div>`;
        html += `<div class="box-argumento" style="display:block !important;"><label>Sobre o Complexo</label><p style="margin-top:5px; font-size:0.75rem;">${selecionado.descLonga}</p></div>`;
    }
    painel.innerHTML = html;
}

window.onload = iniciarApp;

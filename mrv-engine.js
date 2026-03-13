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
    try {
        await carregarPlanilha();
    } catch (err) { console.error("Erro ao iniciar:", err); }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    
    try {
        const response = await fetch(URL_CSV);
        let texto = await response.text();
        const linhasPuras = texto.split(/\r?\n/);
        
        DADOS_PLANILHA = linhasPuras.slice(1).map(linha => {
            const colunas = [];
            let campo = "", aspas = false;
            for (let i = 0; i < linha.length; i++) {
                const char = linha[i];
                if (char === '"') aspas = !aspas;
                else if (char === ',' && !aspas) { colunas.push(campo.trim()); campo = ""; }
                else { campo += char; }
            }
            colunas.push(campo.trim());
            
            const categoria = (colunas[COL.CATEGORIA] || "").toUpperCase();
            const nomeValido = colunas[COL.NOME] && colunas[COL.NOME].length > 2;
            const numOrdem = parseInt(colunas[COL.ORDEM]);

            if (!nomeValido || isNaN(numOrdem) || (!categoria.includes("RESIDENCIAL") && !categoria.includes("COMPLEXO"))) {
                return null;
            }

            return {
                id_path: colunas[COL.ID] ? colunas[COL.ID].toLowerCase().replace(/\s/g, '') : "",
                tipo: categoria.includes('COMPLEXO') ? 'N' : 'R',
                ordem: numOrdem,
                nome: colunas[COL.NOME] || "",
                nomeFull: colunas[COL.NOME_FULL] || colunas[COL.NOME] || "",
                cidade: colunas[COL.ID] || "",
                estoque: colunas[COL.ESTOQUE],
                endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "---",
                obra: colunas[COL.OBRA] || "0",
                regiao: colunas[COL.REGIAO] || "---",
                p_de: colunas[COL.P_DE] || "---",
                p_ate: colunas[COL.P_ATE] || "---",
                limitador: colunas[COL.LIMITADOR] || "---",
                casa_paulista: colunas[COL.CASA_PAULISTA] || "---",
                campanha: colunas[COL.CAMPANHA] || "",
                descLonga: colunas[COL.DESC_LONGA] || ""
            };
        }).filter(i => i !== null);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        desenharMapas();
        gerarListaLateral();
    } catch (e) { console.error("Erro CSV:", e); }
}

function buscarNomeNoMapa(idPath) {
    const idNorm = idPath.toLowerCase().replace(/\s/g, '');
    const localGSP = MAPA_GSP.paths.find(p => p.id.toLowerCase().replace(/\s/g, '') === idNorm);
    if (localGSP) return localGSP.name;
    const localINT = MAPA_INTERIOR.paths.find(p => p.id.toLowerCase().replace(/\s/g, '') === idNorm);
    if (localINT) return localINT.name;
    return idPath; 
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const clean = valor ? valor.toString().toUpperCase().trim() : "";
    if (clean === "VENDIDO" || clean === "0") return `<span class="badge-estoque" style="color:#999; text-decoration: line-through; font-size:9px;">VENDIDO</span>`;
    if (clean === "" || clean === "CONSULTAR") return `<span class="badge-estoque" style="color:#666; font-size:9px;">CONSULTAR</span>`;
    const num = parseInt(clean);
    if (!isNaN(num)) {
        const cor = num < 6 ? '#e31010' : '#666';
        return `<span class="badge-estoque" style="color:${cor}; font-size:9px; font-weight:bold;">RESTAM ${num} UN.</span>`;
    }
    return `<span class="badge-estoque" style="color:#666; font-size:9px;">${clean}</span>`;
}

function navegarVitrine(nome, nomeRegiao) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome); 
    if (!imovel) return;
    const idAlvo = imovel.id_path.toLowerCase().replace(/\s/g, '');
    const mapaContexto = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    if (!mapaContexto.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idAlvo)) { trocarMapas(false); }
    comandoSelecao(imovel.id_path, buscarNomeNoMapa(imovel.id_path), imovel); 
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];
        pathAtivo = idBusca; imovelAtivo = selecionado.nome;
        document.querySelectorAll('.ativo').forEach(el => el.classList.remove('ativo'));
        const elMapa = document.getElementById(`caixa-a-${idBusca}`);
        if (elMapa) elMapa.classList.add('ativo');
        const idBtn = `btn-list-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const elLista = document.getElementById(idBtn);
        if (elLista) elLista.classList.add('ativo');
        document.getElementById('cidade-titulo').innerText = buscarNomeNoMapa(idBusca).toUpperCase();
        montarVitrine(selecionado, imoveis, buscarNomeNoMapa(idBusca));
    }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;
    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const ativo = (pathAtivo === idNorm && interativo) ? 'ativo' : '';
        const isGSP = idNorm === "grandesaopaulo";
        const classe = (temMRV || isGSP) && interativo ? `commrv ${ativo}` : '';
        const clique = interativo ? (isGSP ? `onclick="trocarMapas(true)"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        const hover = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        return `<path id="${id}-${idNorm}" name="${p.name}" d="${p.d}" class="${classe}" ${clique} ${hover}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="width:100%; height:100%;"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
}

function hoverNoMapa(nome) { document.getElementById('cidade-titulo').innerText = nome.toUpperCase(); }
function resetTitulo() { 
    const txt = pathAtivo ? buscarNomeNoMapa(pathAtivo) : "SELECIONE UMA REGIÃO NO MAPA";
    document.getElementById('cidade-titulo').innerText = txt.toUpperCase();
}

function trocarMapas(completo = true) { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    if (completo) { pathAtivo = null; imovelAtivo = null; }
    desenharMapas(); gerarListaLateral(); 
}

function cliqueNoMapa(id, nome, temMRV) { if (temMRV) comandoSelecao(id, nome); }

function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    if (!container) return;
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const classeBase = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        const idBtn = `btn-list-${item.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        return `<div id="${idBtn}" class="${classeBase} ${ativo}" onclick="navegarVitrine('${item.nome}', '${item.regiao}')"><strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}</div>`;
    }).join('');
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if(!painel) return;
    const listaSuperior = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if(listaSuperior.length > 0) {
        html += `<div style="margin-bottom:10px;">${listaSuperior.map(item => {
            const btnClass = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
            return `<button class="${btnClass}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}</button>`;
        }).join('')}</div><hr style="border:0; border-top:1px solid #ddd; margin:15px 0;">`;
    }

    if (selecionado.tipo === 'R') {
        html += `<div style="width:100%; border-radius:4px; height:36px; background-color: #ff8c00; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; text-transform: uppercase;">RES. ${selecionado.nome}</div>`;
        html += `<div style="padding: 10px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        
        // Estrutura das Caixas Cinzas
        html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
            <div class="box-argumento"><label>Entrega</label><strong>${selecionado.entrega}</strong></div>
            <div class="box-argumento"><label>Obra</label><strong>${selecionado.obra}%</strong></div>
        </div>`;
        
        // Plantas em linha única (costuma ser texto longo)
        html += `<div class="box-argumento" style="margin-top:5px;"><label>Plantas</label><strong>${selecionado.p_de} - ${selecionado.p_ate}</strong></div>`;
        
        // Nova linha solicitada
        html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top:5px;">
            <div class="box-argumento"><label>Limitador</label><strong>${selecionado.limitador}</strong></div>
            <div class="box-argumento"><label>C. Paulista</label><strong>${selecionado.casa_paulista}</strong></div>
        </div>`;
        
    } else {
        html += `<div class="separador-complexo-btn" style="width:100%; cursor:default;">${selecionado.nomeFull}</div>`;
        html += `<div class="box-argumento"><label>Sobre o Complexo</label><p>${selecionado.descLonga}</p></div>`;
    }
    painel.innerHTML = html;
}

window.onload = iniciarApp;

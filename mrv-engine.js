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
    } catch (err) { console.error("Erro:", err); }
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
            
            if (!colunas[COL.NOME] || colunas[COL.NOME].length < 2) return null;

            return {
                id_path: colunas[COL.ID] ? colunas[COL.ID].toLowerCase().replace(/\s/g, '') : "",
                tipo: (colunas[COL.CATEGORIA] || "").toUpperCase().includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
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

function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    if (!container) return;
    
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const classeBase = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        const idBtn = `btn-list-${item.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const clique = item.tipo === 'N' ? '' : `onclick="navegarVitrine('${item.nome}', '${item.regiao}')"`;
        
        return `<div id="${idBtn}" class="${classeBase} ${ativo}" ${clique}>
                    <strong>${item.nome}</strong>
                    ${obterHtmlEstoque(item.estoque, item.tipo)}
                </div>`;
    }).join('');
}

function navegarVitrine(nome, nomeRegiao) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome); 
    if (!imovel) return;

    const idAlvo = imovel.id_path.toLowerCase().replace(/\s/g, '');
    const mapaContexto = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const existeNoMapaAtual = mapaContexto.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idAlvo);

    if (!existeNoMapaAtual) { 
        trocarMapas(false); // Troca mas sem resetar tudo, pois vamos selecionar logo abaixo
    }
    
    const mapaAtualizado = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const pathInfo = mapaAtualizado.paths.find(p => p.id.toLowerCase().replace(/\s/g, '') === idAlvo);
    
    comandoSelecao(imovel.id_path, pathInfo ? pathInfo.name : nomeRegiao, imovel); 
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    
    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];
        pathAtivo = idBusca;
        imovelAtivo = selecionado.nome;

        document.querySelectorAll('.ativo').forEach(el => el.classList.remove('ativo'));
        
        const elMapa = document.getElementById(`caixa-a-${idBusca}`);
        if (elMapa) elMapa.classList.add('ativo');

        const idBtn = `btn-list-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const elLista = document.getElementById(idBtn);
        if (elLista) elLista.classList.add('ativo');

        const tituloFinal = (nomePath || selecionado.cidade || selecionado.regiao).toUpperCase();
        document.getElementById('cidade-titulo').innerText = tituloFinal;
        montarVitrine(selecionado, imoveis, tituloFinal);
    }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;

    if (!interativo) {
        container.onclick = () => trocarMapas(true); // Se clicado manualmente, reseta tudo
        container.style.cursor = "pointer";
    } else {
        container.onclick = null;
        container.style.cursor = "default";
    }
    
    const pathsHtml = dados.paths.map(p => {
        const idPathNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPathNorm);
        const isGSP = idPathNorm === "grandesaopaulo";
        const ativo = (pathAtivo === idPathNorm && interativo) ? 'ativo' : '';
        const classe = (temMRV || isGSP) && interativo ? `commrv ${ativo}` : '';
        const clique = interativo ? (isGSP ? `onclick="trocarMapas(true)"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        
        return `<path id="${id}-${idPathNorm}" name="${p.name}" d="${p.d}" class="${classe}" ${clique} onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"></path>`;
    }).join('');
    
    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="width:100%; height:100%;"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
}

// CORREÇÃO: Função de troca agora limpa os destaques e a vitrine
function trocarMapas(completo = true) { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    
    if (completo) {
        pathAtivo = null;
        imovelAtivo = null;
        document.getElementById('cidade-titulo').innerText = "SELECIONE UMA REGIÃO NO MAPA";
        document.getElementById('ficha-tecnica').innerHTML = `
            <div style="text-align:center; color:#ccc; margin-top:100px;">
                <p style="font-size: 30px;">📍</p>
                <p>Clique em algum Residencial ou em alguma região verde do mapa</p>
            </div>`;
    }

    desenharMapas(); 
    gerarListaLateral(); 
}

function cliqueNoMapa(id, nome, temMRV) { if (temMRV) comandoSelecao(id, nome); }
function hoverNoMapa(nome) { document.getElementById('cidade-titulo').innerText = nome.toUpperCase(); }

function resetTitulo() { 
    if (pathAtivo) {
        const mapaAlvo = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
        const pathInfo = mapaAlvo.paths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo);
        document.getElementById('cidade-titulo').innerText = pathInfo ? pathInfo.name.toUpperCase() : "SELECIONE UMA REGIÃO";
    } else {
        document.getElementById('cidade-titulo').innerText = "SELECIONE UMA REGIÃO";
    }
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const clean = valor ? valor.toString().toUpperCase().trim() : "";
    if (clean === "" || clean === "CONSULTAR") return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    if (clean === "VENDIDO" || clean === "0") return `<span class="badge-estoque" style="color:#999; text-decoration: line-through;">VENDIDO</span>`;
    const num = parseInt(clean);
    if (!isNaN(num)) return `<span class="badge-estoque" style="color:${num < 6 ? '#e31010' : '#666'}">RESTAM ${num} UN.</span>`;
    return `<span class="badge-estoque" style="color:#666">${clean}</span>`;
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if(!painel) return;
    
    const listaSuperior = listaDaCidade.filter(i => i.nome !== selecionado.nome && i.tipo === 'R');
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if(listaSuperior.length > 0) {
        html += `<div style="margin-bottom:10px;">${listaSuperior.map(item => `<button class="btRes" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}</button>`).join('')}</div>`;
        html += `<hr style="border:0; border-top:1px solid #ddd; margin:15px 0 20px 0;">`;
    }

    if (selecionado.tipo === 'R') {
        html += `<div style="width:100%; border-radius:4px; height:36px; background-color: #ff8c00; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; text-transform: uppercase;">RES. ${selecionado.nome}</div>`;
        html += `<div style="padding: 10px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        
        html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 5px;">
            <div class="box-argumento" style="margin:0; padding:5px;"><label>Entrega</label><strong>${selecionado.entrega}</strong></div>
            <div class="box-argumento" style="margin:0; padding:5px;"><label>Obra</label><strong>${selecionado.obra}%</strong></div>
            <div class="box-argumento" style="margin:0; padding:5px;"><label>Plantas</label><strong>${selecionado.p_de} - ${selecionado.p_ate}</strong></div>
            <div class="box-argumento" style="margin:0; padding:5px;"><label>Limitador</label><strong>${selecionado.limitador}</strong></div>
        </div>`;
        
        if(selecionado.campanha) {
            html += `<div style="background:#fff1f1; border:1px solid #ffdada; padding:8px; border-radius:4px; text-align:center; color:#e31010; font-weight:800; font-size:0.75rem; margin-top:5px;">${selecionado.campanha}</div>`;
        }
    } else {
        html += `<div class="separador-complexo-btn" style="width:100%">${selecionado.nomeFull}</div>`;
        html += `<div class="box-argumento"><label>Sobre o Complexo</label><p>${selecionado.descLonga}</p></div>`;
    }
    painel.innerHTML = html;
}

window.onload = iniciarApp;

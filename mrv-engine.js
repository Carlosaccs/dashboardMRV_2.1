let DADOS_PLANILHA = [];
let pathAtivo = null;  
let imovelAtivo = null;  
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, LIMITADOR: 12, 
    REGIONAL_MRV: 13, // Coluna N
    CASA_PAULISTA: 14, CAMPANHA: 15, 
    DESC_LONGA: 17, 
    LOCALIZACAO: 19, MOBILIDADE: 20, CULTURA_LAZER: 21,    
    COMERCIO: 22, SAUDE_EDUCACAO: 23,
    BOOK_CLIENTE: 24, BOOK_CORRETOR: 25,
    LINKS_VIDEOS: 26,   // Coluna AA
    LINKS_PLANTAS: 27,  // Coluna AB
    LINKS_IMPLANT: 28,  // Coluna AC
    LINKS_DIVERSOS: 29  // Coluna AD
};

async function iniciarApp() {
    try { await carregarPlanilha(); } catch (err) { console.error(err); }
}

function formatarLinkSeguro(url) {
    if (!url || url === "---" || url === "") return "";
    if (url.includes('drive.google.com')) {
        return url.split('/view')[0].split('/edit')[0] + '/preview';
    }
    return url;
}

function copiarLink(url) {
    const linkSeguro = formatarLinkSeguro(url);
    navigator.clipboard.writeText(linkSeguro);
    alert("Link seguro copiado!");
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

            // FILTRO ANTI-FANTASMA: Ignora se não houver ID ou Ordem válida
            if (!colunas[COL.ID] || colunas[COL.ID] === "---" || isNaN(parseInt(colunas[COL.ORDEM]))) return null;

            const categoriaTxt = (colunas[COL.CATEGORIA] || "").toUpperCase();
            const ehComplexo = categoriaTxt.includes('COMPLEXO');

            return {
                id_path: (colunas[COL.ID] || "").toLowerCase().replace(/\s/g, ''),
                tipo: ehComplexo ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]),
                nome: colunas[COL.NOME],
                nomeFull: colunas[COL.NOME_FULL] || colunas[COL.NOME],
                estoque: colunas[COL.ESTOQUE],
                endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "---",
                obra: colunas[COL.OBRA] || "0",
                tipologiasH: colunas[COL.TIPOLOGIAS] || "", 
                regional: colunas[COL.REGIONAL_MRV] || "",
                p_de: colunas[COL.P_DE] || "---",
                p_ate: colunas[COL.P_ATE] || "---",
                limitador: colunas[COL.LIMITADOR] || "---",
                casa_paulista: colunas[COL.CASA_PAULISTA] || "---",
                campanha: colunas[COL.CAMPANHA] || "",
                descLonga: colunas[COL.DESC_LONGA] || "",
                localizacao: colunas[COL.LOCALIZACAO] || "",
                mobilidade: colunas[COL.MOBILIDADE] || "",
                lazer: colunas[COL.CULTURA_LAZER] || "",
                comercio: colunas[COL.COMERCIO] || "",
                saude: colunas[COL.SAUDE_EDUCACAO] || "",
                linkCliente: colunas[COL.BOOK_CLIENTE] || "",
                linkCorretor: colunas[COL.BOOK_CORRETOR] || "",
                linksVideos: colunas[COL.LINKS_VIDEOS] || "",
                linksPlantas: colunas[COL.LINKS_PLANTAS] || "",
                linksImplant: colunas[COL.LINKS_IMPLANT] || "",
                linksDiversos: colunas[COL.LINKS_DIVERSOS] || ""
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
    comandoSelecao(imovel.id_path, null, imovel); 
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idNorm = idPath.toLowerCase().replace(/\s/g, '');
    
    // LÓGICA DE SEGUNDO CLIQUE: Se clicar no que já está ativo e não for via lista, limpa tudo.
    if (pathAtivo === idNorm && !fonte) {
        pathAtivo = null; imovelAtivo = null;
        document.getElementById('ficha-tecnica').innerHTML = `<div style="text-align:center; color:#ccc; margin-top:80px;"><p style="font-size:30px;">📍</p><p>Clique no mapa ou na lista</p></div>`;
        atualizarTituloSuperior();
        desenharMapas(); gerarListaLateral();
        return;
    }

    const noGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idNorm);
    const noInterior = MAPA_INTERIOR.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idNorm);
    
    if (noGSP && mapaAtivo !== 'GSP') trocarMapas(false);
    if (noInterior && mapaAtivo !== 'INTERIOR') trocarMapas(false);
    
    pathAtivo = idNorm;
    const imoveisDaCidade = DADOS_PLANILHA.filter(d => d.id_path === pathAtivo);
    const selecionado = fonte || imoveisDaCidade[0];
    imovelAtivo = selecionado.nome;
    
    desenharMapas();
    gerarListaLateral();
    
    const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
    const nomeOficial = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || pathAtivo;
    atualizarTituloSuperior(nomeOficial);
    montarVitrine(selecionado, imoveisDaCidade, nomeOficial);
}

function atualizarTituloSuperior(texto) {
    const titulo = document.getElementById('cidade-titulo');
    if (texto) { titulo.innerText = texto.toUpperCase(); } 
    else if (pathAtivo) {
        const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
        const nomeFixo = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || "";
        titulo.innerText = nomeFixo.toUpperCase();
    } else { titulo.innerText = "SELECIONE UMA REGIÃO NO MAPA"; }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    
    // IMPORTANTE: Removemos os estilos manuais de transform aqui 
    // para que o CSS (caixa-a svg) controle a centralização e escala.
    container.style.transform = "";
    container.style.transformOrigin = "";
    container.style.marginBottom = "0";

    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const ativo = (pathAtivo === idNorm && interativo) ? 'ativo' : '';
        const isGSP = idNorm === "grandesaopaulo";
        let eventos = "";
        if (interativo) {
            if (isGSP) { eventos = `onclick="trocarMapas(true)" onmouseover="atualizarTituloSuperior('GRANDE SÃO PAULO')" onmouseout="atualizarTituloSuperior()"`; } 
            else { eventos = `onclick="comandoSelecao('${p.id}')" onmouseover="atualizarTituloSuperior('${p.name}')" onmouseout="atualizarTituloSuperior()"`; }
        }
        return `<path id="${id}-${idNorm}" d="${p.d}" class="${(temMRV || isGSP) && interativo ? 'commrv '+ativo : ''}" ${eventos}></path>`;
    }).join('');
    
    // Adicionado preserveAspectRatio para garantir centralização
    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
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

const criarCardMaterial = (titulo, url, icone) => {
    if (!url || url === "" || url === "---") return "";
    const linkSeguro = formatarLinkSeguro(url);
    return `
    <div class="card-material-item" style="padding: 4px 8px; margin-bottom: 4px; min-height: 32px;">
        <div class="card-material-left" style="gap: 8px;">
            <span class="card-icon" style="font-size: 0.8rem;">${icone}</span>
            <span class="card-text" style="font-size: 0.65rem;">${titulo}</span>
        </div>
        <div class="card-material-right" style="position: relative; gap: 4px;">
            <a href="${linkSeguro}" target="_blank" class="card-btn-abrir" style="padding: 2px 8px; font-size: 0.6rem;">Abrir</a>
            <div class="preview-hover-box"><iframe src="${linkSeguro}"></iframe></div>
            <button onclick="copiarLink('${url}')" class="card-btn-copiar" style="padding: 2px 8px; font-size: 0.6rem;">Copiar</button>
        </div>
    </div>`;
};

const extrairLinks = (campo, icone) => {
    if(!campo || campo === "---") return "";
    let htmlTemp = "";
    const grupos = campo.split(';').map(g => g.trim()).filter(g => g !== "");
    grupos.forEach(g => {
        const partes = g.split(',').map(p => p.trim());
        if(partes.length >= 2) htmlTemp += criarCardMaterial(partes[0], partes[1], icone);
    });
    return htmlTemp;
};

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if(outros.length > 0) {
        html += `<div style="margin-bottom:6px;">${outros.map(i => `
            <button class="${i.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'}" style="width:100%;" onclick="navegarVitrine('${i.nome}')">
                <strong>${i.nome}</strong> ${obterHtmlEstoque(i.estoque, i.tipo)}
            </button>`).join('')}</div><hr style="border:0; border-top:1px solid #eee; margin:6px 0;">`;
    }

    if (selecionado.tipo === 'R') {
        html += `
        <div class="titulo-vitrine-faixa faixa-laranja" style="display: flex; justify-content: space-between; align-items: center; padding: 0 10px; height: 38px;">
            <span style="flex-shrink: 0;">RES. ${selecionado.nome}</span>
            <span style="font-size: inherit; background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 6px; text-transform: uppercase; font-weight: bold; line-height: 1;">${selecionado.regional}</span>
        </div>`;
        
        html += `<div style="padding-bottom: 4px;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        
        html += `<div style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; margin-bottom: 4px;">`;
        if(selecionado.campanha && selecionado.campanha !== "---") {
            html += `<div style="background: white; color: var(--vermelho-mrv); font-weight: bold; font-size: 0.7rem; text-align: center; padding: 6px; border-bottom: 1px solid #ddd;">${selecionado.campanha}</div>`;
        }
        const linhaInfo = (l1, v1, l2, v2, borda) => `
            <div style="display: flex; width: 100%; ${borda ? 'border-bottom: 1px solid #ddd;' : ''}">
                <div style="flex: 1; padding: 4px 8px; border-right: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;"><label style="font-size: 0.55rem; font-weight: bold; color: var(--mrv-verde); text-transform: uppercase;">${l1}</label><strong style="font-size: 0.65rem; color: #333;">${v1}</strong></div>
                <div style="flex: 1; padding: 4px 8px; display: flex; justify-content: space-between; align-items: center;"><label style="font-size: 0.55rem; font-weight: bold; color: var(--mrv-verde); text-transform: uppercase;">${l2}</label><strong style="font-size: 0.65rem; color: #333;">${v2}</strong></div>
            </div>`;
        html += linhaInfo('Entrega', selecionado.entrega, 'Obra', selecionado.obra + '%', true);
        html += linhaInfo('Plantas', selecionado.p_de + ' - ' + selecionado.p_ate, 'Estoque', selecionado.estoque + ' UN.', true);
        html += linhaInfo('Limitador', selecionado.limitador, 'C. Paulista', selecionado.casa_paulista, false);
        html += `</div>`;

        let materiaisHtml = "";
        materiaisHtml += criarCardMaterial('Book Cliente', selecionado.linkCliente, '📄');
        materiaisHtml += criarCardMaterial('Book Corretor', selecionado.linkCorretor, '💼');
        materiaisHtml += extrairLinks(selecionado.linksVideos, '🎬');
        materiaisHtml += extrairLinks(selecionado.linksPlantas, '📐');
        materiaisHtml += extrairLinks(selecionado.linksImplant, '📍');
        materiaisHtml += extrairLinks(selecionado.linksDiversos, '✨');
        
        if (materiaisHtml !== "") {
            html += `<div style="margin-top: 10px;"><label style="display:block; font-size:0.6rem; font-weight:bold; color:#888; text-transform:uppercase; margin-bottom:4px; border-bottom:1px solid #eee;">MATERIAIS DE APOIO</label>${materiaisHtml}</div>`;
        }
    } else {
        html += `
        <div class="titulo-vitrine-faixa faixa-preta" style="display: flex; justify-content: space-between; align-items: center; padding: 0 10px; height: 38px;">
            <span style="flex-shrink: 0;">${selecionado.nomeFull}</span>
            <span style="font-size: inherit; background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 6px; text-transform: uppercase; font-weight: bold; line-height: 1;">${selecionado.regional}</span>
        </div>`;
        
        html += `<div class="box-complexo-full">
                    <p style="font-size:0.7rem; color:#444; margin-bottom:10px;"><span>📍 ${selecionado.endereco}</span> <a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p>
                    <p style="font-size:0.75rem; color:#444; line-height:1.5; text-align:justify;">${selecionado.descLonga}</p>
                 </div>`;

        let materiaisComplexo = extrairLinks(selecionado.linksImplant, '📍');
        if (materiaisComplexo !== "") {
            html += `<div style="margin-top: 10px; padding: 0 5px;">
                <label style="display:block; font-size:0.6rem; font-weight:bold; color:#888; text-transform:uppercase; margin-bottom:4px; border-bottom:1px solid #eee;">MATERIAIS DE APOIO</label>
                ${materiaisComplexo}
            </div>`;
        }
    }
    painel.innerHTML = html;
}

window.onload = iniciarApp;

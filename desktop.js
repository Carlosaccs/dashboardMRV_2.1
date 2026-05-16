/* ==========================================================================
   BLOCO 01: CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
   ========================================================================== */
let DADOS_PLANILHA = [];
let pathAtivo = null;  
let imovelAtivo = null;  
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, 
    ZONA: 3, // Coluna D da Planilha
    NOME: 4, NOME_FULL: 5,  
    ESTOQUE: 6, END: 7, TIPOLOGIAS: 8, ENTREGA: 9, 
    P_DE: 10, P_ATE: 11, OBRA: 12, LIMITADOR: 13, 
    REGIAO: 14, CASA_PAULISTA: 15, CAMPANHA: 16, 
    DESC_LONGA: 18, OBSERVACOES: 19,
    LOCALIZACAO: 20, MOBILIDADE: 21, CULTURA_LAZER: 22,    
    COMERCIO: 23, SAUDE_EDUCACAO: 24,
    BOOK_CLIENTE: 25, BOOK_CORRETOR: 26,
    LINKS_VIDEOS: 27, LINKS_PLANTAS: 28,  
    LINKS_IMPLANT: 29, LINKS_DIVERSOS: 30,
    ESTANDE: 31 
};


/* ==========================================================================
   BLOCO 02: INICIALIZAÇÃO E UTILITÁRIOS
   ========================================================================== */
async function iniciarApp() {
    try { await carregarPlanilha(); } catch (err) { console.error(err); }
}

function formatarLinkSeguro(url) {
    if (!url || url === "---" || url === "" || typeof url !== 'string') return "";
    let link = url.trim();
    if (link.includes('drive.google.com')) {
        const match = link.match(/\/d\/(.*?)(\/|$|\?)/) || link.match(/id=(.*?)($|&)/);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview?rm=minimal`;
        }
    }
    return link;
}

function copiarTexto(texto, msg = "Link copiado!") {
    if (!texto || texto === "") return;
    navigator.clipboard.writeText(texto).then(() => {
        alert(msg);
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
    });
}

function copiarLink(url) {
    const linkSeguro = formatarLinkSeguro(url);
    copiarTexto(linkSeguro, "Link seguro copiado!");
}

/* ==========================================================================
   BLOCO 03: CARREGAMENTO DE DADOS (GOOGLE SHEETS)
   ========================================================================== */
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

            const nomeImovel = colunas[COL.NOME] || "";
            const idPath = (colunas[COL.ID] || "").toLowerCase().replace(/\s/g, '');
            const ordem = parseInt(colunas[COL.ORDEM]);

            if (!idPath || nomeImovel.length <= 1 || isNaN(ordem)) return null;

            const cat = (colunas[COL.CATEGORIA] || "").toUpperCase();
            
            return {
                id_path: idPath,
                tipo: cat.includes('COMPLEXO') ? 'N' : 'R',
                ordem: ordem,
                zona: colunas[COL.ZONA] || "", 
                nome: nomeImovel,
                nomeFull: colunas[COL.NOME_FULL] || nomeImovel,
                estoque: colunas[COL.ESTOQUE],
                endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "---",
                obra: colunas[COL.OBRA] || "0",
                tipologiasH: colunas[COL.TIPOLOGIAS] || "", 
                regiao: colunas[COL.REGIAO] || "---",
                p_de: colunas[COL.P_DE] || "---",
                p_ate: colunas[COL.P_ATE] || "---",
                limitador: colunas[COL.LIMITADOR] || "---",
                casa_paulista: colunas[COL.CASA_PAULISTA] || "---",
                campanha: colunas[COL.CAMPANHA] || "",
                observacoes: colunas[COL.OBSERVACOES] || "", 
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
                linksDiversos: colunas[COL.LINKS_DIVERSOS] || "",
                estande: colunas[COL.ESTANDE] || ""
            };
        }).filter(i => i !== null);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        desenharMapas(); gerarListaLateral();
    } catch (e) { console.error(e); }
}

/* ==========================================================================
   BLOCO 04: LÓGICA DO MAPA E SELEÇÃO
   ========================================================================== */
function obterHtmlZona(zona, tipo) {
    if (tipo === 'N' || !zona || zona === "---") return "";
    return `<span style="font-size:10px; font-weight:bold; color:#666;">${zona.toUpperCase()}</span>`;
}

function detectarClasseZona(zona) {
    if (!zona) return "";
    const z = zona.toUpperCase().trim();
    if (z.includes("ZO")) return "btn-zo";
    if (z.includes("ZL")) return "btn-zl";
    if (z.includes("ZN")) return "btn-zn";
    if (z.includes("ZS")) return "btn-zs";
    return ""; 
}

function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (!imovel) return;
    comandoSelecao(imovel.id_path, null, imovel); 
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idNorm = idPath.toLowerCase().replace(/\s/g, '');
    const noGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idNorm);
    const noInterior = MAPA_INTERIOR.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idNorm);
    
    if (noGSP && mapaAtivo !== 'GSP') trocarMapas(false);
    if (noInterior && mapaAtivo !== 'INTERIOR') trocarMapas(false);
    
    pathAtivo = idNorm;
    const imoveisDaCidade = DADOS_PLANILHA.filter(d => d.id_path === pathAtivo);
    const selecionado = fonte || imoveisDaCidade[0];
    imovelAtivo = selecionado.nome;

    document.querySelectorAll('path').forEach(el => el.classList.remove('ativo'));
    const elMapa = document.getElementById(`caixa-a-${pathAtivo}`);
    if (elMapa) elMapa.classList.add('ativo');

    gerarListaLateral();
    const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
    const nomeOficial = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || pathAtivo;
    
    atualizarTituloSuperior(nomeOficial);
    montarVitrine(selecionado, imoveisDaCidade, nomeOficial);
}

function atualizarTituloSuperior(texto) {
    const titulo = document.getElementById('cidade-titulo');
    if (texto) { titulo.innerText = `MRV EM ${texto.toUpperCase()}`; } 
    else if (pathAtivo) {
        const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
        const nomeFixo = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || "";
        titulo.innerText = `MRV EM ${nomeFixo.toUpperCase()}`;
    } else { titulo.innerText = "SELECIONE UMA REGIÃO NO MAPA"; }
}

/* ==========================================================================
   BLOCO 05: RENDERIZAÇÃO DOS MAPAS (SVG)
   ========================================================================== */
function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    container.style.display = "flex"; 
    container.style.alignItems = "center";
    container.style.justifyContent = "center"; 
    container.style.overflow = "hidden";

    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const ativo = (pathAtivo === idNorm && interativo) ? 'ativo' : '';
        const isGSP = idNorm === "grandesaopaulo";
        let eventos = "";
        
        if (interativo) {
            if (isGSP) { 
                eventos = `onclick="trocarMapas(true)" onmouseover="atualizarTituloSuperior('GRANDE SÃO PAULO')" onmouseout="atualizarTituloSuperior()"`; 
            } else { 
                eventos = `onclick="comandoSelecao('${p.id}')" onmouseover="atualizarTituloSuperior('${p.name}')" onmouseout="atualizarTituloSuperior()"`; 
            }
        }
        return `<path id="${id}-${idNorm}" d="${p.d}" class="${(temMRV || isGSP) && interativo ? 'commrv '+ativo : ''}" ${eventos}></path>`;
    }).join('');

    const escala = interativo 
        ? 'transform: scale(1.25); transform-origin: center;' 
        : 'transform: scale(0.75); transform-origin: center;';

    container.innerHTML = `
        <svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet" style="width:100%; height:100%; ${escala}">
            <g transform="${dados.transform || ''}">
                ${pathsHtml}
            </g>
        </svg>`;
}

function dessinharMapas() {
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

/* ==========================================================================
   BLOCO 06: LISTA LATERAL
   ========================================================================== */
function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        const classeZona = detectarClasseZona(item.zona); 
        
        return `<div class="${item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'} ${ativo} ${classeZona}" onclick="navegarVitrine('${item.nome}')">
                    <strong>${item.nome}</strong> ${obterHtmlZona(item.zona, item.tipo)}
                </div>`;
    }).join('');
}

/* ==========================================================================
   BLOCO 07: CONSTRUÇÃO DA VITRINE (FICHA TÉCNICA) COM ABA DE DOCUMENTOS
   ========================================================================== */
const criarCardMaterial = (titulo, url, icone) => {
    if (!url || url === "" || url === "---") return "";
    const linkSeguro = formatarLinkSeguro(url);
    return `
    <div class="card-material-item" style="display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #ddd; padding: 8px; margin-bottom: 6px; border-radius: 4px;">
        <div class="card-material-left" style="display: flex; align-items: center; gap: 8px;">
            <span class="card-icon">${icone}</span>
            <span class="card-text" style="font-size: 0.72rem; font-weight: bold; color: #444;">${titulo}</span>
        </div>
        <div class="card-material-right" style="display: flex; gap: 4px;">
            <a href="${linkSeguro}" target="_blank" style="background: var(--mrv-verde, #00733d); color: white; text-decoration: none; padding: 4px 8px; font-size: 0.65rem; border-radius: 3px; font-weight: bold;">Abrir</a>
            <button onclick="copiarLink('${url}')" style="background: #f37021; color: white; border: none; padding: 4px 8px; font-size: 0.65rem; border-radius: 3px; cursor: pointer; font-weight: bold;">Copiar</button>
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

// Nova função global criada para alternar as abas dinamicamente
function alternarAbaVitrine(aba) {
    const btnFicha = document.getElementById('btn-aba-ficha');
    const btnDocs = document.getElementById('btn-aba-docs');
    const boxFicha = document.getElementById('box-conteudo-ficha');
    const boxDocs = document.getElementById('box-conteudo-docs');

    if (aba === 'docs') {
        boxFicha.style.display = 'none';
        boxDocs.style.display = 'block';
        btnFicha.style.background = '#eee';
        btnFicha.style.color = '#666';
        btnDocs.style.background = 'var(--mrv-verde, #00733d)';
        btnDocs.style.color = 'white';
    } else {
        boxFicha.style.display = 'block';
        boxDocs.style.display = 'none';
        btnFicha.style.background = 'var(--mrv-verde, #00733d)';
        btnFicha.style.color = 'white';
        btnDocs.style.background = '#eee';
        btnDocs.style.color = '#666';
    }
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMapsResidencial = `https://maps.google.com/?q=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if(outros.length > 0) {
        html += `<div style="margin-bottom:6px;">${outros.map(i => {
            const classeZ = detectarClasseZona(i.zona);
            return `<button class="${i.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'} ${classeZ}" style="width:100%;" onclick="navegarVitrine('${i.nome}')">
                <strong>${i.nome}</strong> ${obterHtmlZona(i.zona, i.tipo)}
            </button>`}).join('')}</div><hr style="border:0; border-top:1px solid #eee; margin:6px 0;">`;
    }

    // INTERFACE DE BOTÕES DE ALTERNÂNCIA (ABAS)
    html += `
    <div style="display: flex; gap: 4px; margin-bottom: 8px;">
        <button id="btn-aba-ficha" onclick="alternarAbaVitrine('ficha')" style="flex: 1; padding: 6px; font-size: 0.7rem; font-weight: bold; border: none; border-radius: 4px; cursor: pointer; background: var(--mrv-verde, #00733d); color: white; transition: 0.2s;">📋 FICHA TÉCNICA</button>
        <button id="btn-aba-docs" onclick="alternarAbaVitrine('docs')" style="flex: 1; padding: 6px; font-size: 0.7rem; font-weight: bold; border: none; border-radius: 4px; cursor: pointer; background: #eee; color: #666; transition: 0.2s;">📂 DOCUMENTOS</button>
    </div>`;

    // ================= CONTAINER DA FICHA TÉCNICA =================
    html += `<div id="box-conteudo-ficha" style="display: block;">`;

    if (selecionado.tipo === 'R') {
        html += `<div class="titulo-vitrine-faixa" style="background-color: var(--mrv-laranja); color: white; padding: 6px; font-weight: bold; text-align: center; margin-bottom: 5px; border-radius: 4px; font-size: 0.75rem;">RES. ${selecionado.nome.toUpperCase()} — ${selecionado.regiao}</div>`;
        
        html += `
        <div style="padding: 2px 0 5px 0;">
            <div style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;">
                <span style="flex:1;">📍 ${selecionado.endereco}</span>
                <div style="display:flex; gap:3px; margin-left:5px;">
                    <a href="${urlMapsResidencial}" target="_blank" class="btn-maps">MAPS</a>
                    <button onclick="copiarTexto('${urlMapsResidencial}')" class="btn-maps" style="background:#444; border:none; cursor:pointer;">LINK</button>
                </div>
            </div>
        </div>`;

        html += `<div style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; margin-bottom: 4px;">`;
        if(selecionado.campanha && selecionado.campanha !== "---" && selecionado.campanha !== "") {
            html += `<div style="background: #fff5f5; color: #e31010; font-weight: bold; font-size: 0.7rem; text-align: center; padding: 4px; border-bottom: 1px solid #ddd;">${selecionado.campanha}</div>`;
        }
        
        const linhaInfo = (l1, v1, l2, v2, borda) => `
            <div style="display: flex; width: 100%; ${borda ? 'border-bottom: 1px solid #ddd;' : ''}">
                <div style="flex: 1; padding: 4px 8px; border-right: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-size: 0.55rem; font-weight: bold; color: var(--mrv-verde); text-transform: uppercase;">${l1}</label>
                    <strong style="font-size: 0.65rem; color: #333;">${v1}</strong>
                </div>
                <div style="flex: 1; padding: 4px 8px; display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-size: 0.55rem; font-weight: bold; color: var(--mrv-verde); text-transform: uppercase;">${l2}</label>
                    <strong style="font-size: 0.65rem; color: #333;">${v2}</strong>
                </div>
            </div>`;

        const estoqueRaw = selecionado.estoque ? selecionado.estoque.toString().toUpperCase().trim() : "";
        let corEstoque = "#333";
        if (estoqueRaw === "VENDIDO" || estoqueRaw === "0") {
            corEstoque = "#999";
        } else {
            const nEst = parseInt(estoqueRaw);
            if (!isNaN(nEst) && nEst < 6) corEstoque = "var(--vermelho-mrv)";
        }
        const valorEstoqueColorido = `<span style="color: ${corEstoque}">${selecionado.estoque || "---"} UN.</span>`;

        html += linhaInfo('Entrega', selecionado.entrega, 'Obra', (selecionado.obra || 0) + '%', true);
        html += linhaInfo('Plantas', selecionado.p_de + ' - ' + selecionado.p_ate, 'Estoque', valorEstoqueColorido, true);
        html += linhaInfo('Limitador', selecionado.limitador, 'C. Paulista', selecionado.casa_paulista, false);
        html += `</div>`;

        if(selecionado.tipologiasH) {
            const linhas = selecionado.tipologiasH.split(';').map(l => l.trim()).filter(l => l !== "");
            if(linhas.length > 0) {
                const titulos = linhas[0].split(',').map(t => t.trim());
                const dados = linhas.slice(1);
                html += `
                <div class="tabela-precos-container">
                    <div class="tabela-header">
                        ${titulos.map((t, idx) => {
                            const estiloCabecalho = idx === 1 ? 'background-color: var(--mrv-laranja); color:white; font-weight:bold;' : '';
                            return `<div class="col-tabela" style="${estiloCabecalho}">${t}</div>`;
                        }).join('')}
                    </div>
                    <div class="tabela-corpo">
                        ${dados.map(linhaStr => {
                            const cols = inlineStr = linhaStr.split(',').map(c => c.trim());
                            if(cols.length <= 1) return "";
                            return `<div class="tabela-row">
                                ${cols.map((v, idx) => {
                                    const estiloCelula = idx === 1 ? 'background-color: var(--mrv-laranja); color:white; font-weight:bold;' : '';
                                    return `<div class="col-tabela" style="${estiloCelula}">${idx === 0 ? `<strong>${v}</strong>` : v}</div>`;
                                }).join('')}
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            }
        }

        html += `<div style="border-radius: 4px; overflow: hidden; border: 1px solid #ddd; margin-top: 6px;">`;
        if(selecionado.estande && selecionado.estande !== "---" && selecionado.estande !== "") {
            const urlMapsEstande = `https://maps.google.com/?q=${encodeURIComponent(selecionado.estande)}`;
            html += `
            <div style="background: #e8f5e9; border-left: 6px solid #2e7d32; padding: 6px 10px; border-bottom: 1px solid #ddd;">
                <label style="display:block; font-size:0.55rem; font-weight:bold; color:#2e7d32; text-transform:uppercase; margin-bottom:1px;">📍 Estande de Vendas</label>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <p style="margin:0; font-size:0.68rem; color:#444; line-height:1.3; flex:1;">${selecionado.estande}</p>
                    <div style="display:flex; gap:3px; margin-left:5px;">
                        <a href="${urlMapsEstande}" target="_blank" class="btn-maps">MAPS</a>
                        <button onclick="copiarTexto('${urlMapsEstande}')" class="btn-maps" style="background:#444; border:none; cursor:pointer;">LINK</button>
                    </div>
                </div>
            </div>`;
        }

        const boxDif = (label, texto, fundo, borda, temB) => {
            if(!texto || texto === "---" || texto === "") return "";
            return `
            <div style="background: ${fundo}; border-left: 6px solid ${borda}; padding: 6px 10px; ${temB ? 'border-bottom: 1px solid #ddd;' : ''}">
                <label style="display:block; font-size:0.55rem; font-weight:bold; color:${borda}; text-transform:uppercase; margin-bottom:1px;">${label}</label>
                <p style="margin:0; font-size:0.68rem; color:#444; line-height:1.3;">${texto}</p>
            </div>`;
        };
        html += boxDif('💡 Observação Importante', selecionado.observacoes, '#fff9c4', '#fbc02d', true);
        html += boxDif('📍 Localização', selecionado.localizacao, '#fdf2e9', '#f37021', true);
        html += boxDif('🚍 Mobilidade', selecionado.mobilidade, '#f1f8e9', '#2e7d32', true);
        html += boxDif('🎭 Cultura e Lazer', selecionado.lazer, '#e3f2fd', '#1565c0', true);
        html += boxDif('🛒 Comércio', selecionado.comercio, '#ffebee', '#c62828', true);
        html += boxDif('🏥 Saúde e Educação', selecionado.saude, '#f3e5f5', '#6a1b9a', false);
        html += `</div>`;

    } else {
        let corComplexo = "#333";
        if (selecionado.zona === 'ZO') corComplexo = "#ff9d42"; 
        else if (selecionado.zona === 'ZL') corComplexo = "#003399";
        else if (selecionado.zona === 'ZN') corComplexo = "#ffd700";
        else if (selecionado.zona === 'ZS') corComplexo = "#ff33aa";

        let corTexto = (selecionado.zona === 'ZN') ? "#333" : "white";

        html += `<div class="titulo-vitrine-faixa" style="background-color: ${corComplexo}; color: ${corTexto}; padding: 8px; font-weight: bold; text-align: center; margin-bottom: 5px; border-radius: 4px; font-size: 0.8rem;">
                    ${selecionado.nomeFull.toUpperCase()} — ${selecionado.regiao}
                 </div>`;
                 
        html += `<div class="box-complexo-full" style="border: 1px solid ${corComplexo}; border-radius: 4px; padding: 10px; background: #fff;">
                    <p style="font-size:0.7rem; color:#444; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                        <span>📍 ${selecionado.endereco}</span> 
                        <span style="display:flex; gap:3px;">
                            <a href="${urlMapsResidencial}" target="_blank" class="btn-maps">MAPS</a>
                            <button onclick="copiarTexto('${urlMapsResidencial}')" class="btn-maps" style="background:#444; border:none; color:white; cursor:pointer; border-radius:3px; padding: 2px 6px;">LINK</button>
                        </span>
                    </p>
                    <div style="font-size:0.75rem; color:#444; line-height:1.5; text-align:justify;">${selecionado.descLonga}</div>
                 </div>`;
    }
    html += `</div>`; // FIM DO CONTAINER DA FICHA TÉCNICA

    // ================= CONTAINER DOS DOCUMENTOS (ABA OCULTA) =================
    html += `<div id="box-conteudo-docs" style="display: none; padding-top: 5px;">`;
    
    let materiaisHtml = "";
    if (selecionado.tipo === 'R') {
        materiaisHtml += criarCardMaterial('Book Cliente', selecionado.linkCliente, '📄');
        materiaisHtml += criarCardMaterial('Book Corretor', selecionado.linkCorretor, '💼');
        materiaisHtml += extrairLinks(selecionado.linksVideos, '🎬');
        materiaisHtml += extrairLinks(selecionado.linksPlantas, '📐');
        materiaisHtml += extrairLinks(selecionado.linksImplant, '📍');
        materiaisHtml += extrairLinks(selecionado.linksDiversos, '✨');
    } else {
        materiaisHtml += extrairLinks(selecionado.linksImplant, '📍');
    }
    
    if (materiaisHtml !== "") {
        html += `
        <label style="display:block; font-size:0.6rem; font-weight:bold; color:#888; text-transform:uppercase; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom: 2px;">DOCUMENTOS DISPONÍVEIS</label>
        ${materiaisHtml}`;
    } else {
        html += `<div style="text-align: center; color: #999; font-size: 0.72rem; margin-top: 30px;">Nenhum documento ou link cadastrado para este residencial.</div>`;
    }
    
    html += `</div>`; // FIM DO CONTAINER DOS DOCUMENTOS

    painel.innerHTML = html;
}

/* ==========================================================================
   BLOCO 08: LÓGICA DO MODAL (SOBRE)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("modal-sobre");
    const btn = document.getElementById("btn-sobre");
    const span = document.querySelector(".modal-close");

    if(btn && modal) {
        btn.onclick = () => { modal.style.display = "block"; };
    }
    if(span && modal) {
        span.onclick = () => { modal.style.display = "none"; };
    }
    window.onclick = (event) => {
        if (event.target == modal) { modal.style.display = "none"; }
    };
});

window.onload = iniciarApp;

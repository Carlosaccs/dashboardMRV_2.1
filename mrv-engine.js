let DADOS_PLANILHA = [];
let pathAtivo = null;  
let imovelAtivo = null;  
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, LIMITADOR: 12, 
    REGIAO: 13, CASA_PAULISTA: 14, CAMPANHA: 15, 
    DESC_LONGA: 17, 
    LOCALIZACAO: 19, MOBILIDADE: 20, CULTURA_LAZER: 21,    
    COMERCIO: 22, SAUDE_EDUCACAO: 23,   
    BOOK_CLIENTE: 24, BOOK_CORRETOR: 25     
};

async function iniciarApp() {
    try { await carregarPlanilha(); } catch (err) { console.error(err); }
}

// --- FUNÇÃO PARA SEGURANÇA ---
function formatarLinkSeguro(url) {
    if (!url || url === "---" || url === "") return "";
    // Se for link do Drive, garante que use o modo preview (sem ferramentas externas)
    if (url.includes('drive.google.com')) {
        return url.split('/view')[0] + '/preview';
    }
    return url;
}

function copiarLink(url) {
    // Garante que o link copiado também seja o seguro
    const linkSeguro = formatarLinkSeguro(url);
    navigator.clipboard.writeText(linkSeguro);
    alert("Link seguro (sem menus) copiado!");
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
            if (!colunas[COL.NOME] || isNaN(parseInt(colunas[COL.ORDEM]))) return null;
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
                tipologiasH: colunas[COL.TIPOLOGIAS] || "", 
                regiao: colunas[COL.REGIAO] || "---",
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
                linkCorretor: colunas[COL.BOOK_CORRETOR] || ""
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
    pathAtivo = idPath.toLowerCase().replace(/\s/g, '');
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
    if (texto) { titulo.innerText = texto.toUpperCase(); } 
    else if (pathAtivo) {
        const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
        const nomeFixo = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || "";
        titulo.innerText = nomeFixo.toUpperCase();
    } else { titulo.innerText = "SELECIONE UMA REGIÃO NO MAPA"; }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
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
    container.innerHTML = `<svg viewBox="${dados.viewBox}"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
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
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if (selecionado.tipo === 'R') {
        html += `<div class="titulo-vitrine-faixa faixa-laranja">RES. ${selecionado.nome}</div>`;
        html += `<div style="padding: 0 0 4px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        
        if(selecionado.campanha && selecionado.campanha !== "---" && selecionado.campanha !== "") {
            html += `<div class="grid-infos"><div class="row-infos"><div class="box-argumento box-campanha" style="width:100%; display:block; text-align:center;">${selecionado.campanha}</div></div></div>`;
        }

        const fila = (l1, v1, l2, v2) => `
            <div class="grid-infos"><div class="row-infos">
                <div class="box-argumento"><div class="box-inner"><label>${l1}</label>strong>${v1}</strong></div></div>
                <div class="box-argumento"><div class="box-inner"><label>${l2}</label>strong>${v2}</strong></div></div>
            </div></div>`;

        html += fila('Entrega', selecionado.entrega, 'Obra', selecionado.obra + '%');
        html += fila('Plantas', selecionado.p_de + ' - ' + selecionado.p_ate, 'Estoque', selecionado.estoque + ' UN.');
        html += fila('Limitador', selecionado.limitador, 'C. Paulista', selecionado.casa_paulista);

        if(selecionado.tipologiasH) {
            const linhas = selecionado.tipologiasH.split(';').map(l => l.trim()).filter(l => l !== "");
            if(linhas.length > 0) {
                const titulos = linhas[0].split(',').map(t => t.trim());
                const dados = linhas.slice(1);
                html += `
                <div class="tabela-precos-container">
                    <div class="tabela-header">
                        ${titulos.map((t, idx) => `<div class="col-tabela ${idx === 1 ? 'col-laranja' : ''}">${t}</div>`).join('')}
                    </div>
                    <div class="tabela-divisor"></div>
                    <div class="tabela-corpo">
                        ${dados.map(linha => {
                            const cols = linha.split(',').map(c => c.trim());
                            if(cols.length <= 1) return "";
                            return `<div class="tabela-row">
                                ${cols.map((v, idx) => `<div class="col-tabela ${idx === 1 ? 'col-laranja' : ''}">${idx === 0 ? `<strong>${v}</strong>` : v}</div>`).join('')}
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            }
        }

        const criarBoxDestaque = (label, texto, corFundo, corBorda) => {
            if(!texto || texto === "---" || texto === "") return "";
            return `
            <div style="background: ${corFundo}; border-left: 4px solid ${corBorda}; padding: 8px; border-radius: 4px; margin-bottom: 6px; width: 100%; box-sizing: border-box;">
                <label style="display:block; font-size:0.55rem; font-weight:bold; color:${corBorda}; text-transform:uppercase; margin-bottom:2px;">${label}</label>
                <p style="margin:0; font-size:0.7rem; color:#444; line-height:1.4;">${texto}</p>
            </div>`;
        };

        html += criarBoxDestaque('📍 Diferenciais de Localização', selecionado.localizacao, '#fdf2e9', '#f37021');
        html += criarBoxDestaque('🚍 Mobilidade', selecionado.mobilidade, '#f1f8e9', '#2e7d32');
        html += criarBoxDestaque('🎭 Cultura e Lazer', selecionado.lazer, '#e3f2fd', '#1565c0');
        html += criarBoxDestaque('🛒 Comércio', selecionado.comercio, '#ffebee', '#c62828');
        html += criarBoxDestaque('🏥 Saúde e Educação', selecionado.saude, '#f3e5f5', '#6a1b9a');

        // --- MATERIAIS DE APOIO (ESTILO CARDS COM SEGURANÇA) ---
        const criarCardMaterial = (titulo, url, icone) => {
            if (!url || url === "" || url === "---") return "";
            // Garante que o link seguro seja gerado para o iframe
            const linkSeguro = formatarLinkSeguro(url);
            
            return `
            <div class="card-material-item">
                <div class="card-material-left">
                    <span class="card-icon">${icone}</span>
                    <span class="card-text">${titulo}</span>
                    <div class="preview-hover-box">
                        <iframe src="${linkSeguro}"></iframe>
                    </div>
                </div>
                <div class="card-material-right">
                    <a href="${linkSeguro}" target="_blank" class="card-btn-abrir">Abrir</a>
                    <button onclick="copiarLink('${url}')" class="card-btn-copiar">Copiar</button>
                </div>
            </div>`;
        };

        let materiaisHtml = "";
        materiaisHtml += criarCardMaterial('Book Cliente', selecionado.linkCliente, '📄');
        materiaisHtml += criarCardMaterial('Book Corretor', selecionado.linkCorretor, '💼');

        if (materiaisHtml !== "") {
            html += `
            <div style="margin-top: 15px;">
                <label style="display:block; font-size:0.6rem; font-weight:bold; color:#888; text-transform:uppercase; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:4px;">MATERIAIS DE APOIO</label>
                ${materiaisHtml}
            </div>`;
        }

        if(selecionado.descLonga) {
             html += `<div style="margin-top:8px; font-size:0.7rem; color:#666; font-style:italic; border-top:1px solid #eee; padding-top:4px;">${selecionado.descLonga}</div>`;
        }
    } else {
        html += `<div class="titulo-vitrine-faixa faixa-preta" style="margin-bottom:0px;">${selecionado.nomeFull}</div>`;
        html += `<div class="box-complexo-full" style="margin-top:0px;">
                    <div style="margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #ddd;">
                        <p style="font-size:0.7rem; color:#444; display:flex; justify-content:space-between; align-items:center;">
                            <span>📍 ${selecionado.endereco}</span>
                            <a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a>
                        </p>
                    </div>
                    <p style="font-size:0.75rem; color:#444; line-height:1.5; text-align:justify;">${selecionado.descLonga}</p>
                 </div>`;
    }
    painel.innerHTML = html;
}
window.onload = iniciarApp;

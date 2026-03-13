let DADOS_PLANILHA = [];

let pathSelecionado = null;

let nomeSelecionado = ""; 

let mapaAtivo = 'GSP'; 



const COL = {

    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 

    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 

    P_DE: 9, P_ATE: 10, OBRA: 11, LIMITADOR: 12, 

    REGIAO: 13, CASA_PAULISTA: 14, DOCUMENTOS: 15, 

    DICA: 16, DESC_LONGA: 17, CAMPANHA: 15, // Coluna P é índice 15

    BK_CLI: 24

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

                estoque: colunas[COL.ESTOQUE], // Mantemos original para tratar na função

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

        }).filter(i => i.nome && i.nome.length > 2);



        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);

        if (typeof gerarListaLateral === 'function') gerarListaLateral();

        desenharMapas();

    } catch (e) { console.error("Erro CSV:", e); }

}



// FUNÇÃO DE LÓGICA DE ESTOQUE CENTRALIZADA

function obterHtmlEstoque(valor, tipo) {

    if (tipo === 'N') return "";

    const clean = valor ? valor.toString().toUpperCase().trim() : "";

    

    if (clean === "" || clean === "CONSULTAR") {

        return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;

    }

    if (clean === "VENDIDO" || clean === "0") {

        return `<span class="badge-estoque" style="color:#999; text-decoration: line-through;">VENDIDO</span>`;

    }

    

    const num = parseInt(clean);

    if (!isNaN(num)) {

        const cor = num < 6 ? "#e31010" : "#666";

        return `<span class="badge-estoque" style="color:${cor}">RESTAM ${num} UN.</span>`;

    }

    return `<span class="badge-estoque" style="color:#666">${clean}</span>`;

}



function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {

    const painel = document.getElementById('ficha-tecnica');

    if(!painel) return;

    

    const listaOrdenada = [...listaDaCidade].sort((a, b) => (a.tipo === 'N' ? -1 : 1));

    const listaSuperior = listaOrdenada.filter(i => i.nome !== selecionado.nome);

    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;

    

    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div>`;

    

    html += `<div style="margin-bottom:10px;">${listaSuperior.map(item => {

                const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';

                return `<button class="${classe}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}</button>`;

            }).join('')}</div>`;



    html += `<hr style="border:0; border-top:1px solid #ddd; margin:15px 0 20px 0;">`;



    if (selecionado.tipo === 'R') {

        html += `<div style="width:100%; margin:0; border-radius:4px; height:36px; background-color: #ff8c00; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; border: none;">RES. ${selecionado.nome}</div>`;

        

        html += `<div style="padding: 10px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;



        // FILEIRA 1

        html += `<div style="display: flex; gap: 5px; margin-bottom: 5px;">

                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Região</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.regiao}</span></div>

                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Entrega</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.entrega}</span></div>

                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Obra</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.obra}%</span></div>

                </div>`;



        // FILEIRA 2: PLANTAS | ESTOQUE (50/50)

        html += `<div style="display: flex; gap: 5px; margin-bottom: 5px;">

                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Plantas</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.p_de} até ${selecionado.p_ate}</span></div>

                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Estoque</span><span style="font-size:0.7rem; font-weight:700;">${obterHtmlEstoque(selecionado.estoque, 'R')}</span></div>

                </div>`;



        // FILEIRA 3: LIMITADOR | CASA PAULISTA (50/50)

        html += `<div style="display: flex; gap: 5px; margin-bottom: 5px;">

                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Limitador</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.limitador}</span></div>

                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Casa Paulista</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.casa_paulista}</span></div>

                </div>`;



        // FILEIRA 4: CAMPANHA (Somente se houver dado na coluna P)

        if (selecionado.campanha && selecionado.campanha.trim() !== "") {

            html += `<div style="width: 100%; background: #fff1f1; padding: 8px; border-radius: 4px; text-align: center; border: 1px solid #ffdada; margin-top: 5px;">

                        <span style="color: #e31010; font-weight: 800; font-size: 0.75rem; text-transform: uppercase;">${selecionado.campanha}</span>

                     </div>`;

        }

                

    } else {

        html += `<div class="separador-complexo-btn" style="width:100% !important; margin:0 !important; border-radius:4px 4px 0 0; height:36px !important; pointer-events:none;">${selecionado.nomeFull}</div>`;

        html += `<div style="padding: 10px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;

        const desc = (selecionado.descLonga || "").split('\n').map(p => `<p style="margin-bottom:8px;">${p.trim()}</p>`).join('');

        html += `<div class="box-argumento" style="border-left-color: #00713a; background:#f9f9f9; margin-top:0; border-radius:0 0 4px 4px;"><label>Sobre o Complexo</label>${desc}</div>`;

    }

    

    painel.innerHTML = html;

}



// Funções de Mapa e Interface mantidas conforme original

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



function comandoSelecao(idPath, nomePath, fonte) {

    const idBusca = idPath.toLowerCase().replace(/\s/g, '');

    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);

    if (imoveis.length > 0) {

        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];

        nomeSelecionado = nomePath || selecionado.cidade;

        const tit = document.getElementById('cidade-titulo');

        if(tit) tit.innerText = nomeSelecionado;

        montarVitrine(selecionado, imoveis, nomeSelecionado);

    }

}



function cliqueNoMapa(id, nome, temMRV) { if (temMRV) comandoSelecao(id, nome); }

function hoverNoMapa(nome) { const t = document.getElementById('cidade-titulo'); if(t) t.innerText = nome; }

function resetTitulo() { const t = document.getElementById('cidade-titulo'); if(t) t.innerText = nomeSelecionado || "Selecione uma região"; }

function trocarMapas() { mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; desenharMapas(); limparInterface(); }



Na sequencia vou enviar o style



function limparInterface() {

    nomeSelecionado = ""; pathSelecionado = null;

    const t = document.getElementById('cidade-titulo'); if(t) t.innerText = "Selecione uma região";

    const f = document.getElementById('ficha-tecnica');

    if(f) f.innerHTML = `<div style="text-align:center; color:#ccc; margin-top:100px;"><p style="font-size: 30px;">📍</p><p>Clique em algum Residencial ou em alguma região verde do mapa</p></div>`;

}



iniciarApp();

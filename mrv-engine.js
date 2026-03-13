let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, 
    TIPOLOGIAS_H: 7, // Coluna H (Dados complexos: TIPO, PRECO, CAIXA)
    ENTREGA: 8, P_DE: 9, P_ATE: 10, OBRA: 11, LIMITADOR: 12, 
    REGIAO: 13, CASA_PAULISTA: 14, 
    CAMPANHA: 15, // Coluna P
    DESC_LONGA: 17
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
        const linhas = processarCSV(texto);

        DADOS_PLANILHA = linhas.slice(1).map(col => {
            const catLimpa = col[COL.CATEGORIA] ? col[COL.CATEGORIA].toUpperCase() : "";
            return {
                id_path: col[COL.ID] ? col[COL.ID].toLowerCase().replace(/\s/g, '') : "",
                tipo: catLimpa.includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(col[COL.ORDEM]) || 999,
                nome: col[COL.NOME] || "",
                nomeFull: col[COL.NOME_FULL] || col[COL.NOME] || "",
                cidade: col[COL.ID] || "",
                estoque: col[COL.ESTOQUE],
                endereco: col[COL.END] || "",
                entrega: col[COL.ENTREGA] || "---",
                obra: col[COL.OBRA] || "0",
                regiao: col[COL.REGIAO] || "---",
                p_de: col[COL.P_DE] || "---",
                p_ate: col[COL.P_ATE] || "---",
                limitador: col[COL.LIMITADOR] || "---",
                casa_paulista: col[COL.CASA_PAULISTA] || "---",
                campanha: col[COL.CAMPANHA] || "",
                dadosTipologia: col[COL.TIPOLOGIAS_H] || "",
                descLonga: col[COL.DESC_LONGA] || ""
            };
        }).filter(i => i.nome && i.nome.length > 2);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        desenharMapas();
    } catch (e) { console.error("Erro CSV:", e); }
}

function processarCSV(texto) {
    const resultado = [];
    let linha = [], campo = "", aspas = false;
    for (let i = 0; i < texto.length; i++) {
        const c = texto[i];
        if (c === '"') aspas = !aspas;
        else if (c === ',' && !aspas) { linha.push(campo.trim()); campo = ""; }
        else if ((c === '\n' || c === '\r') && !aspas) {
            if (campo || linha.length > 0) {
                linha.push(campo.trim());
                resultado.push(linha);
            }
            linha = []; campo = "";
        } else { campo += c; }
    }
    return resultado;
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const clean = valor ? valor.toString().toUpperCase().trim() : "";
    if (clean === "" || clean === "CONSULTAR") return `<span style="color:#666">CONSULTAR</span>`;
    if (clean === "VENDIDO" || clean === "0") return `<span style="color:#999; text-decoration: line-through;">VENDIDO</span>`;
    const num = parseInt(clean);
    if (!isNaN(num)) {
        const cor = num < 6 ? "#e31010" : "#666";
        return `<span style="color:${cor}">RESTAM ${num} UN.</span>`;
    }
    return `<span style="color:#666">${clean}</span>`;
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if(!painel) return;
    
    const listaOrdenada = [...listaDaCidade].sort((a, b) => (a.tipo === 'N' ? -1 : 1));
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div>`;
    
    html += `<div style="margin-bottom:10px;">${listaOrdenada.filter(i => i.nome !== selecionado.nome).map(item => {
                const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
                return `<button class="${classe}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}</button>`;
            }).join('')}</div>`;

    html += `<hr style="border:0; border-top:1px solid #ddd; margin:15px 0 20px 0;">`;

    if (selecionado.tipo === 'R') {
        html += `<div style="width:100%; border-radius:4px; height:36px; background-color: #ff8c00; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; text-transform: uppercase;">RES. ${selecionado.nome}</div>`;
        html += `<div style="padding: 10px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;

        // FILEIRAS DE INFORMAÇÃO
        const boxStyle = `flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;`;
        const labelStyle = `color: #00713a; font-weight: bold; font-size: 0.55rem; text-transform: uppercase;`;
        const valorStyle = `font-size: 0.7rem; color: #333; font-weight: 700;`;

        html += `<div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <div style="${boxStyle}"><span style="${labelStyle}">Região</span><span style="${valorStyle}">${selecionado.regiao}</span></div>
                    <div style="${boxStyle}"><span style="${labelStyle}">Entrega</span><span style="${valorStyle}">${selecionado.entrega}</span></div>
                    <div style="${boxStyle}"><span style="${labelStyle}">Obra</span><span style="${valorStyle}">${selecionado.obra}%</span></div>
                </div>`;

        html += `<div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <div style="${boxStyle}"><span style="${labelStyle}">Plantas</span><span style="${valorStyle}">${selecionado.p_de} até ${selecionado.p_ate}</span></div>
                    <div style="${boxStyle}"><span style="${labelStyle}">Estoque</span><span style="${valorStyle}">${obterHtmlEstoque(selecionado.estoque, 'R')}</span></div>
                </div>`;

        html += `<div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <div style="${boxStyle}"><span style="${labelStyle}">Limitador</span><span style="${valorStyle}">${selecionado.limitador}</span></div>
                    <div style="${boxStyle}"><span style="${labelStyle}">Casa Paulista</span><span style="${valorStyle}">${selecionado.casa_paulista}</span></div>
                </div>`;

        // CAMPANHA
        if (selecionado.campanha) {
            html += `<div style="width: 100%; background: #fff1f1; padding: 8px; border-radius: 4px; text-align: center; border: 1px solid #ffdada; margin: 5px 0;">
                        <span style="color: #e31010; font-weight: 800; font-size: 0.75rem; text-transform: uppercase;">${selecionado.campanha}</span>
                     </div>`;
        }

        // TABELA DE TIPOLOGIAS (COLUNA H)
        if (selecionado.dadosTipologia) {
            const linhas = selecionado.dadosTipologia.split(';');
            html += `<table style="width:100%; border-collapse: collapse; background: #f9f9f9; border-radius: 4px; overflow: hidden; margin-top:5px; font-size: 0.75rem;">
                <thead>
                    <tr style="background: #f0f0f0; color: #111; font-weight: bold; text-transform: uppercase; font-size: 0.65rem;">
                        <th style="padding: 8px; border-bottom: 2px solid #ccc;">Tipologia</th>
                        <th style="padding: 8px; background: #ffbc00; border-bottom: 2px solid #ccc;">Menor Preço</th>
                        <th style="padding: 8px; border-bottom: 2px solid #ccc;">Avaliação Caixa</th>
                    </tr>
                </thead>
                <tbody>`;
            
            linhas.forEach(l => {
                const dados = l.split(',');
                if(dados.length >= 3) {
                    html += `<tr style="border-bottom: 1px solid #eee; text-align: center; font-weight: 600;">
                        <td style="padding: 6px;">${dados[0]}</td>
                        <td style="padding: 6px; background: #ffcc00;">${dados[1]}</td>
                        <td style="padding: 6px;">${dados[2]}</td>
                    </tr>`;
                }
            });
            html += `</tbody></table>`;
        }
                
    } else {
        html += `<div class="separador-complexo-btn" style="width:100% !important; margin:0 !important; border-radius:4px 4px 0 0; height:36px !important;">${selecionado.nomeFull}</div>`;
        html += `<div style="padding: 10px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        const d = (selecionado.descLonga || "").split('\n').map(p => `<p style="margin-bottom:8px;">${p.trim()}</p>`).join('');
        html += `<div class="box-argumento" style="border-left-color: #00713a; background:#f9f9f9; border-radius:0 0 4px 4px;"><label>Sobre o Complexo</label>${d}</div>`;
    }
    painel.innerHTML = html;
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    if (imoveis.length > 0) {
        const sel = (fonte && fonte.nome) ? fonte : imoveis[0];
        nomeSelecionado = nomePath || sel.cidade;
        
        // CORREÇÃO DO MAPA:
        if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
        const novoPath = document.querySelector(`[id$="-${idBusca}"]`);
        if (novoPath) { novoPath.classList.add('path-ativo'); pathSelecionado = novoPath; }

        const tit = document.getElementById('cidade-titulo');
        if(tit) tit.innerText = nomeSelecionado;
        montarVitrine(sel, imoveis, nomeSelecionado);
    }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;
    const pathsHtml = dados.paths.map(p => {
        const idBusca = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idBusca);
        const isGSP = p.id.toLowerCase() === "grandesaopaulo";
        const clique = interativo ? (isGSP ? `onclick="trocarMapas()"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        const hover = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        const classe = (temMRV || isGSP) && interativo ? 'commrv' : '';
        return `<path id="${id}-${p.id}" name="${p.name}" d="${p.d}" class="${classe}" ${clique} ${hover}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="width:100%; height:100%;"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
}

function navegarVitrine(nome, reg) { 
    const i = DADOS_PLANILHA.find(x => x.nome === nome); 
    if (i) comandoSelecao(i.id_path, reg, i); 
}
function cliqueNoMapa(id, nome, tem) { if (tem) comandoSelecao(id, nome); }
function hoverNoMapa(nome) { const t = document.getElementById('cidade-titulo'); if(t) t.innerText = nome; }
function resetTitulo() { const t = document.getElementById('cidade-titulo'); if(t) t.innerText = nomeSelecionado || "Selecione uma região"; }
function trocarMapas() { mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; desenharMapas(); limparInterface(); }
function limparInterface() {
    nomeSelecionado = ""; if(pathSelecionado) pathSelecionado.classList.remove('path-ativo'); pathSelecionado = null;
    document.getElementById('cidade-titulo').innerText = "Selecione uma região";
    document.getElementById('ficha-tecnica').innerHTML = `<div style="text-align:center; color:#ccc; margin-top:100px;"><p style="font-size: 30px;">📍</p><p>Clique em algum Residencial ou em alguma região verde do mapa</p></div>`;
}

iniciarApp();

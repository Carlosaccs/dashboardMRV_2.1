let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// Mapeamento atualizado para refletir sua planilha
const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, LIMITADOR: 12, 
    REG: 13, CASA_PAULISTA: 14, DOCUMENTOS: 15, 
    DICA: 16, DESC_LONGA: 17, BK_CLI: 24
};

async function iniciarApp() {
    try {
        await carregarPlanilha();
        if (typeof MAPA_GSP !== 'undefined') desenharMapas();
    } catch (err) { console.error("Erro na inicialização:", err); }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    
    try {
        const response = await fetch(URL_CSV);
        let texto = await response.text();
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
                id_path: colunas[COL.ID]?.toLowerCase().replace(/\s/g, ''),
                tipo: catLimpa.includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
                nome: colunas[COL.NOME] || "",
                nomeFull: colunas[COL.NOME_FULL] || colunas[COL.NOME] || "",
                cidade: colunas[COL.ID] || "",
                estoque: colunas[COL.ESTOQUE] || "0",
                endereco: colunas[COL.END] || "",
                tipologias_raw: colunas[COL.TIPOLOGIAS] || "",
                entrega: colunas[COL.ENTREGA] || "",
                p_de: colunas[COL.P_DE] || "-",
                p_ate: colunas[COL.P_ATE] || "-",
                obra: colunas[COL.OBRA] || "0",
                limitador: colunas[COL.LIMITADOR] || "-",
                reg_mrv: colunas[COL.REG] || "-",
                casa_paulista: colunas[COL.CASA_PAULISTA] || "-",
                documentos: colunas[COL.DOCUMENTOS] || "",
                dica: colunas[COL.DICA] || "",
                descLonga: colunas[COL.DESC_LONGA] || "",
                book: colunas[COL.BK_CLI] || ""
            };
        }).filter(i => i.nome && i.nome.length > 2);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        if (typeof gerarListaLateral === 'function') gerarListaLateral();
    } catch (e) { console.error("Erro CSV:", e); }
}

function renderizarTabelaTipologia(textoBruto) {
    if (!textoBruto || textoBruto === "-") return "";
    const linhas = textoBruto.split(';');
    let html = `<table class="tabela-mrv"><thead><tr><th>TIPOLOGIA</th><th class="laranja">MENOR PREÇO</th><th>AVALIAÇÃO CAIXA</th></tr></thead><tbody>`;
    linhas.forEach(l => {
        const partes = l.split(',');
        if (partes.length >= 3) {
            const f = (v) => isNaN(v.replace('.','')) ? v : parseFloat(v).toLocaleString('pt-br', {style: 'currency', currency: 'BRL', maximumFractionDigits: 0});
            html += `<tr><td>${partes[0].trim()}</td><td class="destaque">${f(partes[1].trim())}</td><td>${f(partes[2].trim())}</td></tr>`;
        }
    });
    return html + `</tbody></table>`;
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if(!painel) return;
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    const listaSuperior = listaDaCidade.filter(i => i.nome !== selecionado.nome);

    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div>`;
    
    // Lista de botões da mesma cidade
    html += `<div style="margin-bottom:10px;">${listaSuperior.map(item => `
        <button class="${item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')">
            <strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}
        </button>`).join('')}</div><hr style="border:0; border-top:1px solid #ddd; margin:15px 0;">`;

    if (selecionado.tipo === 'R') {
        html += `
        <div style="background:var(--mrv-laranja); color:#000; text-align:center; padding:10px; font-weight:bold; border-radius:4px; margin-bottom:10px; font-size:0.9rem;">${selecionado.nomeFull}</div>
        <p style="font-size:0.65rem; color:#444; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a>
        </p>
        
        <div class="info-box"><label>REGIÃO / ENT / OBRA</label><span>${selecionado.reg_mrv} | ${selecionado.entrega} | ${selecionado.obra}%</span></div>
        <div class="info-box"><label>PLANTAS / ESTOQUE</label><span>${selecionado.p_de} até ${selecionado.p_ate} | ${selecionado.estoque} UN.</span></div>
        <div class="info-box"><label>LIMITADOR / C. PAULISTA</label><span>${selecionado.limitador} | ${selecionado.casa_paulista}</span></div>
        
        ${selecionado.documentos ? `<div style="color:var(--vermelho-mrv); font-weight:bold; text-align:center; margin:10px 0; font-size:0.8rem;">${selecionado.documentos}</div>` : ''}
        ${renderizarTabelaTipologia(selecionado.tipologias_raw)}
        ${selecionado.dica ? `<div class="box-argumento box-dica"><label>Dica do Corretor</label><p>${selecionado.dica}</p></div>` : ''}
        
        <a href="${selecionado.book}" target="_blank" class="btRes" style="background:var(--mrv-verde); color:white; justify-content:center; font-weight:bold; margin-top:10px; border:none; width:100% !important; height:40px !important; display:flex; align-items:center; text-decoration:none;">📄 BOOK CLIENTE</a>`;
    } else {
        html += `<div class="separador-complexo-btn" style="width:100% !important; margin:0 !important; border-radius:4px 4px 0 0; cursor:default; height:36px !important;">${selecionado.nomeFull}</div>`;
        html += `<div class="box-argumento" style="background:#f9f9f9; margin-top:0;"><label>Sobre o Complexo</label><p>${selecionado.descLonga}</p></div>`;
    }
    painel.innerHTML = html;
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;
    
    if (!interativo) { container.style.cursor = "pointer"; container.onclick = trocarMapas; }
    
    const pathsHtml = dados.paths.map(p => {
        const idPath = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPath);
        const clique = interativo ? `onclick="comandoSelecao('${p.id}', '${p.name}')"` : "";
        return `<path id="${id}-${p.id}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''

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
        console.log("Iniciando carregamento...");
        await carregarPlanilha();
    } catch (err) { 
        alert("Erro fatal ao iniciar: " + err.message);
    }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    // Forçamos o bypass do cache para garantir dados novos
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&cacheburst=${new Date().getTime()}`;
    
    try {
        const response = await fetch(URL_CSV);
        if (!response.ok) throw new Error("Não foi possível acessar a planilha do Google. Verifique se ela está pública.");
        
        let texto = await response.text();
        const linhasPuras = texto.split(/\r?\n/);
        
        DADOS_PLANILHA = linhasPuras.slice(1).map((linha, index) => {
            const colunas = [];
            let campo = "", aspas = false;
            for (let i = 0; i < linha.length; i++) {
                const char = linha[i];
                if (char === '"') aspas = !aspas;
                else if (char === ',' && !aspas) { colunas.push(campo.trim()); campo = ""; }
                else { campo += char; }
            }
            colunas.push(campo.trim());
            
            const numOrdem = parseInt(colunas[COL.ORDEM]);
            const categoria = (colunas[COL.CATEGORIA] || "").toUpperCase();

            // Filtro rigoroso: precisa ter categoria válida e ordem numérica
            if (isNaN(numOrdem) || (!categoria.includes("RESIDENCIAL") && !categoria.includes("COMPLEXO"))) {
                return null;
            }

            return {
                id_path: colunas[COL.ID] ? colunas[COL.ID].toLowerCase().replace(/\s/g, '') : "",
                tipo: categoria.includes('COMPLEXO') ? 'N' : 'R',
                ordem: numOrdem,
                nome: colunas[COL.NOME] || "Sem Nome",
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

        if (DADOS_PLANILHA.length === 0) {
            alert("Atenção: Nenhum dado válido foi encontrado na planilha. Verifique as colunas de Categoria e Ordem.");
        }

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        
        // Verificação de segurança para os mapas
        if (typeof MAPA_GSP === 'undefined') {
            alert("Erro: O arquivo mrv-data.js não foi carregado ou está com erro.");
            return;
        }

        desenharMapas();
        gerarListaLateral();

    } catch (e) { 
        console.error(e);
        alert("Erro ao ler Planilha: " + e.message);
    }
}

// ... (Restante das funções: gerarListaLateral, navegarVitrine, comandoSelecao, renderizarNoContainer, trocarMapas, etc.)
// Mantenha as funções que enviamos na última versão, apenas garanta que o fechamento das chaves esteja correto.

function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    if (!container) return;
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const classeBase = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        return `<div class="${classeBase} ${ativo}" onclick="navegarVitrine('${item.nome}', '${item.regiao}')">
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
    if (!existeNoMapaAtual) trocarMapas(false);
    comandoSelecao(imovel.id_path, nomeRegiao, imovel); 
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
        document.getElementById('cidade-titulo').innerText = (nomePath || selecionado.regiao).toUpperCase();
        montarVitrine(selecionado, imoveis, (nomePath || selecionado.regiao));
        gerarListaLateral();
    }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;
    const pathsHtml = dados.paths.map(p => {
        const idPathNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPathNorm);
        const ativo = (pathAtivo === idPathNorm && interativo) ? 'ativo' : '';
        const classe = (temMRV || idPathNorm === "grandesaopaulo") && interativo ? `commrv ${ativo}` : '';
        const clique = interativo ? (idPathNorm === "grandesaopaulo" ? `onclick="trocarMapas(true)"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        return `<path id="${id}-${idPathNorm}" name="${p.name}" d="${p.d}" class="${classe}" ${clique}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="width:100%; height:100%;"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
}

function trocarMapas(completo) {
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP';
    if(completo) { pathAtivo = null; imovelAtivo = null; }
    desenharMapas();
    gerarListaLateral();
}

function cliqueNoMapa(id, nome, temMRV) { if (temMRV) comandoSelecao(id, nome); }

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const clean = valor ? valor.toString().toUpperCase().trim() : "";
    if (clean === "VENDIDO" || clean === "0") return `<span style="color:#999; font-size:9px">VENDIDO</span>`;
    return `<span style="color:#666; font-size:9px">${clean}</span>`;
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    // ... (Mantenha sua lógica de montarVitrine aqui)
    painel.innerHTML = html + `<div class="box-argumento"><strong>${selecionado.nome}</strong><p>${selecionado.endereco}</p></div>`;
}

window.onload = iniciarApp;

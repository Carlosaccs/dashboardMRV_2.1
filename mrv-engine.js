let DADOS_PLANILHA = [];
let pathSelecionado = null; 
let imovelAtivoNome = "";    
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, LIMITADOR: 12, 
    REGIAO: 13, CASA_PAULISTA: 14, DOCUMENTOS: 15, 
    DICA: 16, DESC_LONGA: 17, CAMPANHA: 15, 
    BK_CLI: 24
};

async function iniciarApp() {
    try {
        // Primeiro desenha o mapa vazio (ou carregando)
        if (typeof MAPA_GSP !== 'undefined') desenharMapas();
        // Carrega os dados
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
        }).filter(i => i.nome && i.nome.length > 2);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        
        // APÓS CARREGAR: Gera a lista e atualiza o mapa com as cores verdes
        gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro CSV:", e); }
}

function gerarListaLateral() {
    const container = document.querySelector('.sidebar-esq');
    if (!container) return;
    
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
        // Se o nome do residencial for o que está ativo, coloca a classe 'ativo'
        const ativoClass = (item.nome === imovelAtivoNome) ? 'ativo' : '';
        
        return `<div class="${classe} ${ativoClass}" onclick="navegarVitrine('${item.nome}', '${item.regiao}')">
                    <strong>${item.nome}</strong>
                    ${item.tipo === 'R' ? obterHtmlEstoque(item.estoque, 'R') : ''}
                </div>`;
    }).join('');
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const clean = valor ? valor.toString().toUpperCase().trim() : "";
    if (clean === "" || clean === "CONSULTAR") return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    if (clean === "VENDIDO" || clean === "0") return `<span class="badge-estoque" style="color:#999; text-decoration: line-through;">VENDIDO</span>`;
    const num = parseInt(clean);
    if (!isNaN(num)) {
        const cor = num < 6 ? "#e31010" : "#666";
        return `<span class="badge-estoque" style="color:${cor}">RESTAM ${num} UN.</span>`;
    }
    return `<span class="badge-estoque" style="color:#666">${clean}</span>`;
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    
    // Atualiza os estados globais
    pathSelecionado = idBusca; 
    imovelAtivoNome = (fonte && fonte.nome) ? fonte.nome : (imoveis[0] ? imoveis[0].nome : "");

    if (imoveis.length > 0)

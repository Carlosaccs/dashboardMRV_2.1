// MODIFICAÇÃO 1: comandoSelecao agora lida com os destaques visuais
function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    
    // 1. Destaque no Mapa
    document.querySelectorAll('path').forEach(p => p.classList.remove('ativo'));
    const pathMapa = document.getElementById(`caixa-a-${idBusca}`);
    if (pathMapa) pathMapa.classList.add('ativo');

    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];
        nomeSelecionado = nomePath || selecionado.cidade;
        pathSelecionado = idBusca; // Salva para manter o estado

        const tit = document.getElementById('cidade-titulo');
        if(tit) tit.innerText = nomeSelecionado;
        
        montarVitrine(selecionado, imoveis, nomeSelecionado);
    }
}

// MODIFICAÇÃO 2: montarVitrine com a estrutura de Scroll e Destaque nos Botões
function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if(!painel) return;
    
    const listaOrdenada = [...listaDaCidade].sort((a, b) => (a.tipo === 'N' ? -1 : 1));
    const listaSuperior = listaOrdenada.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    // Título Fixo (Laranja)
    let html = `<div class="vitrine-topo" style="flex-shrink:0;">MRV EM ${nomeRegiao.toUpperCase()}</div>`;
    
    // Início da área que rola
    html += `<div class="vitrine-scroll" style="padding: 15px;">`;

    // Botões dos outros residenciais (Destaque nos botões)
    html += `<div style="margin-bottom:10px;">${listaSuperior.map(item => {
                const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
                // Verifica se este item é o que está "ativo" no momento (se não houver um selecionado principal)
                return `<button class="${classe}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}</button>`;
            }).join('')}</div>`;

    html += `<hr style="border:0; border-top:1px solid #ddd; margin:15px 0 20px 0;">`;

    if (selecionado.tipo === 'R') {
        // Título do Residencial Ativo
        html += `<div style="width:100%; margin:0; border-radius:4px; height:36px; background-color: #ff8c00; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; border: none;">RES. ${selecionado.nome}</div>`;
        
        html += `<div style="padding: 10px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;

        // FILEIRAS DE DADOS (Mantidas)
        html += `<div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Região</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.regiao}</span></div>
                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Entrega</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.entrega}</span></div>
                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Obra</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.obra}%</span></div>
                </div>`;

        html += `<div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Plantas</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.p_de} até ${selecionado.p_ate}</span></div>
                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Estoque</span><span style="font-size:0.7rem; font-weight:700;">${obterHtmlEstoque(selecionado.estoque, 'R')}</span></div>
                </div>`;

        html += `<div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Limitador</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.limitador}</span></div>
                    <div style="flex: 1; background: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5;"><span style="color:#00713a; font-weight:bold; font-size:0.55rem; text-transform:uppercase;">Casa Paulista</span><span style="font-size:0.7rem; color:#333; font-weight:700;">${selecionado.casa_paulista}</span></div>
                </div>`;

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
    
    html += `</div>`; // Fechamento da div vitrine-scroll
    painel.innerHTML = html;
}

// MODIFICAÇÃO 3: renderizarNoContainer mantém o ID correto para o destaque
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
        
        // Verifica se este path é o que está selecionado atualmente para manter a cor laranja
        const extraClass = (pathSelecionado === idPathNormalizado && interativo) ? 'ativo' : '';
        const mrvClass = (temMRV || isGSP) && interativo ? 'commrv' : '';
        
        return `<path id="${id}-${idPathNormalizado}" name="${p.name}" d="${p.d}" class="${mrvClass} ${extraClass}" ${clique} ${hover}></path>`;
    }).join('');
    
    const zoomStyle = interativo ? 'style="transform: scale(1.15); transform-origin: center; width: 100%; height: 100%;"' : 'style="width: 100%; height: 100%;"';
    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet" ${zoomStyle}><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

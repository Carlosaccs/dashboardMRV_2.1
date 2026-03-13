function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if(!painel) return;
    
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    // REGRA: Complexos (tipo 'N') sobem para o topo, seguidos pelos outros botões
    const listaOrdenada = [...listaDaCidade].sort((a, b) => (a.tipo === 'N' ? -1 : 1));
    const listaBotoesSuperior = listaOrdenada.filter(i => i.nome !== selecionado.nome);
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div>`;
    
    // 1. Gera os botões acima (Complexos pretos e Residenciais brancos)
    html += `<div style="margin-bottom:10px;">${listaBotoesSuperior.map(item => {
                const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
                return `<button class="${classe}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong> ${item.tipo === 'R' ? obterHtmlEstoque(item.estoque, item.tipo) : ''}</button>`;
            }).join('')}</div>`;

    // 2. Linha separadora (HR) idêntica à que você já usa
    html += `<hr style="border:0; border-top:1px solid #ddd; margin:15px 0 20px 0;">`;

    if (selecionado.tipo === 'R') {
        // --- CENÁRIO RESIDENCIAL SELECIONADO ---
        
        // 3. Faixa Laranja (Mesma estrutura da preta, mas com cor laranja e texto escuro)
        html += `<div class="separador-complexo-btn" style="width:100% !important; margin:0 !important; border-radius:4px; cursor:default; height:36px !important; background-color: var(--mrv-laranja) !important; color: var(--texto-escuro) !important; text-shadow: none !important; border: none !important;">RES. ${selecionado.nome.toUpperCase()}</div>`;
        
        // 4. Endereço e Botão MAPS (Igual ao do Complexo)
        html += `<div style="padding: 10px 0;">
                    <p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;">
                        <span>📍 ${selecionado.endereco}</span>
                        <a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a>
                    </p>
                 </div>`;
        
        // Paramos aqui para validação, conforme solicitado.
        
    } else {
        // --- CENÁRIO COMPLEXO SELECIONADO (Mantém o que já funcionava) ---
        html += `<div class="separador-complexo-btn" style="width:100% !important; margin:0 !important; border-radius:4px 4px 0 0; cursor:default; height:36px !important; pointer-events:none;">${selecionado.nomeFull}</div>`;
        html += `<div style="padding: 10px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        const desc = (selecionado.descLonga || "").split('\n').map(p => `<p style="margin-bottom:8px;">${p.trim()}</p>`).join('');
        html += `<div class="box-argumento" style="border-left-color: var(--mrv-verde); background:#f9f9f9; margin-top:0; border-radius:0 0 4px 4px;"><label>Sobre o Complexo</label>${desc}</div>`;
    }
    
    painel.innerHTML = html;
}

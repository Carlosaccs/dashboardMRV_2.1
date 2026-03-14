:root {
    --mrv-verde: #00713a;
    --mrv-laranja: #ff8c00;
    --mrv-preto: #333;
    --vermelho-mrv: #e31010;
    --cinza-claro: #f4f4f4;
    --cinza-divisor: #ccc;
    --cinza-mapa: #777;
}

/* Reset e Layout Base */
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
body { display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: white; }

.header { 
    background-color: var(--mrv-verde) !important; color: white !important; 
    height: 60px !important; line-height: 60px !important; 
    font-size: 1.6rem !important; font-weight: bold !important; text-align: center;
    flex-shrink: 0;
}

.wrapper { display: flex; flex: 1; height: calc(100vh - 60px); overflow: hidden; }

/* Lateral Esquerda - Lista */
.sidebar-esq { width: 280px; border-right: 1px solid #ddd; overflow-y: auto; padding: 10px 0; background: #f8f9fa; flex-shrink: 0; }

.btRes, .separador-complexo-btn {
    width: 92% !important; margin: 4px auto !important; min-height: 28px;
    display: flex !important; align-items: center !important; padding: 4px 8px !important;
    border-radius: 4px; font-size: 0.72rem; cursor: pointer; border: 1px solid #ddd; 
    text-decoration: none; transition: 0.1s;
}

.separador-complexo-btn { background: #333 !important; color: white !important; justify-content: center !important; font-weight: bold; text-transform: uppercase; border: none !important; }

.btRes { background: #fff; border-left: 4px solid var(--mrv-verde) !important; justify-content: space-between; color: #333; }
.btRes:hover { background-color: #f0f0f0 !important; border: 1px solid var(--mrv-verde) !important; }
.btRes.ativo { background-color: var(--mrv-laranja) !important; color: white !important; border: 1px solid var(--mrv-laranja) !important; }

/* Centro - Mapas */
.conteudo-centro { flex: 1; display: flex; flex-direction: column; background: #fff; overflow: hidden; }
#cidade-titulo { background: #eee; padding: 4px; text-align: center; font-weight: bold; font-size: 0.85rem; color: #555; height: 30px; display: flex; align-items: center; justify-content: center; text-transform: uppercase; }
#caixa-a { flex: 2; display: flex; align-items: center; justify-content: center; padding: 10px; overflow: hidden; }
#caixa-b { flex: 0.8; display: flex; align-items: center; justify-content: center; padding: 5px; border-top: 2px solid #eee; cursor: pointer; background: #fff; min-height: 120px; }

svg { width: 100%; height: 100%; }
path { fill: var(--cinza-mapa); stroke: #fff; stroke-width: 0.8; transition: fill 0.1s; }
path:hover { fill: #999 !important; cursor: pointer; }
path.commrv { fill: var(--mrv-verde) !important; }
path.commrv:hover, path.ativo { fill: var(--mrv-laranja) !important; stroke: #000 !important; stroke-width: 1.2px !important; }

/* Lateral Direita - Vitrine */
.sidebar-dir { width: 480px; border-left: 1px solid #ddd; overflow-y: auto; padding: 10px; flex-shrink: 0; }
.vitrine-topo { background: var(--mrv-verde); color: white; padding: 6px; text-align: center; font-weight: bold; border-radius: 4px; margin-bottom: 6px; font-size: 0.85rem; text-transform: uppercase; }
.titulo-vitrine-faixa { display: block !important; width: 100% !important; height: 32px !important; line-height: 32px !important; font-weight: bold !important; font-size: 0.85rem !important; border-radius: 4px; text-transform: uppercase; color: #fff; text-align: center; margin-bottom: 6px; }
.faixa-laranja { background: var(--mrv-laranja) !important; }
.faixa-preta { background: var(--mrv-preto) !important; }

/* --- CARDS DE MATERIAIS COM MINIATURA --- */
.card-material-item {
    display: flex; justify-content: space-between; align-items: center;
    background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
    padding: 10px 15px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card-material-left { display: flex; align-items: center; gap: 10px; flex: 1; }
.card-text { font-size: 0.75rem; font-weight: 600; color: #333; }

.container-abrir-preview { position: relative; display: inline-block; }

.preview-hover-box {
    display: none; position: absolute; bottom: 120%; right: 0;
    width: 250px; height: 180px; background: white;
    border: 3px solid var(--mrv-verde); border-radius: 12px;
    overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 1000; pointer-events: none;
}

.card-btn-abrir:hover + .preview-hover-box { display: block; }

.preview-hover-box iframe { width: 100%; height: 100%; border: none; }

.card-material-right { display: flex; gap: 8px; }
.card-btn-abrir, .card-btn-copiar {
    padding: 7px 16px; font-size: 0.7rem; font-weight: bold; border-radius: 6px;
    text-decoration: none; border: none; cursor: pointer; color: #fff;
}
.card-btn-abrir { background: var(--mrv-verde); }
.card-btn-copiar { background: var(--mrv-laranja); }

/* Grid e Boxes de Diferenciais */
.grid-infos { display: table !important; width: 100% !important; table-layout: fixed !important; border-spacing: 2px !important; margin-bottom: 2px; }
.row-infos { display: table-row; }
.box-argumento { display: table-cell !important; width: 50% !important; padding: 4px 8px !important; border-radius: 4px; border-left: 4px solid #ddd; background: #f9f9f9; vertical-align: middle; height: 32px !important; }
.box-inner { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.box-argumento label { font-size: 0.55rem; font-weight: bold; text-transform: uppercase; color: var(--mrv-verde); }
.box-argumento strong { font-size: 0.65rem; color: #333; }
.box-campanha { color: var(--vermelho-mrv) !important; font-weight: bold !important; font-size: 0.68rem !important; border-left: 4px solid var(--vermelho-mrv) !important; text-align: center; }

/* Tabelas */
.tabela-precos-container { width: 100%; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; margin-top: 8px; }
.tabela-header { background: #eee; font-weight: bold; font-size: 0.6rem; display: flex; }
.tabela-row { display: flex; border-top: 1px solid #eee; font-size: 0.65rem; background: #fff; }
.col-tabela { flex: 1; padding: 6px; text-align: center; border-right: 1px solid #eee; }
.col-laranja { background: var(--mrv-laranja) !important; color: #fff !important; font-weight: bold; }
.btn-maps { background: #4285F4; color: white !important; padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; text-decoration: none; font-weight: bold; }

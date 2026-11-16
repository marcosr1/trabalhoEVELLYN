// Controle de estoque e faturamento - TechStock
// Dados ficam no localStorage do navegador (sem backend).

const CHAVE_STORAGE = 'techstock-v1';
const CATEGORIAS = ['Computadores', 'Notebooks', 'Periféricos', 'Peças', 'Redes', 'Acessórios'];
const LIMITE_MOVIMENTOS = 50;
const ABAS = {
  painel: 'Painel',
  faturamento: 'Faturamento',
  produtos: 'Produtos',
  movimentacoes: 'Movimentações'
};
const TIPOS = { entrada: 'Entrada', venda: 'Venda', saida: 'Saída' };

function estadoInicial() {
  return {
    produtos: [
      { id: 1, sku: 'PC-001', nome: 'Computador Gamer Ryzen 5', categoria: 'Computadores', quantidade: 4,  minimo: 2, custo: 3500.00, preco: 4599.90, local: 'Galpão A1', foto: 'Fotos/PC Gamer Flagship Valkyrie Olympus Extreme 4K.jpg' },
      { id: 2, sku: 'NB-001', nome: 'Notebook 15" i7 16GB',     categoria: 'Notebooks',    quantidade: 1,  minimo: 3, custo: 3000.00, preco: 3899.00, local: 'Galpão A2', foto: '' },
      { id: 3, sku: 'PF-001', nome: 'Teclado Mecânico RGB',     categoria: 'Periféricos',  quantidade: 15, minimo: 5, custo: 220.00,  preco: 299.90,  local: 'Prateleira B1', foto: 'Fotos/Teclado Magnético Gamer Aether Labs Pulse 60 HE Pro Rapid Trigger.jpg' },
      { id: 4, sku: 'PF-002', nome: 'Mouse Gamer 16000 DPI',    categoria: 'Periféricos',  quantidade: 3,  minimo: 5, custo: 100.00,  preco: 149.90,  local: 'Prateleira B1', foto: 'Fotos/Mouse Gamer Sem Fio Aether Labs FeatherLight X Pro 8K Carbon.jpg' },
      { id: 5, sku: 'PC-010', nome: 'Placa de Vídeo 8GB',       categoria: 'Peças',        quantidade: 2,  minimo: 1, custo: 1500.00, preco: 1899.00, local: 'Armário C1', foto: '' },
      { id: 6, sku: 'PC-011', nome: 'SSD NVMe 1TB',             categoria: 'Peças',        quantidade: 20, minimo: 6, custo: 300.00,  preco: 399.90,  local: 'Armário C2', foto: '' }
    ],
    movimentos: []
  };
}

function carregar() {
  try {
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    if (salvo) {
      const dadosSalvos = JSON.parse(salvo);
      dadosSalvos.produtos.forEach((p) => {
        if (p.foto === undefined) p.foto = '';
        if (p.preco === undefined) p.preco = p.custo; // dados antigos sem preço de venda
      });
      dadosSalvos.movimentos.forEach((m) => {
        if (m.tipo === 'saida' && m.valor === undefined) m.valor = 0;
      });
      return dadosSalvos;
    }
  } catch (e) {
    // localStorage indisponível ou dados corrompidos: começa do estado inicial
  }
  return estadoInicial();
}

function salvar() {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
    return true;
  } catch (e) {
    // Cota excedida (fotos grandes demais) ou storage bloqueado
    alert('Não foi possível salvar os dados no navegador. Tente uma foto menor ou remova algumas fotos.');
    return false;
  }
}

let dados = carregar();

// Utilitários
const $ = (id) => document.getElementById(id);

function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function fmtMoeda(valor) {
  return 'R$ ' + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR');
}

// Caminho relativo (ex.: Fotos/arquivo.jpg) precisa de encodeURI por causa de espaços e acentos
function srcFoto(foto) {
  if (!foto) return '';
  return foto.startsWith('data:') || foto.startsWith('http') ? foto : encodeURI(foto);
}

const estaBaixo = (p) => p.quantidade <= p.minimo;

function proximoId() {
  return dados.produtos.reduce((maior, p) => Math.max(maior, p.id), 0) + 1;
}

function produtoPorId(id) {
  return dados.produtos.find((p) => p.id === id);
}

// Navegação por abas (menu lateral)
function mostrarAba(nome) {
  const aba = ABAS[nome] ? nome : 'painel';
  document.querySelectorAll('.aba').forEach((s) => { s.hidden = s.id !== aba; });
  document.querySelectorAll('.menu-lateral a').forEach((a) => {
    a.classList.toggle('ativo', a.dataset.aba === aba);
  });
  $('titulo-aba').textContent = ABAS[aba];
  window.scrollTo(0, 0);
}

// Renderização
function preencherCategorias() {
  const opcoes = CATEGORIAS.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  $('filtro-categoria').innerHTML = `<option value="">Todas as categorias</option>${opcoes}`;
  $('prod-categoria').innerHTML = opcoes;
}

function renderPainel() {
  const unidades = dados.produtos.reduce((s, p) => s + p.quantidade, 0);
  const valor = dados.produtos.reduce((s, p) => s + p.quantidade * p.custo, 0);
  const baixos = dados.produtos.filter(estaBaixo);

  $('kpi-produtos').textContent = dados.produtos.length;
  $('kpi-unidades').textContent = unidades;
  $('kpi-valor').textContent = fmtMoeda(valor);
  $('kpi-baixo').textContent = baixos.length;

  $('lista-baixo').innerHTML = baixos.length
    ? baixos.map((p) => `<li>${esc(p.nome)} (${esc(p.sku)}): ${p.quantidade} un., mínimo ${p.minimo}</li>`).join('')
    : '<li>Nenhum produto abaixo do estoque mínimo.</li>';

  const recentes = dados.movimentos.slice(0, 5);
  $('lista-recentes').innerHTML = recentes.length
    ? recentes.map((m) => `<li>${esc(fmtDataHora(m.data))} · ${TIPOS[m.tipo]} de ${m.quantidade} un. · ${esc(m.produtoNome)}</li>`).join('')
    : '<li>Nenhuma movimentação registrada.</li>';
}

// Faturamento
function vendasNoPeriodo() {
  const dias = Number($('fat-periodo').value);
  const corte = dias ? Date.now() - dias * 86400000 : 0;
  return dados.movimentos.filter((m) => m.tipo === 'venda' && new Date(m.data).getTime() >= corte);
}

// Gráfico em plano cartesiano (SVG): eixo X = dias, eixo Y = faturamento em R$
function desenharPlanoCartesiano(pontos) {
  const W = 600, H = 280;
  const ML = 80, MR = 20, MT = 20, MB = 44;
  const pw = W - ML - MR;
  const ph = H - MT - MB;
  const maxY = Math.max(...pontos.map((p) => p.total), 1) * 1.1;
  const n = pontos.length;

  const x = (i) => ML + (n > 1 ? (i / (n - 1)) * pw : pw / 2);
  const y = (v) => MT + ph - (v / maxY) * ph;
  const rotuloY = (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

  // Linhas de grade e valores do eixo Y
  let grade = '';
  for (let k = 0; k <= 4; k++) {
    const valor = (maxY * k) / 4;
    const py = y(valor).toFixed(1);
    grade += `<line x1="${ML}" y1="${py}" x2="${W - MR}" y2="${py}" class="grade"/>`;
    grade += `<text x="${ML - 8}" y="${py}" class="eixo-valor" text-anchor="end" dominant-baseline="middle">${esc(rotuloY(valor))}</text>`;
  }

  // Eixos
  const eixos = `
    <line x1="${ML}" y1="${MT}" x2="${ML}" y2="${MT + ph}" class="eixo"/>
    <line x1="${ML}" y1="${MT + ph}" x2="${W - MR}" y2="${MT + ph}" class="eixo"/>`;

  // Rótulos do eixo X
  const rotulosX = pontos.map((p, i) =>
    `<text x="${x(i).toFixed(1)}" y="${MT + ph + 18}" class="eixo-valor" text-anchor="middle">${esc(p.rotulo)}</text>`
  ).join('');

  // Linha e pontos
  const coords = pontos.map((p, i) => `${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(' ');
  const linha = `<polyline points="${coords}" class="serie"/>`;
  const marcas = pontos.map((p, i) => `
    <circle cx="${x(i).toFixed(1)}" cy="${y(p.total).toFixed(1)}" r="5" class="ponto">
      <title>${esc(p.rotulo)}: ${esc(fmtMoeda(p.total))}</title>
    </circle>
    ${p.total > 0 ? `<text x="${x(i).toFixed(1)}" y="${(y(p.total) - 10).toFixed(1)}" class="valor-ponto" text-anchor="middle">${esc(fmtMoeda(p.total))}</text>` : ''}`
  ).join('');

  return `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de faturamento dos últimos 7 dias" class="plano">
      ${grade}
      ${eixos}
      ${linha}
      ${marcas}
      ${rotulosX}
    </svg>`;
}

function renderFaturamento() {
  const vendas = vendasNoPeriodo();
  const faturamento = vendas.reduce((s, m) => s + m.valor, 0);
  const lucro = vendas.reduce((s, m) => s + (m.valor - m.quantidade * m.custoUnitario), 0);
  const ticket = vendas.length ? faturamento / vendas.length : 0;

  $('fat-total').textContent = fmtMoeda(faturamento);
  $('fat-vendas').textContent = vendas.length;
  $('fat-ticket').textContent = fmtMoeda(ticket);
  $('fat-lucro').textContent = fmtMoeda(lucro);

  // Gráfico: faturamento dos últimos 7 dias (independe do filtro)
  const diasGrafico = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date();
    dia.setHours(0, 0, 0, 0);
    dia.setDate(dia.getDate() - i);
    const total = dados.movimentos
      .filter((m) => m.tipo === 'venda' && new Date(m.data).toDateString() === dia.toDateString())
      .reduce((s, m) => s + m.valor, 0);
    diasGrafico.push({
      rotulo: dia.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      total
    });
  }
  $('grafico-dias').innerHTML = desenharPlanoCartesiano(diasGrafico);

  // Top 5 produtos por faturamento no período
  const porProduto = {};
  vendas.forEach((m) => {
    const item = porProduto[m.produtoId] || (porProduto[m.produtoId] = { nome: m.produtoNome, quantidade: 0, valor: 0 });
    item.quantidade += m.quantidade;
    item.valor += m.valor;
  });
  const top = Object.values(porProduto).sort((a, b) => b.valor - a.valor).slice(0, 5);
  $('top-produtos').innerHTML = top.length
    ? top.map((p) => `<li>${esc(p.nome)} · ${p.quantidade} un. · ${fmtMoeda(p.valor)}</li>`).join('')
    : '<li>Nenhuma venda no período.</li>';
}

function renderProdutos() {
  const termo = $('busca').value.trim().toLowerCase();
  const categoria = $('filtro-categoria').value;

  const lista = dados.produtos.filter((p) =>
    (!categoria || p.categoria === categoria) &&
    (!termo || [p.nome, p.sku, p.local].some((v) => String(v ?? '').toLowerCase().includes(termo)))
  );

  $('grid-produtos').innerHTML = lista.length
    ? lista.map((p) => {
        const imagem = p.foto
          ? `<img src="${esc(srcFoto(p.foto))}" alt="${esc(p.nome)}" loading="lazy">`
          : '<span>Sem foto</span>';
        return `
        <article class="card-produto ${estaBaixo(p) ? 'card-alerta' : ''}">
          <div class="foto-card">${imagem}</div>
          <div class="corpo-card">
            <p class="sku">${esc(p.sku)} · ${esc(p.categoria)}</p>
            <h3>${esc(p.nome)}</h3>
            <p class="detalhe">Local: ${esc(p.local || '—')}</p>
            <p class="detalhe">Custo: ${fmtMoeda(p.custo)} · Venda: ${fmtMoeda(p.preco)}</p>
            <p class="detalhe">Mínimo: ${p.minimo}</p>
            <p class="quantidade ${estaBaixo(p) ? 'texto-alerta' : ''}">${p.quantidade} un. em estoque${estaBaixo(p) ? ' · reposição' : ''}</p>
          </div>
          <div class="acoes">
            <button data-acao="venda" data-id="${p.id}">Venda</button>
            <button data-acao="entrada" data-id="${p.id}">Entrada</button>
            <button data-acao="saida" data-id="${p.id}">Saída</button>
            <button data-acao="editar" data-id="${p.id}">Editar</button>
            <button data-acao="excluir" data-id="${p.id}" class="perigo">Excluir</button>
          </div>
        </article>`;
      }).join('')
    : '<p class="vazio">Nenhum produto encontrado.</p>';
}

function renderSelectProdutos() {
  const atual = $('mov-produto').value;
  $('mov-produto').innerHTML = dados.produtos
    .map((p) => `<option value="${p.id}">${esc(p.sku)} · ${esc(p.nome)} (${p.quantidade} un.)</option>`)
    .join('');
  if (atual && produtoPorId(Number(atual))) $('mov-produto').value = atual;
}

function renderMovimentos() {
  const recentes = dados.movimentos.slice(0, LIMITE_MOVIMENTOS);
  $('corpo-movimentos').innerHTML = recentes.length
    ? recentes.map((m) => `
      <tr>
        <td>${esc(fmtDataHora(m.data))}</td>
        <td>${esc(m.produtoNome)}</td>
        <td><span class="tag tag-${m.tipo}">${TIPOS[m.tipo]}</span></td>
        <td class="num">${m.quantidade}</td>
        <td class="num">${m.tipo === 'venda' ? fmtMoeda(m.valor) : '—'}</td>
        <td>${esc(m.observacao)}</td>
      </tr>`).join('')
    : '<tr><td colspan="6">Nenhuma movimentação registrada.</td></tr>';
}

function renderTudo() {
  renderPainel();
  renderFaturamento();
  renderProdutos();
  renderSelectProdutos();
  renderMovimentos();
}

// Foto do produto
function atualizarPreviewFoto(foto) {
  const preview = $('prod-preview');
  if (foto) {
    preview.innerHTML = `<img src="${esc(srcFoto(foto))}" alt="Prévia da foto">`;
  } else {
    preview.textContent = 'Sem foto';
  }
  $('prod-foto').value = foto && !foto.startsWith('data:') ? foto : '';
  $('prod-foto').dataset.dataurl = foto && foto.startsWith('data:') ? foto : '';
}

// Reduz a imagem para caber no localStorage (máx. 600px, JPEG)
function comprimirImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = reject;
    leitor.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const escala = Math.min(1, 600 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

// Ações de produto
function abrirFormularioProduto(produto) {
  const editando = Boolean(produto);
  $('titulo-produto').textContent = editando ? 'Editar produto' : 'Novo produto';
  $('prod-id').value = editando ? produto.id : '';
  $('prod-sku').value = editando ? produto.sku : '';
  $('prod-nome').value = editando ? produto.nome : '';
  $('prod-categoria').value = editando ? produto.categoria : CATEGORIAS[0];
  $('prod-quantidade').value = editando ? produto.quantidade : 0;
  $('prod-quantidade').disabled = editando; // quantidade só muda por movimentação
  $('prod-minimo').value = editando ? produto.minimo : 0;
  $('prod-custo').value = editando ? produto.custo : 0;
  $('prod-preco').value = editando ? produto.preco : 0;
  $('prod-local').value = editando ? (produto.local ?? '') : '';
  $('prod-arquivo').value = '';
  atualizarPreviewFoto(editando ? produto.foto : '');
  $('dialog-produto').showModal();
}

function fotoAtualDoFormulario() {
  return $('prod-foto').dataset.dataurl || $('prod-foto').value.trim();
}

function salvarProduto(evento) {
  evento.preventDefault();
  const id = $('prod-id').value ? Number($('prod-id').value) : null;
  const sku = $('prod-sku').value.trim();

  const skuUsado = dados.produtos.some((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== id);
  if (skuUsado) {
    alert('Já existe um produto com este SKU.');
    return;
  }

  const campos = {
    sku,
    nome: $('prod-nome').value.trim(),
    categoria: $('prod-categoria').value,
    minimo: Math.max(0, Math.floor(Number($('prod-minimo').value))),
    custo: Math.max(0, Number($('prod-custo').value)),
    preco: Math.max(0, Number($('prod-preco').value)),
    local: $('prod-local').value.trim(),
    foto: fotoAtualDoFormulario()
  };

  const anterior = dados.produtos.map((p) => ({ ...p }));

  if (id) {
    Object.assign(produtoPorId(id), campos);
  } else {
    const quantidadeInicial = Math.max(0, Math.floor(Number($('prod-quantidade').value)));
    const novo = { id: proximoId(), ...campos, quantidade: quantidadeInicial };
    dados.produtos.push(novo);
    if (quantidadeInicial > 0) {
      registrarMovimento(novo, 'entrada', quantidadeInicial, 'Estoque inicial');
    }
  }

  if (!salvar()) {
    dados.produtos = anterior;
    return;
  }
  $('dialog-produto').close();
  renderTudo();
}

function excluirProduto(id) {
  const produto = produtoPorId(id);
  if (!produto) return;
  if (!confirm(`Excluir "${produto.nome}"? O histórico de movimentações será mantido.`)) return;
  dados.produtos = dados.produtos.filter((p) => p.id !== id);
  salvar();
  renderTudo();
}

// Movimentações
// Venda registra o valor pelo preço de venda do momento e o custo, para calcular o lucro.
function registrarMovimento(produto, tipo, quantidade, observacao) {
  const venda = tipo === 'venda';
  dados.movimentos.unshift({
    id: Date.now() + Math.random(),
    data: new Date().toISOString(),
    produtoId: produto.id,
    produtoNome: produto.nome,
    tipo,
    quantidade,
    valor: venda ? quantidade * produto.preco : 0,
    custoUnitario: produto.custo,
    observacao: observacao || ''
  });
}

function movimentar(evento) {
  evento.preventDefault();
  const produto = produtoPorId(Number($('mov-produto').value));
  const tipo = $('mov-tipo').value;
  const quantidade = Math.floor(Number($('mov-quantidade').value));
  const observacao = $('mov-obs').value.trim();

  if (!produto) return alert('Selecione um produto.');
  if (!(quantidade > 0)) return alert('Informe uma quantidade maior que zero.');

  if (tipo !== 'entrada' && quantidade > produto.quantidade) {
    return alert(`Quantidade maior que o estoque disponível (${produto.quantidade} un.).`);
  }

  produto.quantidade += tipo === 'entrada' ? quantidade : -quantidade;
  registrarMovimento(produto, tipo, quantidade, observacao);

  salvar();
  $('form-movimento').reset();
  renderTudo();
}

function preencherMovimento(id, tipo) {
  mostrarAba('movimentacoes');
  history.replaceState(null, '', '#movimentacoes');
  $('mov-produto').value = id;
  $('mov-tipo').value = tipo;
  $('mov-quantidade').focus();
}

// Eventos
$('novo-produto').addEventListener('click', () => abrirFormularioProduto(null));
$('cancelar-produto').addEventListener('click', () => $('dialog-produto').close());
$('form-produto').addEventListener('submit', salvarProduto);
$('form-movimento').addEventListener('submit', movimentar);
$('busca').addEventListener('input', renderProdutos);
$('filtro-categoria').addEventListener('change', renderProdutos);
$('fat-periodo').addEventListener('change', renderFaturamento);

$('prod-foto').addEventListener('input', () => {
  $('prod-foto').dataset.dataurl = '';
  const valor = $('prod-foto').value.trim();
  atualizarPreviewFoto(valor);
  $('prod-foto').value = valor;
});

$('prod-arquivo').addEventListener('change', async () => {
  const arquivo = $('prod-arquivo').files[0];
  if (!arquivo) return;
  try {
    const dataUrl = await comprimirImagem(arquivo);
    $('prod-foto').value = '';
    $('prod-foto').dataset.dataurl = dataUrl;
    atualizarPreviewFoto(dataUrl);
  } catch (e) {
    alert('Não foi possível carregar esta imagem.');
  }
});

$('remover-foto').addEventListener('click', () => {
  $('prod-arquivo').value = '';
  atualizarPreviewFoto('');
});

document.querySelectorAll('.menu-lateral a').forEach((a) => {
  a.addEventListener('click', (evento) => {
    evento.preventDefault();
    mostrarAba(a.dataset.aba);
    history.replaceState(null, '', '#' + a.dataset.aba);
  });
});

$('grid-produtos').addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;
  const id = Number(botao.dataset.id);
  const acao = botao.dataset.acao;

  if (acao === 'editar') abrirFormularioProduto(produtoPorId(id));
  if (acao === 'excluir') excluirProduto(id);
  if (acao === 'entrada') preencherMovimento(id, 'entrada');
  if (acao === 'saida') preencherMovimento(id, 'saida');
  if (acao === 'venda') preencherMovimento(id, 'venda');
});

preencherCategorias();
renderTudo();
mostrarAba(location.hash.replace('#', '') || 'painel');

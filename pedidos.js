document.addEventListener('DOMContentLoaded', () => {
    fetchPedidos();

    // Modal logic
    const modal = document.getElementById("modalDetalhes");
    const span = document.getElementsByClassName("close")[0];

    span.onclick = function () {
        modal.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});

function fetchPedidos() {
    fetch('http://localhost:3000/api/entregas')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error('A resposta do servidor não é uma lista de pedidos.');
            }
            console.log('Pedidos recebidos:', data); // Debugging

            const tabelaHoje = document.querySelector('#tabelaPedidosHoje tbody');
            const tabelaAnteriores = document.querySelector('#tabelaPedidosAnteriores tbody');

            tabelaHoje.innerHTML = '';
            tabelaAnteriores.innerHTML = '';

            // Get current date in YYYY-MM-DD format (local time)
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hojeString = `${year}-${month}-${day}`;

            let temHoje = false;
            let temAnteriores = false;

            data.forEach(pedido => {
                const row = document.createElement('tr');

                // Formatar data para exibição
                const dataEntrega = pedido.dataEntrega ? pedido.dataEntrega.split('-').reverse().join('/') : '';

                row.innerHTML = `
                    <td>${dataEntrega} ${pedido.horarioEntrega || ''}</td>
                    <td>${pedido.tipo === 'retirada' ? '<i class="fas fa-store" title="Retirada na Loja"></i>' : '<i class="fas fa-truck" title="Entrega"></i>'}</td>
                    <td>${pedido.cliente || ''}</td>
                    <td>${pedido.produtos || ''}</td>
                    <td>R$ ${pedido.valorTotalPedido || ''}</td>
                    <td>${pedido.formaPagamento || ''} (${pedido.estaPago ? 'Pago' : 'Pendente'})</td>
                    <td style="text-align: center;">
                        <input type="checkbox" ${pedido.finalizado ? 'checked' : ''} onchange="toggleFinalizado('${pedido._id}', this.checked)">
                    </td>
                    <td>
                        <button class="btn-icon btn-detalhes-icon" title="Ver Detalhes" onclick='abrirModal(${JSON.stringify(pedido).replace(/'/g, "&#39;")})'><i class="fas fa-info-circle"></i></button>
                        <button class="btn-icon btn-imprimir-icon" title="Imprimir" onclick='imprimirPedido(${JSON.stringify(pedido).replace(/'/g, "&#39;")})'><i class="fas fa-print"></i></button>
                        <button class="btn-icon btn-editar-icon" title="Editar" onclick='abrirModalEditar(${JSON.stringify(pedido).replace(/'/g, "&#39;")})'><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-excluir-icon" title="Excluir" onclick='confirmarExclusaoModal("${pedido._id}")'><i class="fas fa-trash"></i></button>
                    </td>
                `;

                if (pedido.dataEntrega === hojeString) {
                    tabelaHoje.appendChild(row);
                    temHoje = true;
                } else {
                    tabelaAnteriores.appendChild(row);
                    temAnteriores = true;
                }
            });

            if (!temHoje) {
                tabelaHoje.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum pedido para hoje.</td></tr>';
            }
            if (!temAnteriores) {
                tabelaAnteriores.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum pedido anterior.</td></tr>';
            }

        })
        .catch(error => {
            console.error('Erro ao buscar pedidos:', error);
            alert(`Erro ao carregar pedidos: ${error.message}`);
        });
}

// Variável global para armazenar o ID do pedido a ser excluído
let idParaExcluir = null;

function confirmarExclusaoModal(id) {
    idParaExcluir = id;
    document.getElementById('modalConfirmacao').style.display = 'block';

    // Configurar o botão de confirmação
    document.getElementById('btnConfirmarExclusao').onclick = function () {
        executarExclusao();
    };
}

function fecharModalConfirmacao() {
    document.getElementById('modalConfirmacao').style.display = 'none';
    idParaExcluir = null;
}

function executarExclusao() {
    if (!idParaExcluir) return;

    fetch(`http://localhost:3000/api/entrega/${idParaExcluir}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (response.ok) {
                fecharModalConfirmacao();
                abrirModalMensagem('Sucesso', 'Pedido excluído com sucesso!');
                fetchPedidos(); // Recarregar a lista
            } else {
                fecharModalConfirmacao();
                abrirModalMensagem('Erro', 'Erro ao excluir pedido.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            fecharModalConfirmacao();
            abrirModalMensagem('Erro', 'Erro ao conectar com o servidor.');
        });
}

function abrirModalMensagem(titulo, texto) {
    document.getElementById('tituloMensagem').innerText = titulo;
    document.getElementById('textoMensagem').innerText = texto;
    document.getElementById('modalMensagem').style.display = 'block';
}

function fecharModalMensagem() {
    document.getElementById('modalMensagem').style.display = 'none';
}

// Função antiga de excluir (removida/substituída)
function excluirPedido(id) {
    // Deprecated
}

function abrirModal(pedido) {
    const modal = document.getElementById("modalDetalhes");
    const conteudo = document.getElementById("conteudoModal");

    const dataEntrega = pedido.dataEntrega ? pedido.dataEntrega.split('-').reverse().join('/') : '';

    conteudo.innerHTML = `
        <div class="detalhe-item"><span class="detalhe-label">Cliente:</span> ${pedido.cliente || '-'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Telefone:</span> ${pedido.telefone || '-'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Produtos:</span> ${pedido.produtos || '-'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Valor Total:</span> R$ ${pedido.valorTotalPedido || '-'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Data/Hora Entrega:</span> ${dataEntrega} às ${pedido.horarioEntrega || '-'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Entregar para:</span> ${pedido.nomeReceber || '-'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Telefone Recebedor:</span> ${pedido.telefoneReceber || '-'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Endereço:</span> ${pedido.endereco || '-'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Referência:</span> ${pedido.referencia || '-'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Mensagem Cartão:</span> ${pedido.mensagemCartao || '-'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Pagamento:</span> ${pedido.formaPagamento || '-'} (${pedido.estaPago ? 'Pago' : 'Pendente'})</div>
        <div class="detalhe-item"><span class="detalhe-label">Valor Pago (Parcial):</span> R$ ${pedido.valorPago || '0'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Falta Pagar:</span> R$ ${pedido.faltaPagar || '0'}</div>
        <div class="detalhe-item"><span class="detalhe-label">Como será pago o restante:</span> ${pedido.comoSeraPago || '-'}</div>
    `;

    modal.style.display = "block";
}

function imprimirPedido(pedido) {
    var conteudoCupom = 'CLIENTE:\n ' + (pedido.cliente || '') + '\n============================\n' +
        'TELEFONE DO CLIENTE:\n' + (pedido.telefone || '') + '\n============================\n' +
        'PRODUTOS: \n' + (pedido.produtos || '') + '\n============================\n' +
        'VALOR TOTAL DO PEDIDO:\n R$' + (pedido.valorTotalPedido || '') + '\n============================\n' +
        'DATA DE ENTREGA:\n ' + (pedido.dataEntrega || '') + '\n============================\n' +
        'HORÁRIO DA ENTREGA(ATÉ): \n' + (pedido.horarioEntrega || '') + '\n============================\n' +
        'NOME DE QUEM VAI RECEBER:\n ' + (pedido.nomeReceber || '') + '\n============================\n' +
        'TELEFONE DE QUEM VAI RECEBER:\n' + (pedido.telefoneReceber || '') + '\n============================\n' +
        'ENDEREÇO: \n' + (pedido.endereco || '') + '\n============================\n' +
        'REFERÊNCIA:\n' + (pedido.referencia || '') + '\n============================\n' +
        'TEM CARTÃO? \n ' + (pedido.temCartao ? 'sim' : 'não') + '\n============================\n'
        ;

    if (pedido.temCartao) {
        conteudoCupom += 'MENSAGEM CARTÃO: \n' + (pedido.mensagemCartao || '') + '\n============================\n';
    }

    conteudoCupom += 'ESTÁ PAGO? \n' + (pedido.estaPago ? 'sim' : 'não') + '\n============================\n';

    if (pedido.valorPago && parseFloat(pedido.valorPago) > 0) {
        conteudoCupom += 'FOI PAGO: R$' + pedido.valorPago + '\n============================\n';
    }

    if (!pedido.estaPago && pedido.comoSeraPago) {
        conteudoCupom += 'COMO SERÁ PAGO: \n' + pedido.comoSeraPago + '\n============================\n';
    }

    conteudoCupom += 'FALTA PAGAR: R$' + (pedido.faltaPagar || '0') + '\n============================\n';
    conteudoCupom += 'FORMA DE PAGAMENTO: \n' + (pedido.formaPagamento || '') + ' \n============================\n';
    conteudoCupom += 'Assinatura recebimento \n\n _________________________\n'

    var janelaImpressao = window.open('', 'PRINT', 'height=600,width=900,top=100,left=150');

    janelaImpressao.document.write('<html><head><title>Cupom Fiscal</title>');
    janelaImpressao.document.write('<style>body {font-family: Arial, sans-serif; text-align: left; font-size:12px; padding: 0;margin:0; } pre{ font-size:12px; white-space:pre-wrap;word-wrap:break-word;}</style>');

    janelaImpressao.document.write('</head><body>');
    janelaImpressao.document.write('<pre>' + conteudoCupom + '</pre>');
    janelaImpressao.document.write('</body></html>');

    janelaImpressao.document.close();
    janelaImpressao.focus();

    janelaImpressao.print();
    janelaImpressao.print();
}

// Função excluirPedido substituída por confirmarExclusaoModal
function excluirPedido(id) {
    // Deprecated
}

function abrirModalEditar(pedido) {
    document.getElementById('editId').value = pedido._id;
    document.getElementById('editCliente').value = pedido.cliente || '';
    document.getElementById('editProdutos').value = pedido.produtos || '';
    document.getElementById('editValor').value = pedido.valorTotalPedido || '';
    document.getElementById('editPago').value = pedido.estaPago ? 'true' : 'false';

    document.getElementById('modalEditar').style.display = 'block';
}

function fecharModalEditar() {
    document.getElementById('modalEditar').style.display = 'none';
}

function salvarEdicao() {
    const id = document.getElementById('editId').value;
    const dadosAtualizados = {
        cliente: document.getElementById('editCliente').value,
        produtos: document.getElementById('editProdutos').value,
        valorTotalPedido: document.getElementById('editValor').value,
        estaPago: document.getElementById('editPago').value === 'true'
    };

    fetch(`http://localhost:3000/api/entrega/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosAtualizados)
    })
        .then(async response => {
            if (response.ok) {
                fecharModalEditar();
                abrirModalMensagem('Sucesso', 'Pedido atualizado com sucesso!');
                fetchPedidos(); // Recarregar a lista
            } else {
                const err = await response.json().catch(() => ({}));
                abrirModalMensagem('Erro', `Erro ao atualizar pedido: ${err.message || response.statusText}`);
            }
        })
        .catch(error => console.error('Erro:', error));
}

function toggleFinalizado(id, isChecked) {
    fetch(`http://localhost:3000/api/entrega/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ finalizado: isChecked })
    })
        .then(async response => {
            if (response.ok) {
                // Sucesso silencioso ou notificação sutil
                console.log(`Pedido ${id} atualizado para finalizado=${isChecked}`);
            } else {
                const err = await response.json().catch(() => ({}));
                abrirModalMensagem('Erro', `Erro ao atualizar status: ${err.message || response.statusText}`);
                // Reverter checkbox se falhar (opcional, mas boa prática)
                fetchPedidos();
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            abrirModalMensagem('Erro', 'Erro ao conectar com o servidor.');
            fetchPedidos();
        });
}

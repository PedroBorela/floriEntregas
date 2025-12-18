function imprimirCupom() {
    // Preencher data e hora atuais
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    document.getElementById('data').value = `${year}-${month}-${day}`;
    document.getElementById('horario').value = `${hours}:${minutes}`;

    var cliente = document.getElementById('cliente').value;
    var dataEntrega = document.getElementById('data').value;
    var horarioEntrega = document.getElementById('horario').value;
    var nome = document.getElementById('nome').value;
    var produtos = document.getElementById('produtos').value;
    var endereco = document.getElementById('endereco').value;
    var referencia = document.getElementById('referencia').value;
    var telefoneReceber = document.getElementById('tel_receber').value;
    var telefone = document.getElementById('telefone').value;
    var valorTotalPedido = document.getElementById('valorTotalPedido').value;
    var cartao = document.getElementById('cartao').checked;
    var pagoSim = document.getElementById('sim').checked;
    var mensagem = document.getElementById('mensagem').value;
    var respostaCartao = cartao ? 'sim' : 'não';
    var respostaPago = pagoSim ? 'sim' : 'não';
    var tipoPagamento = document.getElementById('pagamento').value;
    var parcial = document.getElementById('parcial');

    // var valor= document.getElementById('valor').value;
    var pagParcial = document.getElementById('restante').value;
    var pagFinal = document.getElementById('pagamentoFinal').value;
    var pagoNao = document.getElementById('nao');
    var restantePagamento;
    var formaPg;
    switch (tipoPagamento) {
        case 'pix':
            formaPg = 'pix';
            break;
        case 'cartaoCredito':
            formaPg = 'Cartão de crédito';
            break;
        case 'cartaoDebito':
            formaPg = 'Cartão de débito';
            break;
        case 'dinheiro':
            formaPg = 'Dinheiro';
            break;
        case 'linkPg':
            formaPg = 'Link de pagamento';
            break;
    }



    var conteudoCupom = 'CLIENTE:\n ' + cliente + '\n============================\n' +
        'TELEFONE DO CLIENTE:\n' + telefone + '\n============================\n' +
        'PRODUTOS: \n' + produtos + '\n============================\n' +
        'VALOR TOTAL DO PEDIDO:\n R$' + valorTotalPedido + '\n============================\n' +
        'DATA DE ENTREGA:\n ' + dataEntrega + '\n============================\n' +
        'HORÁRIO DA ENTREGA(ATÉ): \n' + horarioEntrega + '\n============================\n' +
        'NOME DE QUEM VAI RECEBER:\n ' + nome + '\n============================\n' +
        'TELEFONE DE QUEM VAI RECEBER:\n' + telefoneReceber + '\n============================\n' +
        'ENDEREÇO: \n' + endereco + '\n============================\n' +
        'REFERÊNCIA:\n' + referencia + '\n============================\n' +
        'TEM CARTÃO? \n ' + respostaCartao + '\n============================\n'
        ;

    if (cartao) {
        conteudoCupom += 'MENSAGEM CARTÃO: \n' + mensagem + '\n============================\n';
    }

    conteudoCupom += 'ESTÁ PAGO? \n' + respostaPago + '\n============================\n';

    if (parcial.checked) {
        restantePagamento = parseFloat(valorTotalPedido) - parseFloat(pagParcial);
        conteudoCupom += 'FOI PAGO: R$' + pagParcial + '\n============================\n';
    } else {
        restantePagamento = 0;

    }

    if (pagoNao.checked) {
        conteudoCupom += 'COMO SERÁ PAGO: \n' + pagFinal + '\n============================\n';
        restantePagamento = parseFloat(valorTotalPedido);
    }


    conteudoCupom += 'FALTA PAGAR: R$' + restantePagamento + '\n============================\n';
    conteudoCupom += 'FORMA DE PAGAMENTO: \n' + formaPg + ' \n============================\n';
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


    // Salvar no banco de dados
    var dadosPedido = {
        cliente: cliente,
        telefone: telefone,
        produtos: produtos,
        valorTotalPedido: valorTotalPedido,
        dataEntrega: dataEntrega,
        horarioEntrega: horarioEntrega,
        nomeReceber: nome,
        telefoneReceber: telefoneReceber,
        endereco: endereco,
        referencia: referencia,
        temCartao: cartao,
        mensagemCartao: mensagem,
        estaPago: pagoSim,
        valorPago: pagParcial,
        formaPagamento: formaPg,
        comoSeraPago: pagFinal,
        faltaPagar: restantePagamento,
        tipo: 'entrega'
    };

    fetch('http://localhost:3000/api/entrega', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosPedido)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Sucesso:', data);
            // Opcional: alert('Pedido salvo com sucesso!');
        })
        .catch((error) => {
            console.error('Erro:', error);
            alert('Erro ao salvar pedido no banco de dados.');
        });

}

function mudarVisibilidadeMensagem() {
    var cartaoCheckbox = document.getElementById('cartao');
    var campoMensagem = document.getElementById('mensagem');
    var labelMensagem = document.getElementById('mensagem2');
    if (cartaoCheckbox.checked) {
        campoMensagem.style.display = 'block';
        labelMensagem.style.display = 'block';

    } else {
        campoMensagem.style.display = 'none';
        labelMensagem.style.display = 'none';
    }
}

function mudarVisibilidadePagamento() {
    var parcial = document.getElementById('parcial').checked;
    var campoPago = document.getElementById('restante');
    var labelPago = document.getElementById('restante2');
    if (parcial) {
        campoPago.style.display = 'block';
        labelPago.style.display = 'block';

    } else {
        campoPago.style.display = 'none';
        labelPago.style.display = 'none';
    }
}

function mudarVisibilidadePgIncompleto() {
    var botoes = document.getElementById('botoes');
    var sim = document.getElementById('sim');
    var pgFinal = document.getElementById('pgFinal');
    if (!sim.checked) {
        botoes.style.display = 'none';
        pgFinal.style.display = 'block';
    } else {
        botoes.style.display = 'block';
        pgFinal.style.display = 'none';
    }
}

window.onload = function () {
    mudarVisibilidadeMensagem(); // Chama a função para definir o estado inicial correto
    mudarVisibilidadePgIncompleto();
    document.getElementById('cartao').onchange = mudarVisibilidadeMensagem; // Vincula a função ao evento de mudança

}

function limparFormulario() {
    document.getElementById('formularioEntrega').reset();
}



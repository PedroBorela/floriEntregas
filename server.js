const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
// Replace with your MongoDB connection string if different
const mongoURI = 'mongodb://localhost:27017/floricultura';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Schema Definition
const EntregaSchema = new mongoose.Schema({
    cliente: String,
    telefone: String,
    produtos: String,
    valorTotalPedido: String,
    dataEntrega: String,
    horarioEntrega: String,
    nomeReceber: String,
    telefoneReceber: String,
    endereco: String,
    referencia: String,
    temCartao: Boolean,
    mensagemCartao: String,
    estaPago: Boolean,
    valorPago: String, // For partial payments
    formaPagamento: String,
    comoSeraPago: String, // For "Não pago"
    faltaPagar: String,
    tipo: { type: String, default: 'entrega' }, // 'entrega' or 'retirada'
    finalizado: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Entrega = mongoose.model('Entrega', EntregaSchema);

// Routes
app.post('/api/entrega', async (req, res) => {
    try {
        const novaEntrega = new Entrega(req.body);
        await novaEntrega.save();
        res.status(201).json({ message: 'Pedido salvo com sucesso!', id: novaEntrega._id });
    } catch (error) {
        console.error('Erro ao salvar pedido:', error);
        res.status(500).json({ message: 'Erro ao salvar pedido', error: error.message });
    }
});

app.get('/api/entregas', async (req, res) => {
    try {
        const entregas = await Entrega.find().sort({ createdAt: -1 });
        res.status(200).json(entregas);
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({ message: 'Erro ao buscar pedidos', error: error.message });
    }
});

app.delete('/api/entrega/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Entrega.findByIdAndDelete(id);
        res.status(200).json({ message: 'Pedido excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        res.status(500).json({ message: 'Erro ao excluir pedido', error: error.message });
    }
});

app.put('/api/entrega/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizados = req.body;
        await Entrega.findByIdAndUpdate(id, dadosAtualizados);
        res.status(200).json({ message: 'Pedido atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        res.status(500).json({ message: 'Erro ao atualizar pedido', error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Floricultura Backend is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

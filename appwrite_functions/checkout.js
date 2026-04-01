/**
 * Appwrite Function: criar-checkout
 * 
 * Esta função recebe id_evento e id_jogador, valida as vagas na coleção 'eventos',
 * cria um registro de pagamento e participação, e gera uma Checkout Session do Stripe.
 */

const sdk = require('node-appwrite');
const Stripe = require('stripe');

module.exports = async function (context) {
    const { req, res, log, error } = context;

    // Configurações (Essas variáveis devem estar no console do Appwrite)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const client = new sdk.Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new sdk.Databases(client);

    const databaseId = process.env.DATABASE_ID;
    const collections = {
        eventos: process.env.EVENTOS_COLLECTION_ID,
        pagamentos: process.env.PAGAMENTOS_COLLECTION_ID,
        participacoes: process.env.PARTICIPACOES_COLLECTION_ID,
    };

    if (req.method !== 'POST') {
        return res.json({ error: 'Apenas POST é permitido' }, 405);
    }

    try {
        const { id_evento, id_jogador } = JSON.parse(req.body);

        if (!id_evento || !id_jogador) {
            return res.json({ error: 'IDs inválidos' }, 400);
        }

        // 1. Buscar Detalhes do Evento
        const evento = await databases.getDocument(databaseId, collections.eventos, id_evento);
        
        // 2. Verificar Vagas (Cálculo local na function para segurança)
        const parts = await databases.listDocuments(databaseId, collections.participacoes, [
            sdk.Query.equal('id_evento', id_evento),
            sdk.Query.equal('status_presenca', 'CONFIRMADO')
        ]);

        if (parts.total >= evento.limite_participantes) {
            return res.json({ error: 'Evento lotado' }, 400);
        }

        // 3. Criar Pagamento (PENDENTE)
        const pagamento = await databases.createDocument(databaseId, collections.pagamentos, sdk.ID.unique(), {
            id_evento,
            id_jogador,
            valor_pago: evento.preco_por_vaga,
            status: 'PENDENTE',
            metodo_pagamento: 'stripe'
        });

        // 4. Criar Participação (AGUARDANDO_PAGAMENTO)
        await databases.createDocument(databaseId, collections.participacoes, sdk.ID.unique(), {
            id_evento,
            id_jogador,
            id_pagamento: pagamento.$id,
            status_presenca: 'AGUARDANDO_PAGAMENTO'
        });

        // 5. Criar Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'brl',
                    product_data: { name: `Vaga no Evento: ${evento.titulo}` },
                    unit_amount: Math.round(evento.preco_por_vaga * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            metadata: { 
                id_pagamento: pagamento.$id, 
                id_evento, 
                id_jogador 
            },
            success_url: `${process.env.APP_URL}/pagamento/sucesso`,
            cancel_url: `${process.env.APP_URL}/pagamento/cancelado`,
        });

        // 6. Atualizar Pagamento com Session ID
        await databases.updateDocument(databaseId, collections.pagamentos, pagamento.$id, {
            gateway_transaction_id: session.id
        });

        return res.json({ checkout_url: session.url });

    } catch (e) {
        error('Erro no processamento: ' + e.message);
        return res.json({ error: e.message }, 500);
    }
};

/**
 * Appwrite Function: webhook-stripe
 * 
 * Esta função deve ser chamada por um Webhook externo do Stripe.
 * Ela confirma o pagamento e a participação no banco de dados.
 */

const sdk = require('node-appwrite');
const Stripe = require('stripe');

module.exports = async function (context) {
    const { req, res, log, error } = context;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const client = new sdk.Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new sdk.Databases(client);

    const databaseId = process.env.DATABASE_ID;
    const collections = {
        usuarios: process.env.USUARIOS_COLLECTION_ID,
        eventos: process.env.EVENTOS_COLLECTION_ID,
        pagamentos: process.env.PAGAMENTOS_COLLECTION_ID,
        participacoes: process.env.PARTICIPACOES_COLLECTION_ID,
        notificacoes: process.env.NOTIFICACOES_COLLECTION_ID,
    };

    const signature = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body, 
            signature, 
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.json({ error: `Webhook Error: ${err.message}` }, 400);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { id_pagamento, id_evento, id_jogador } = session.metadata;

        // 1. Atualizar Pagamento para APROVADO
        await databases.updateDocument(databaseId, collections.pagamentos, id_pagamento, {
            status: 'APROVADO'
        });

        // 2. Atualizar Participação para CONFIRMADO
        // Precisamos buscar o ID do documento de participação primeiro
        const parts = await databases.listDocuments(databaseId, collections.participacoes, [
            sdk.Query.equal('id_pagamento', id_pagamento)
        ]);

        if (parts.total > 0) {
            await databases.updateDocument(databaseId, collections.participacoes, parts.documents[0].$id, {
                status_presenca: 'CONFIRMADO',
                data_confirmacao: new Date().toISOString()
            });
        }

        // 3. Verificar se o evento lotou
        const evento = await databases.getDocument(databaseId, collections.eventos, id_evento);
        const confirmados = await databases.listDocuments(databaseId, collections.participacoes, [
            sdk.Query.equal('id_evento', id_evento),
            sdk.Query.equal('status_presenca', 'CONFIRMADO')
        ]);

        if (confirmados.total >= evento.limite_participantes) {
            await databases.updateDocument(databaseId, collections.eventos, id_evento, {
                status: 'LOTADO'
            });
        }

        // 4. Criar Notificação no DB
        await databases.createDocument(databaseId, collections.notificacoes, sdk.ID.unique(), {
            id_usuario: id_jogador,
            titulo: '✅ Vaga Confirmada!',
            corpo: `Seu pagamento para "${evento.titulo}" foi aprovado. Bom jogo!`,
            tipo: 'PAGAMENTO',
            id_referencia: id_evento,
            lida: false
        });

        log(`Pagamento ${id_pagamento} processado com sucesso.`);
    }

    return res.json({ received: true });
};

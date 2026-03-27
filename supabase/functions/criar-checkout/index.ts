import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

serve(async (req) => {
  try {
    const { id_evento, id_jogador } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: evento } = await supabase
      .from("eventos_com_vagas").select("*").eq("id_evento", id_evento).single();

    if (!evento || evento.vagas_restantes <= 0)
      return new Response(JSON.stringify({ error: "Evento lotado" }), { status: 400 });

    const { data: pagamento } = await supabase.from("pagamentos")
      .insert({ id_evento, id_jogador, valor_pago: evento.preco_por_vaga, status: "PENDENTE", metodo_pagamento: "stripe" })
      .select().single();

    await supabase.from("participacoes").insert({
      id_evento, id_jogador,
      id_pagamento: pagamento.id_pagamento,
      status_presenca: "AGUARDANDO_PAGAMENTO",
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "brl",
          product_data: { name: `Vaga: ${evento.titulo}` },
          unit_amount: Math.round(evento.preco_por_vaga * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      metadata: { id_pagamento: pagamento.id_pagamento, id_evento, id_jogador },
      success_url: `${Deno.env.get("APP_URL")}/pagamento/sucesso`,
      cancel_url: `${Deno.env.get("APP_URL")}/pagamento/cancelado`,
    });

    await supabase.from("pagamentos")
      .update({ gateway_transaction_id: session.id })
      .eq("id_pagamento", pagamento.id_pagamento);

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

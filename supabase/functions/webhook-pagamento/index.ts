import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")!;
  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
  } catch (err: any) {
    return new Response(`Webhook inválido: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { id_pagamento, id_evento, id_jogador } = session.metadata!;

    await supabase.from("pagamentos").update({ status: "APROVADO" }).eq("id_pagamento", id_pagamento);
    await supabase.from("participacoes")
      .update({ status_presenca: "CONFIRMADO", data_confirmacao: new Date().toISOString() })
      .eq("id_pagamento", id_pagamento);

    const { data: ev } = await supabase
      .from("eventos_com_vagas").select("vagas_restantes").eq("id_evento", id_evento).single();
    if (ev?.vagas_restantes === 0)
      await supabase.from("eventos").update({ status: "LOTADO" }).eq("id_evento", id_evento);

    const { data: usuario } = await supabase
      .from("usuarios").select("expo_push_token").eq("id_usuario", id_jogador).single();

    if (usuario?.expo_push_token) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: usuario.expo_push_token,
          title: "✅ Vaga Confirmada!",
          body: "Pagamento aprovado. Boa partida! 🏆",
          data: { id_evento },
        }),
      });
    }

    await supabase.from("notificacoes").insert({
      id_usuario: id_jogador,
      titulo: "✅ Vaga Confirmada!",
      corpo: "Seu pagamento foi aprovado. Você está no jogo!",
      tipo: "PAGAMENTO",
      id_referencia: id_evento,
    });
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const { data: pag } = await supabase
      .from("pagamentos").select("id_pagamento")
      .eq("gateway_transaction_id", charge.payment_intent as string).single();

    if (pag) {
      await supabase.from("pagamentos").update({ status: "ESTORNADO" }).eq("id_pagamento", pag.id_pagamento);
      await supabase.from("participacoes").update({ status_presenca: "CANCELADO" }).eq("id_pagamento", pag.id_pagamento);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return Response.json({ error: 'Webhook configuration error' }, { status: 400 });
  }

  let event;
  const body = await req.text();

  try {
    // Verificar assinatura do webhook
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { user_id, plan } = session.metadata;

        if (session.mode === 'subscription') {
          // Buscar informações do plano
          const planInfo = {
            bronze: { discount: 5, free_rides: 1, price: 49.90 },
            prata: { discount: 10, free_rides: 2, price: 79.90 },
            ouro: { discount: 15, free_rides: 3, price: 129.90 }
          };

          const info = planInfo[plan];
          const nextBilling = new Date();
          nextBilling.setMonth(nextBilling.getMonth() + 1);

          // Verificar se já existe assinatura
          const existing = await base44.asServiceRole.entities.Subscription.filter({ 
            user_id 
          });

          if (existing.length > 0) {
            // Atualizar assinatura existente
            await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
              plan,
              status: 'active',
              monthly_price: info.price,
              discount_percentage: info.discount,
              free_rides_remaining: info.free_rides,
              next_billing_date: nextBilling.toISOString().split('T')[0],
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
            });
          } else {
            // Criar nova assinatura
            await base44.asServiceRole.entities.Subscription.create({
              user_id,
              plan,
              status: 'active',
              monthly_price: info.price,
              discount_percentage: info.discount,
              free_rides_remaining: info.free_rides,
              next_billing_date: nextBilling.toISOString().split('T')[0],
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              total_saved: 0,
            });
          }

          // Enviar notificação
          await base44.asServiceRole.entities.Notification.create({
            user_id,
            title: `Bem-vinda ao Clube Dellas ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`,
            message: `Sua assinatura está ativa. Aproveite ${info.discount}% de desconto em todas as corridas!`,
            type: 'system',
            icon: '👑'
          });

          console.log(`Subscription created for user ${user_id}, plan: ${plan}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const { user_id } = subscription.metadata;

        if (subscription.status === 'active') {
          await base44.asServiceRole.entities.Subscription.filter({ 
            stripe_subscription_id: subscription.id 
          }).then(async (subs) => {
            if (subs.length > 0) {
              const nextBilling = new Date(subscription.current_period_end * 1000);
              await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
                status: 'active',
                next_billing_date: nextBilling.toISOString().split('T')[0]
              });
            }
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        await base44.asServiceRole.entities.Subscription.filter({ 
          stripe_subscription_id: subscription.id 
        }).then(async (subs) => {
          if (subs.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
              status: 'cancelled'
            });

            // Notificar usuário
            await base44.asServiceRole.entities.Notification.create({
              user_id: subs[0].user_id,
              title: 'Assinatura Cancelada',
              message: 'Sua assinatura do Clube Dellas foi cancelada. Você pode assinar novamente a qualquer momento!',
              type: 'system'
            });

            console.log(`Subscription cancelled for user ${subs[0].user_id}`);
          }
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const { user_id } = subscription.metadata;

        if (user_id) {
          await base44.asServiceRole.entities.Notification.create({
            user_id,
            title: 'Falha no Pagamento',
            message: 'Não conseguimos processar o pagamento da sua assinatura. Por favor, atualize seus dados de pagamento.',
            type: 'system',
            icon: '⚠️'
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, { status: 500 });
  }
});
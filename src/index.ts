import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { bearerAuth } from 'hono/bearer-auth';
import { config } from 'dotenv';
import Stripe from 'stripe';
import { HTTPException } from 'hono/http-exception';
config();

const app = new Hono();
app.use(logger());
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PRICE_ID = process.env.PRICE_ID;
const token = 'token';

app.get('/', (c) => {
  return c.html(`<div>
 <script src="//js.stripe.com/v3/"></script>
 <button id="checkoutButton">Checkout</button>
 <script>
 const checkoutButton = document.getElementById('checkoutButton');
 checkoutButton.addEventListener('click', async () => {
   const response = await fetch('/checkout', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     },

   });
   const { id } = await response.json();
   const stripe = Stripe('${process.env.STRIPE_PUBLIC_KEY}');
   await stripe.redirectToCheckout({
     sessionId: id
   });

 });
</script>
 </div>`);

});

app.get('/protected', bearerAuth({ token }), (c) => {
  return c.text('Protected route');
});

app.post('/checkout', async (c) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          'price': `${PRICE_ID}`,
          'quantity': 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.DOMAIN}/success`,
      cancel_url: `${process.env.DOMAIN}/cancel`,
    });

    return c.json(session);
  } catch (error: unknown) {
    console.error('Error:', error);
    throw new HTTPException(500, {
      message: 'Internal Server Error',
    });
  }
});

app.get('/success', (c) => {
  return c.text('Payment successful!');
});

app.get('/cancel', (c) => {
  return c.text("Payment canceled!");
});

app.post('webhook', async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    throw new HTTPException(400)
  } 

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(session)

    // TODO Fulfill the purchase with your own business logic, for example:
    // Update Database with order details
    // Add credits to customer account
    // Send confirmation email
    // Print shipping label
    // Trigger order fulfillment workflow
    // Update inventory
    // Etc.
  }

  return c.text('success');
})
const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});

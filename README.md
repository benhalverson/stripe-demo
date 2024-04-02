```
npm install
npm run dev
```

```
open http://localhost:3000
```

## Download the stripe CLI
https://docs.stripe.com/stripe-cli
In another terminal run the following commands
```
stripe login

stripe listen -e checkout.session.completed --forward-to http://localhost:3000/webhook 
```

Use the webhook secret from the cli in the .env file
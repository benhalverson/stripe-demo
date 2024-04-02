```
npm install
npm run dev
```

```
open http://localhost:3000
```

```
stripe login

stripe listen -e checkout.session.completed --forward-to http://localhost:3000/webhook 
```
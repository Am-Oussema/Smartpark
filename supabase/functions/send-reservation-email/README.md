# Edge Function : `send-reservation-email`

Envoie un email de confirmation ou de modification à l'utilisateur après
une réservation. Utilise [Resend](https://resend.com) si la variable
d'environnement `RESEND_API_KEY` est définie, sinon l'appel est un no-op
silencieux (utile en dev).

## Variables d'environnement à configurer dans Supabase

```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set RESEND_FROM="SmartPark <no-reply@smartpark.tn>"
```

## Déploiement

```bash
supabase functions deploy send-reservation-email
```

## Invocation côté client

```ts
await supabase.functions.invoke("send-reservation-email", {
  body: {
    reservation_id: "uuid",
    kind: "created" | "updated" | "cancelled",
  },
});
```

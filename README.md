# AiNexAgent — pubblicazione automatica su Instagram

Sistema che pubblica automaticamente contenuti sull'account Instagram
**@ainexagent** ("AI Nex Agent") tramite la **Instagram Graph API ufficiale**
di Meta, orchestrato con Cron Job su Vercel. Nessuna libreria non ufficiale.

**Obiettivo**: pagina di divulgazione su AI e agenti conversazionali,
crescita follower, monetizzazione futura (sponsor/affiliazioni). Progetto
scorporato dal SaaS "NexAgent".

Percorso Meta usato: **Facebook Login for Business** (host
`graph.facebook.com`), permessi `pages_show_list`, `pages_read_engagement`,
`instagram_basic`, `instagram_content_publish`. Non usare i permessi gemelli
`instagram_business_*`: appartengono al percorso alternativo "Instagram API
with Instagram Login" e mischiarli dà errore "Invalid platform app".

## Struttura del progetto

- `lib/instagram.ts` — wrapper Graph API (container immagine/carosello, polling stato, pubblicazione, permalink)
- `lib/db.ts` — query verso Postgres/Neon (coda post, token, init schema "pigra")
- `app/api/cron/publish/route.ts` — pubblica il prossimo post scaduto in coda
- `app/api/cron/refresh-token/route.ts` — verifica/segnala la scadenza del token
- `schema.sql` — tabelle `ig_posts_queue` e `ig_tokens`
- `vercel.json` — cron: pubblicazione 7:00 e 17:00 UTC, verifica token lunedì 9:00 UTC
- `content/` — piano editoriale e contenuti dei post già pronti
- `scripts/upload_to_blob.py` — carica le immagini di un post su Vercel Blob

## Riferimenti progetto (non sensibili)

| Cosa | Valore |
|---|---|
| Instagram | @ainexagent |
| Pagina Facebook | Ai Nex Agent — ID `1343140862209167` |
| IG Business Account ID | `17841438575825602` |
| App Meta | AINexAgent — ID `3880542119907373` |
| Progetto Vercel | ainexagent (team riccardoproj, piano Hobby) |
| URL produzione | https://ainexagent-riccardoproj.vercel.app |

App Secret Meta, token Instagram, `CRON_SECRET` e `BLOB_READ_WRITE_TOKEN`
**non vanno mai committati**: vanno in `.env.local` (vedi
`.env.local.example`) e nelle Environment Variables del progetto Vercel.

## Setup da zero

1. **Postgres**: Vercel Dashboard → progetto → Storage → Create Database → Postgres (Neon). Imposta da solo `DATABASE_URL`.
2. **Env vars su Vercel** (Settings → Environment Variables):
   - `META_APP_ID` = `3880542119907373`
   - `META_APP_SECRET` = da Meta App → Impostazioni → Di base
   - `CRON_SECRET` = generane uno nuovo (`openssl rand -hex 32`)
3. **Redeploy** dopo aver impostato le env vars (lo schema DB si crea da solo alla prima chiamata, non serve eseguire `schema.sql` a mano).
4. **Inserire il token Instagram** in `ig_tokens`:
   ```sql
   insert into ig_tokens (id, access_token, ig_user_id, issued_at, expires_at)
   values (1, 'IL_TOKEN_PAGINA', '17841438575825602', now(), now() + interval '10 years');
   ```
5. **Blob Store** (Storage → Create → Blob, **Public**, con "Add read-write token env var") → dà `BLOB_READ_WRITE_TOKEN`.
6. **Caricare le immagini** di un post:
   ```bash
   export BLOB_READ_WRITE_TOKEN=...
   pip install vercel
   python scripts/upload_to_blob.py content/post-1-chatbot-vs-agente
   ```
7. **Inserire il post in coda** con gli URL ottenuti al passo 6:
   ```sql
   insert into ig_posts_queue (caption, image_urls, scheduled_for)
   values ('<caption>', array['URL1.jpg', '...'], now());
   ```
8. **Test manuale**:
   ```bash
   curl -X GET "https://ainexagent-riccardoproj.vercel.app/api/cron/publish" \
     -H "Authorization: Bearer <CRON_SECRET>"
   ```
   Risposta attesa: `{"message": "Pubblicato", ...}`.

## Lezioni imparate

- Le immagini per l'API Instagram devono essere **JPEG**, mai PNG.
- Cron Vercel sempre in **UTC**, mai ora italiana.
- Piano **Hobby**: ogni cron gira max 1 volta/giorno — per più pubblicazioni/giorno servono cron distinti (già così: 2 per la pubblicazione).
- Se `me/accounts` torna vuoto pur con permessi `granted`, interrogare direttamente `{page-id}?fields=instagram_business_account,access_token` invece di enumerare.

## Prossimi passi

- Admin UI per caricare immagini/caption senza SQL a mano (con conversione PNG→JPEG automatica)
- Eseguire il piano editoriale dei 30 giorni (`content/piano-editoriale-30-giorni.md`)

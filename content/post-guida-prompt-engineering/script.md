# Guida — "La guida completa al prompt engineering" (15 slide)

Contenuto "evergreen" ad alto potenziale di salvataggio/condivisione (non legato a una notizia,
quindi rimane utile e ricondivisibile per mesi). Diverso e più avanzato del post del giorno 4
("Anatomia di un prompt che funziona", 7 slide, solo i concetti base) — qui ci sono 5 tecniche
avanzate + 4 template pronti da copiare, pensato esplicitamente per essere salvato e riletto.

Stile visivo: stesso sistema "Carta Tecnica". Le slide 9-12 (i template) meritano il trattamento
"box in evidenza" già usato per il prompt efficace del giorno 4 — testo del template dentro un
riquadro, facilmente leggibile e "screenshot-abile".

---

## Slide 1 — Cover
**Testo:** GUIDA COMPLETA · 01
**Titolo:** La guida completa al prompt engineering
**Sottotitolo (ciano):** Salvala. Ti servirà per mesi →

## Slide 2 — Perché conta
**Titolo:** Lo stesso identico task, con prompt diversi, dà risultati completamente diversi
**Testo:** Non è talento, è metodo. Le prossime 13 slide ti danno il metodo — tecniche avanzate e template pronti da copiare, non solo la teoria di base.

## Slide 3 — La struttura base (recap veloce)
**Titolo:** Prima di tutto, i 4 elementi che non mancano mai
**Testo (4 righe numerate):**
01 Contesto — chi sei, chi è il destinatario, cosa sa già
02 Compito — cosa deve fare esattamente, non in generale
03 Formato — lunghezza, struttura, tono
04 Vincoli — cosa NON deve fare
**Nota piccola in basso:** (Se vuoi il dettaglio con esempi prima/dopo, guarda il post "Anatomia di un prompt")

## Slide 4 — Tecnica 1: Role prompting
**Titolo/numero:** 01 — Role prompting
**Testo:** Digli chi deve "essere", non solo cosa fare. "Agisci come un avvocato che revisiona un contratto" produce un output diverso — più preciso, con il vocabolario giusto — rispetto a "controlla questo contratto".
**Esempio:** "Agisci come un editor esperto di riviste tech. Rivedi questo paragrafo per chiarezza e ritmo."

## Slide 5 — Tecnica 2: Few-shot examples
**Titolo/numero:** 02 — Mostra, non solo descrivere
**Testo:** Se il formato conta, non descriverlo — mostralo. Dai 1-2 esempi dell'output che vuoi. L'agente copia lo schema, non solo le istruzioni.
**Esempio:** "Scrivi 3 titoli nello stesso stile di questi: 'Il tuo chatbot risponde, un agente agisce' / 'Perché il tuo agente a volte non sa cose ovvie'"

## Slide 6 — Tecnica 3: Chain of thought
**Titolo/numero:** 03 — Fallo ragionare prima di rispondere
**Testo:** Per compiti complessi (calcoli, decisioni con più variabili, analisi), chiedi esplicitamente di ragionare passo passo prima di dare la risposta finale. Riduce drasticamente gli errori.
**Esempio:** "Prima elenca i pro e i contro di ogni opzione, poi dammi la tua raccomandazione finale."

## Slide 7 — Tecnica 4: Iterazione
**Titolo/numero:** 04 — La prima risposta è una bozza, non il risultato
**Testo:** Il modo sbagliato di usare l'AI è aspettarsi la risposta perfetta al primo colpo. Il modo giusto: tratta la prima risposta come una bozza, poi correggi con istruzioni specifiche ("troppo lungo", "tono più diretto", "aggiungi un esempio").

## Slide 8 — Tecnica 5: Vincoli negativi
**Titolo/numero:** 05 — Dire cosa NON fare è potente quanto dire cosa fare
**Testo:** "Non usare gergo tecnico", "non superare 100 parole", "non usare elenchi puntati" — i vincoli negativi eliminano interi rami di risposte sbagliate che altrimenti dovresti correggere dopo.

## Slide 9 — Template pronto: email professionale
**Titolo:** Template · Email professionale
**Box:** "Scrivi un'email [tipo: follow-up / richiesta / scuse] per [destinatario], su [contesto]. Obiettivo: [cosa deve succedere dopo]. Tono [formale/diretto/cordiale]. Massimo [N] righe, senza elenco."

## Slide 10 — Template pronto: riassunto
**Titolo:** Template · Riassunto di un documento
**Box:** "Riassumi questo testo in [N] punti chiave, per un lettore che [non ha tempo di leggerlo tutto / non conosce il contesto]. Mantieni i numeri e le date esatte. Non aggiungere opinioni non presenti nel testo."

## Slide 11 — Template pronto: analisi/confronto
**Titolo:** Template · Confronto tra opzioni
**Box:** "Confronta [opzione A] e [opzione B] su questi criteri: [criterio 1, criterio 2, criterio 3]. Presenta in tabella. Concludi con una raccomandazione motivata in 2 righe."

## Slide 12 — Template pronto: brainstorming
**Titolo:** Template · Brainstorming creativo
**Box:** "Genera 10 idee per [obiettivo]. Target: [pubblico]. Vincoli: [budget/tempo/tono]. Per ognuna, una riga che spiega perché potrebbe funzionare. Evita le idee più ovvie/scontate."

## Slide 13 — L'errore che quasi tutti fanno
**Titolo:** L'errore più comune, anche con questa guida in mano
**Testo:** Usare tutte le tecniche insieme, sempre, per ogni task. Non serve. Un messaggio veloce non ha bisogno di role prompting e chain-of-thought — usa la tecnica giusta per la complessità del compito, non tutte per abitudine.

## Slide 14 — Checklist finale (la slide da salvare)
**Titolo:** Checklist — rileggi prima di ogni prompt importante
**Testo (7 righe con segno di spunta):**
☐ Ho dato contesto sufficiente?
☐ Il compito è specifico, non generico?
☐ Ho specificato il formato?
☐ Ho detto cosa NON fare?
☐ Per task complessi, ho chiesto di ragionare prima?
☐ Ho dato un esempio, se il formato conta?
☐ Sono pronto a iterare, non solo ad accettare la prima risposta?

## Slide 15 — CTA
**Titolo:** Salva questo post. Torna utile ogni volta che scrivi un prompt importante.
**Box:** SEGUI →
**Testo piccolo:** @ainexagent

---

## Caption per il post

La guida al prompt engineering che avresti voluto avere dal primo giorno. Salvala — non è contenuto che si consuma una volta sola. 📌

Il post "Anatomia di un prompt" (qualche giorno fa) copriva le basi: contesto, compito, formato, vincoli. Questa guida va oltre — 5 tecniche avanzate + 4 template pronti da copiare e adattare, per i task che usi davvero ogni settimana.

Le 5 tecniche, in sintesi:
→ Role prompting: digli chi "essere", non solo cosa fare
→ Few-shot: mostra un esempio invece di descriverlo
→ Chain of thought: fallo ragionare passo passo sui task complessi
→ Iterazione: la prima risposta è una bozza, non il risultato finale
→ Vincoli negativi: dire cosa NON fare elimina interi rami di errori

Più 4 template pronti — email professionale, riassunto documenti, confronto tra opzioni, brainstorming creativo — che puoi copiare e riempire con i tuoi dettagli in 30 secondi.

L'errore più comune, anche dopo aver letto tutto questo? Usare ogni tecnica per ogni task. Non serve — un messaggio veloce non ha bisogno di chain-of-thought. Usa la tecnica giusta per la complessità del compito.

Nell'ultima slide c'è la checklist riassuntiva — quella è la slide da tenere sott'occhio ogni volta che scrivi un prompt che conta davvero.

Quale di queste 5 tecniche usavi già? Quale proverai oggi? Dimmelo nei commenti.

Segui @ainexagent se vuoi altre guide pratiche come questa. 🧠⚡

#IntelligenzaArtificiale #PromptEngineering #AgentiAI #AI2026 #TechItalia #GuidaAI #ProduttivitàAI #AItips #ArtificialIntelligence #TechNews #IntelligenzaArtificialeItalia #StrumentiAI #NotizieTech #ChatGPT #Claude

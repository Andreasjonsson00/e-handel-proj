# Min e-handel

[Öppna den deployade shoppen](https://e-handel-proj-a8q5.vercel.app/)

En fullstack-shop för elektronik med React/Vite i klienten och Express i servern. Projektet är byggt för att låta React fokusera på gränssnittet, medan Express äger affärsregler, autentisering, prisberäkning och alla hemliga nycklar. Det gör att externa tjänster kan bytas eller hanteras fel utan att känsliga uppgifter når webbläsaren.

## Kom igång

### Förutsättningar

- Node.js 20 eller senare
- En PostgreSQL-databas med projektets tabeller
- Konton och API-nycklar för de tjänster som ska testas

### Starta lokalt

1. Installera beroenden för båda delarna:

   ```bash
   npm install --prefix server
   npm install --prefix client
   ```

2. Kopiera `server/.env.example` till `server/.env` och fyll i värdena. Samtliga serverhemligheter, till exempel databasuppgifter, JWT-hemlighet, Stripe-, Supabase-, Algolia- och PostNord-nycklar, hör hemma där.

3. Kopiera `client/.env.example` till `client/.env`. Där anges endast publika Vite-variabler, i första hand `VITE_API_URL` och Stripe publishable key.

4. Starta servern i en terminal:

   ```bash
   npm run dev --prefix server
   ```

5. Starta klienten i en annan terminal:

   ```bash
   npm run dev --prefix client
   ```

   Klienten kör normalt på `http://localhost:5173` och servern på `http://localhost:3000`.

### Testkonton och integrationer

Shoppen har ingen publik registrering. Logga in med användarnamn user samt user123 för inlogg. Se `.env.example` för vilka variabler som krävs.

För Stripe i testläge kan betalningen slutföras med kortnumret `4242 4242 4242 4242`, valfritt framtida datum, valfri CVC och valfritt postnummer. För att ordern ska bli `paid` lokalt måste Stripe-webhooken kunna nå Express. Kör exempelvis `stripe listen --forward-to localhost:3000/api/stripe/webhook` och lägg värdet `whsec_...` som kommandot visar i `STRIPE_WEBHOOK_SECRET`.

För PostNord Transit Time Calculation V2 behövs `POSTNORD_API_KEY` och `POSTNORD_ORIGIN_POSTAL_CODE` i `server/.env`. I sandbox används `atapi2.postnord.com`. Kassan beräknar ombud via `addresstoaddress` och hemleverans via `addresstolocation`; API-nyckeln lämnar aldrig Express. Supabase Storage, Algolia, Frankfurter och leverantörsimport kan testas när motsvarande variabler i `server/.env.example` är ifyllda.

## Reflektion

Jag har valt olika sätt att integrera tjänsterna beroende på vad de ska göra i shoppen. Produktdata och order ligger i Aiven PostgreSQL, som jag pratar med via `pg` och SQL. Det passar bra eftersom en order består av flera saker som måste hänga ihop: produkter, lager, orderrader och betalstatus. När kunden går till betalning låser servern produkterna, räknar priset och skapar ordern. Leverantörens produkter hämtas via REST, men själva katalogen kommer som CSV eller XML. Express laddar ner filen, läser in den, validerar innehållet med Zod och anpassar den till formatet som min shop använder.

Stripe använder jag på två sätt. Först skapar Express en Checkout Session via Stripes SDK. Kunden skickas sedan vidare till Stripes egna betalsida med en redirect. När betalningen är klar skickar Stripe en webhook till `/api/stripe/webhook`. Det är viktigt eftersom kunden kan stänga fliken eller aldrig komma tillbaka till min successida. Webhooken är därför bekräftelsen jag litar på. Jag kontrollerar också Stripes signatur innan ordern markeras som betald och lagret minskar.

PostNord, Frankfurter och Leverantörs-API använder REST. PostNord passar bra i checkouten eftersom jag kan hämta både ombud och leveranstid från kundens postnummer. Frankfurter används för växelkurser så att priser kan visas i fler valutor. Algolia och Supabase använder sina SDK:er. Algolia gör sökningen snabbare och klarar till exempel felskrivningar bättre än en enkel egen sökning. Supabase Storage används för produktbilder och ger tillbaka en URL som sedan kan sparas på produkten.

Jag låter Express sköta alla anrop till externa tjänster i stället för att låta React göra dem direkt. Den viktigaste anledningen är nycklarna. Stripe secret key, PostNord-nyckeln, Supabase service key och Algolia admin key ska aldrig skickas till besökarens webbläsare. Servern kan också kontrollera att data är rimlig innan den skickas vidare. React skickar till exempel bara produkt-id, antal, postnummer och fraktsätt. Priserna hämtas sedan från databasen på servern, så kunden kan inte ändra summan i webbläsaren och få Stripe att debitera fel belopp.

Jag hade kunnat bygga flera av funktionerna själv, men det hade blivit mycket större än själva shoppen. En egen betallösning hade krävt säker hantering av kortuppgifter, bedrägeriskydd och avtal med banker. För att bygga något som PostNords ombuds- och leveranstidsfunktion hade jag behövt få tag på uppdaterade ombudsdata, transportregler och rutter. En egen sökmotor hade behövt indexering, relevans, filtrering och stöd för stavfel. Egen bildlagring hade krävt lagring, rättigheter och CDN. Med integrationerna kan jag lägga mer tid på shopens egna funktioner i stället.

Det finns så klart nackdelar med att vara beroende av andra tjänster. Om Stripe är nere går det inte att starta en betalning, men ordern markeras inte som betald av misstag. Om webhooken misslyckas ligger ordern kvar som `pending` tills Stripe kan skicka händelsen igen. Om PostNord inte svarar kan kunden inte få fram ombud eller leveranstid, men servern skickar ett tydligt fel i stället för att krascha. Frankfurter har cache, timeout och återförsök så att tillfälliga problem inte påverkar allt direkt. Om Algolia är nere påverkas sökningen, men produktinformationen finns fortfarande i databasen. Om Supabase inte går att nå behålls produktens tidigare bild.

En risk är att tjänsterna kan ändra priser, begränsa antal anrop eller ändra sina villkor. Det kan göra att jag behöver ändra både kod och budget. Det finns också en GDPR-del. PostNord får kundens postnummer och fraktval, Stripe hanterar betalningen och Supabase lagrar bilder. Därför behöver jag bara skicka den information som verkligen behövs, ha tydlig information till användaren och se till att nycklar aldrig hamnar i Git eller i React-klienten.


## AI-användning – PostNord API

Jag använde ChatGPT och Codex som stöd vid integrationen av PostNords API:er för att hämta ombud och beräkna leveranstider i e-handelns checkout.

Exempel på prompter som användes under utvecklingen:

* integrera Transit time calculation V2 via postnords API in i mitt projekt. (denna promt var icke fungerande)

* integrera Transit time calculation V2 via postnords API in i mitt projekt. frakt till postombud ska gå till endpointsen https://atapi2.postnord.com/rest/transport/v2/transittime/addresstoaddress och hemleverans ska gå till https://atapi2.postnord.com/rest/transport/v2/transittime/addresstolocation

AI:n föreslog att samla kommunikationen med PostNord i en separat shippingAdapter.js och hantera HTTP-anropen genom Express-routes. Förslaget omfattade även validering av inkommande data med Zod, timeout för API-anrop och felhantering om PostNord inte svarar som förväntat.

För ombudssökningen föreslogs att hämta ombud utifrån postnummer och omvandla PostNords svar till ett enklare format med ID, namn och adress. För leveranstider föreslogs att använda Transit Time Calculation och välja tjänstekod beroende på valt fraktalternativ.

Jag jämförde AI:ns förslag med PostNords officiella API-dokumentation och testade API-anropen i Developer Portal. Ombudssökningen fungerade, men anropet för leveranstider returnerade HTTP 403 trots att API-nyckeln fungerade vid test i portalen.

Under felsökningen upptäckte jag att min implementation använde en annan sökväg än den versionerade endpointen som jag undersökte i dokumentationen. Jag jämförde även vilka parametrar som skickades i mitt anrop med dokumentationens exempel. För addresstoaddress anges bland annat mottagarens gatunamn och gatunummer som obligatoriska parametrar. Jag behövde därför skilja mellan fel i anropets utformning och eventuella behörighetsproblem.

Jag använde AI:n som stöd för att strukturera koden, förstå skillnaderna mellan endpoint-varianterna och felsöka HTTP 403-felet. Jag kontrollerade förslagen mot PostNords dokumentation i stället för att utgå från att den genererade koden var korrekt.
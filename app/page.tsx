export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: 640 }}>
      <h1>AiNexAgent</h1>
      <p>
        Sistema di pubblicazione automatica per{" "}
        <a href="https://instagram.com/ainexagent" target="_blank" rel="noreferrer">
          @ainexagent
        </a>{" "}
        tramite la Instagram Graph API ufficiale.
      </p>
      <p>
        Gli endpoint di pubblicazione sono protetti e gestiti dai cron job
        Vercel (vedi <code>vercel.json</code>). Non c&apos;è ancora una UI di
        amministrazione: la coda si gestisce via SQL su <code>ig_posts_queue</code>.
      </p>
    </main>
  );
}

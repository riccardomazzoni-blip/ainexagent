import { NextRequest, NextResponse } from "next/server";
import { getActiveToken, updateTokenExpiry } from "@/lib/db";
import { debugToken } from "@/lib/instagram";

export const dynamic = "force-dynamic";

const REFRESH_THRESHOLD_DAYS = 14;

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  return !!secret && auth === `Bearer ${secret}`;
}

/**
 * Il Page Access Token long-lived ottenuto tramite fb_exchange_token non ha,
 * in pratica, una scadenza fissa vicina — ma verifichiamo comunque con
 * /debug_token e allineiamo expires_at nel DB. Se Meta invalida il token
 * (revoca manuale, cambio permessi) qui lo scopriamo prima che fallisca
 * una pubblicazione.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.json(
      { message: "META_APP_ID / META_APP_SECRET non configurate" },
      { status: 500 }
    );
  }

  const token = await getActiveToken();
  if (!token) {
    return NextResponse.json({ message: "Nessun token da verificare" });
  }

  const debugInfo = await debugToken(token.access_token, appId, appSecret);

  if (!debugInfo.is_valid) {
    return NextResponse.json(
      { message: "Il token corrente risulta non valido: va rigenerato manualmente" },
      { status: 500 }
    );
  }

  const expiresAt =
    debugInfo.expires_at > 0
      ? new Date(debugInfo.expires_at * 1000)
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10); // 0 = non scade

  await updateTokenExpiry(token.id, expiresAt);

  const daysToExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  if (daysToExpiry < REFRESH_THRESHOLD_DAYS) {
    // Un Page Access Token non si rinnova da solo: serve ripetere lo scambio
    // long-lived a partire da uno user token valido. Non essendoci uno user
    // token salvato nel DB, qui possiamo solo segnalarlo chiaramente.
    return NextResponse.json({
      message: "Attenzione: token in scadenza entro 14 giorni, rigenerazione manuale necessaria",
      expiresAt,
    });
  }

  return NextResponse.json({ message: "Token valido", expiresAt });
}

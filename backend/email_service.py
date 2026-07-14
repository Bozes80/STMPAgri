"""Service d'envoi d'e-mails transactionnels via l'intégration Resend gérée par Emergent.

Utilisé pour notifier l'équipe STMP Agri des nouvelles soumissions (contact / devis)
et pour envoyer un accusé de réception aux visiteurs.
Les envois sont non-bloquants : en cas d'échec, l'erreur est journalisée mais
la soumission du formulaire reste un succès.
"""
import os
import logging
from typing import List, Optional

import httpx

logger = logging.getLogger("stmp.email")

# URL du proxy e-mail géré par Emergent — CONSTANTE (ne jamais lire depuis os.environ)
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]

# Adresses internes qui reçoivent les notifications
NOTIFICATION_EMAILS: List[str] = [
    e.strip() for e in os.environ.get("NOTIFICATION_EMAILS", "").split(",") if e.strip()
]

BRAND_GREEN = "#0E7A3A"
BRAND_DARK = "#1F2937"
BRAND_YELLOW = "#F2D400"


async def send_email(
    to: List[str],
    subject: str,
    html_content: str,
    reply_to: Optional[str] = None,
) -> bool:
    """Envoie un e-mail HTML. Retourne True si envoyé, False sinon (ne lève jamais)."""
    if not to:
        logger.warning("send_email appelé sans destinataire")
        return False

    payload = {
        "to": to,
        "subject": subject,
        "html": html_content,
        "from_name": EMAIL_FROM_NAME,
    }
    if reply_to:
        payload["contact_email"] = reply_to

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        logger.info("E-mail envoyé à %s (sujet: %s)", ", ".join(to), subject)
        return True
    except httpx.HTTPStatusError as e:
        logger.error("Échec envoi e-mail: %s %s", e.response.status_code, e.response.text)
        return False
    except Exception as e:  # noqa: BLE001
        logger.error("Erreur envoi e-mail: %s", str(e))
        return False


def _shell(title: str, intro: str, rows_html: str, footer_note: str = "") -> str:
    """Gabarit HTML commun (inline CSS + tables) pour tous les e-mails."""
    return f"""\
<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:{BRAND_GREEN};padding:24px 32px;">
              <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px;">STMP Agri</span>
              <span style="color:{BRAND_YELLOW};font-size:22px;font-weight:bold;">.</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px 0;font-size:20px;color:{BRAND_DARK};">{title}</h1>
              <p style="margin:0 0 24px 0;font-size:14px;color:#4b5563;line-height:1.6;">{intro}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                {rows_html}
              </table>
              {footer_note}
            </td>
          </tr>
          <tr>
            <td style="background-color:{BRAND_DARK};padding:20px 32px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                STMP Agri — Nourrir nos terres pour nourrir l'Afrique.<br/>
                Ce message a été généré automatiquement depuis le site stmpagri.ci.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _row(label: str, value: str) -> str:
    if value is None or str(value).strip() == "":
        value = "—"
    return f"""\
<tr>
  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;width:38%;vertical-align:top;">{label}</td>
  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:{BRAND_DARK};font-weight:600;">{value}</td>
</tr>"""


def build_contact_notification(payload: dict) -> str:
    rows = (
        _row("Nom", payload.get("name", ""))
        + _row("E-mail", payload.get("email", ""))
        + _row("Téléphone", payload.get("phone", ""))
        + _row("Sujet", payload.get("subject", ""))
        + _row("Message", str(payload.get("message", "")).replace("\n", "<br/>"))
    )
    return _shell(
        "Nouveau message de contact",
        "Un visiteur vient de soumettre le formulaire de contact du site STMP Agri.",
        rows,
    )


def build_quote_notification(payload: dict) -> str:
    objets = payload.get("objets") or []
    objets_str = ", ".join(objets) if objets else "—"
    rows = (
        _row("Nom", payload.get("nom", ""))
        + _row("Prénom", payload.get("prenom", ""))
        + _row("Société", payload.get("societe", ""))
        + _row("Fonction", payload.get("fonction", ""))
        + _row("Téléphone", payload.get("telephone", ""))
        + _row("E-mail", payload.get("email", ""))
        + _row("Secteur", payload.get("secteur", ""))
        + _row("Produits / services", objets_str)
        + _row("Quantité", payload.get("quantite", ""))
        + _row("Pays", payload.get("pays", ""))
        + _row("Ville", payload.get("ville", ""))
        + _row("Adresse", payload.get("adresse", ""))
        + _row("Date souhaitée", payload.get("date_souhaitee", ""))
        + _row("Détails", str(payload.get("details", "")).replace("\n", "<br/>"))
    )
    return _shell(
        "Nouvelle demande de devis",
        "Un prospect vient de soumettre une demande de devis sur le site STMP Agri.",
        rows,
    )


def build_contact_ack(name: str) -> str:
    intro = (
        f"Bonjour {name or ''},<br/><br/>"
        "Nous avons bien reçu votre message et vous remercions de l'intérêt que vous portez "
        "à STMP Agri. Notre équipe reviendra vers vous dans les plus brefs délais."
    )
    return _shell("Votre message a bien été reçu", intro, "")


def build_quote_ack(prenom: str, nom: str) -> str:
    who = (prenom or nom or "").strip()
    intro = (
        f"Bonjour {who},<br/><br/>"
        "Nous vous confirmons la bonne réception de votre demande de devis. "
        "Un conseiller STMP Agri l'étudie et vous contactera prochainement afin de vous "
        "proposer une offre adaptée à vos besoins."
    )
    return _shell("Votre demande de devis a bien été reçue", intro, "")

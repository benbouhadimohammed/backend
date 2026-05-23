// ✅ Pas besoin de bibliothèque Brevo complexe, un simple fetch suffit !
// Si tu es sur une ancienne version de Node (inférieure à v18), fais un "npm install node-fetch" et décommente la ligne suivante :
// const fetch = require('node-fetch');

/**
 * Envoie un e-mail de validation d'inscription avec un code OTP
 * @param {string} toEmail - L'adresse de l'utilisateur
 * @param {string} name - Le nom de l'utilisateur
 * @param {string} otpCode - Le code de validation généré
 */
const sendValidationEmail = async (toEmail, name, otpCode) => {
console.log("Longueur réelle de la clé :", process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.length : 0);
  console.log("Début de la clé détectée :", process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 12) : "VIDE");  const url = 'https://api.brevo.com/v3/smtp/email';
  
  const emailData = {
    sender: { name: "BaytiCare", email: process.env.EMAIL_SENDER },
    to: [{ email: toEmail, name: name }],
    subject: "Validez votre inscription",
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
        <h2 style="color: #059669;">Bienvenue ${name} !</h2>
        <p>Merci de vous être inscrit. Pour finaliser la création de votre compte, veuillez utiliser le code de vérification ci-dessous :</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 20px 0; border-radius: 10px;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #6b7280;">Ce code est valable pendant 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
      </div>
    `
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Détails de l'erreur Brevo:", result);
      throw new Error(result.message || "Erreur lors de l'envoi");
    }

    console.log('✅ E-mail envoyé avec succès via l\'API Brevo ! Jeton:', result.messageId);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail:", error);
    throw new Error("Échec de l'envoi de l'e-mail de confirmation.");
  }
};

module.exports = { sendValidationEmail };
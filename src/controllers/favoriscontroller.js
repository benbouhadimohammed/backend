
const { addFavori, getFavoris, removeFavori } = require("../models/favorismodel");

const addFav = async (req, res) => {
  try {
    const userId = req.user.id;
    const { annonceId } = req.params;

    // 1. Insérer le favori
    await addFavori(userId, annonceId);

    // 2. ⚡ Trouver à qui appartient cette annonce (l'artisan ou prestataire)
    // Adapte 'annonces' et 'id_user' selon les noms exacts de tes colonnes de BDD
    const annonceResult = await pool.query(
      "SELECT id_user, titre FROM annonces WHERE id_annonce = $1", 
      [annonceId]
    );
    const annonce = annonceResult.rows[0];

    // 3. Envoyer la notification si l'annonce existe et qu'il ne s'agit pas de sa propre annonce
    if (annonce && annonce.id_user !== userId) {
      await createNotification(
        annonce.id_user, // L'artisan / créateur de l'annonce
        'favori', // Le type de notification
        `Votre annonce "${annonce.titre}" a été ajoutée aux favoris !`, // Message
        `/annonces/${annonceId}` // Lien vers l'annonce
      );
    }

    res.json({ message: "Ajouté aux favoris" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getFav = async (req, res) => {
  const userId = req.user.id;
   console.log("User ID from token:", userId); 
  const favoris = await getFavoris(userId);
  res.json(favoris);
};


const removeFav = async (req, res) => {
    try {
        const id_user = req.user.id; 
      
       const { annonceId } = req.params;
        const deletedCount = await removeFavori(id_user, annonceId);

        if (deletedCount === 0) {
            return res.status(404).json({ message: "Favori non trouvé" });
        }

        res.json({ message: "Supprimé des favoris" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
module.exports = { addFav, getFav, removeFav }; 
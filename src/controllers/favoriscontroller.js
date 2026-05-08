
const { addFavori, getFavoris, removeFavori } = require("../models/favorismodel");

const addFav = async (req, res) => {
  const userId = req.user.id;

  const { annonceId } = req.params;

  await addFavori(userId, annonceId);
  res.json({ message: "Ajouté aux favoris" });
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
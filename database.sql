CREATE TABLE users (
id_user  SERIAL PRIMARY KEY,
nom VARCHAR(100) NOT NULL,
email VARCHAR(100) UNIQUE NOT NULL,
mot_de_passe VARCHAR(255) NOT NULL,
type_user VARCHAR(20) DEFAULT 'client',
role VARCHAR(20) DEFAULT 'user',
numero VARCHAR(20),
is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6) DEFAULT NULL,
    otp_expires TIMESTAMP DEFAULT NULL,
date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);
CREATE TABLE annonces (
  id_annonce SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  type_travail VARCHAR(100),
  statut VARCHAR(20) DEFAULT 'pending',
  photo VARCHAR(255),
  prix FLOAT,
  wilaya VARCHAR(100),
  est_ferme BOOLEAN DEFAULT FALSE,
  photo VARCHAR(255),
  date_publication TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  id_user INT,
  FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);
CREATE TABLE forum_post (
  id_forum SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  contenu TEXT,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  id_user INT,
  FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);
CREATE TABLE forum_commentaires (
  id_commentaire SERIAL PRIMARY KEY,
  contenu TEXT NOT NULL,
  id_post INT NOT NULL,
  id_user INT NOT NULL,
  date_publication TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_post) REFERENCES forum(id_forum) ON DELETE CASCADE,
  FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

CREATE TABLE contacts (
    id_contact SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    sujet VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversations (
  id_conversation SERIAL PRIMARY KEY,
  id_client INT NOT NULL,
  id_prestataire INT NOT NULL,
  id_annonce INT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (id_client) REFERENCES users(id_user) ON DELETE CASCADE,
  FOREIGN KEY (id_prestataire) REFERENCES users(id_user) ON DELETE CASCADE,
  FOREIGN KEY (id_annonce) REFERENCES annonces(id_annonce) ON DELETE SET NULL
);

CREATE TABLE messages (
  id_message SERIAL PRIMARY KEY,
  id_conversation INT NOT NULL,
  id_sender INT NOT NULL,
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (id_conversation) REFERENCES conversations(id_conversation) ON DELETE CASCADE,
  FOREIGN KEY (id_sender) REFERENCES users(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id_notification SERIAL PRIMARY KEY,
  id_user         INT          NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
  type            VARCHAR(50)  NOT NULL,
  message         TEXT         NOT NULL,
  lien            VARCHAR(255),
  lu              BOOLEAN      NOT NULL DEFAULT FALSE,
  date_creation   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
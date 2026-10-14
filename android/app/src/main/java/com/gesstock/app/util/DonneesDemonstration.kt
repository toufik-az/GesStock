package com.gesstock.app.util

import androidx.room.withTransaction
import com.gesstock.app.data.ROLE_CAISSIER
import com.gesstock.app.data.db.AppDatabase
import com.gesstock.app.data.db.Categorie
import com.gesstock.app.data.db.Fournisseur
import com.gesstock.app.data.db.LigneReception
import com.gesstock.app.data.db.LigneVente
import com.gesstock.app.data.db.Produit
import com.gesstock.app.data.db.Reception
import com.gesstock.app.data.db.Utilisateur
import com.gesstock.app.data.db.Vente
import kotlin.random.Random

suspend fun insererDonneesDemonstration(db: AppDatabase) {
    db.withTransaction {
        // ── Nettoyage complet ──────────────────────────────────────────────────
        db.venteDao().viderLignes()
        db.venteDao().viderVentes()
        db.produitDao().viderTout()
        db.categorieDao().viderTout()
        db.fournisseurDao().viderTout()

        // ── Catégories ─────────────────────────────────────────────────────────
        val idBoissons  = db.categorieDao().inserer(Categorie(nom = "Boissons",            couleur = 0xFF1565C0.toInt()))
        val idEpicerie  = db.categorieDao().inserer(Categorie(nom = "Épicerie sèche",      couleur = 0xFFE65100.toInt()))
        val idLaitier   = db.categorieDao().inserer(Categorie(nom = "Produits laitiers",   couleur = 0xFF00695C.toInt()))
        val idFromage   = db.categorieDao().inserer(Categorie(nom = "Fromagerie",          couleur = 0xFFF9A825.toInt()))
        val idBoulang   = db.categorieDao().inserer(Categorie(nom = "Boulangerie & Snacks",couleur = 0xFF6D4C41.toInt()))
        val idHygiene   = db.categorieDao().inserer(Categorie(nom = "Hygiène & Beauté",    couleur = 0xFFAD1457.toInt()))
        val idMenage    = db.categorieDao().inserer(Categorie(nom = "Produits ménagers",   couleur = 0xFF0277BD.toInt()))
        val idDivers    = db.categorieDao().inserer(Categorie(nom = "Divers",              couleur = 0xFF6A1B9A.toInt()))

        // ── Produits ──────────────────────────────────────────────────────────
        // Helper data class to keep the list readable
        data class P(val nom: String, val code: String?, val cat: Long,
                     val pa: Double, val pv: Double,
                     val q: Double, val qm: Double, val u: String = "Pièce")

        val specs = listOf(
            // ── Boissons (0–11)
            P("Coca-Cola 33cL",              "5000112637923", idBoissons,  72.0,  100.0,  72.0, 24.0),
            P("Coca-Cola 1.5L",              "5000112637924", idBoissons, 140.0,  195.0,  36.0, 12.0),
            P("Pepsi 33cL",                  "4902220009576", idBoissons,  68.0,   92.0,  60.0, 24.0),
            P("Fanta Orange 33cL",           "5000112637945", idBoissons,  68.0,   92.0,  48.0, 12.0),
            P("Sprite 33cL",                 "5000112637946", idBoissons,  68.0,   92.0,  48.0, 12.0),
            P("Eau Ifri 0.5L",               "3282779001023", idBoissons,  22.0,   32.0, 144.0, 48.0),
            P("Eau Ifri 1.5L",               "3282779000023", idBoissons,  42.0,   60.0,  96.0, 24.0),
            P("Eau Toudja 1.5L",             "3101234500032", idBoissons,  38.0,   55.0,  72.0, 24.0),
            P("Jus Rouiba Pomme 1L",         "3102050000016", idBoissons, 115.0,  160.0,  24.0, 12.0),
            P("Jus Rouiba Orange 1L",        "3102050000023", idBoissons, 115.0,  160.0,  18.0, 12.0),
            P("Red Bull 250mL",              "9002490100062", idBoissons, 320.0,  440.0,  12.0,  6.0),
            P("Café Nescafé Gold 100g",      "7613036525022", idBoissons, 480.0,  620.0,  15.0,  5.0),
            // ── Épicerie sèche (12–21)
            P("Sucre blanc 1kg",             null,            idEpicerie, 115.0,  155.0,  50.0, 10.0, "Kg"),
            P("Huile Fleurial 1L",           null,            idEpicerie, 340.0,  450.0,  24.0,  6.0),
            P("Farine Moulin d'Or 1kg",      null,            idEpicerie, 140.0,  195.0,  30.0,  8.0, "Kg"),
            P("Semoule fine 1kg",            null,            idEpicerie, 125.0,  170.0,  25.0,  8.0, "Kg"),
            P("Riz Uncle Ben's 1kg",         "5010067093918", idEpicerie, 220.0,  300.0,  20.0,  6.0, "Kg"),
            P("Pâtes Djazaïr 500g",          null,            idEpicerie,  95.0,  135.0,  40.0, 10.0),
            P("Couscous fin 1kg",            null,            idEpicerie, 125.0,  170.0,  20.0,  6.0, "Kg"),
            P("Sel fin 1kg",                 null,            idEpicerie,  35.0,   50.0,  30.0, 10.0, "Kg"),
            P("Harissa TFC 140g",            null,            idEpicerie, 100.0,  145.0,  18.0,  6.0),
            P("Tomate concentrée Heinz 135g","8001100997443", idEpicerie, 125.0,  175.0,  15.0,  5.0),
            // ── Produits laitiers (22–28)
            P("Lait Candia entier 1L",       "3033490004743", idLaitier,  165.0,  220.0,  36.0,  8.0),
            P("Lait Gloria demi-écrémé 1L",  "8000300007202", idLaitier,   95.0,  130.0,  48.0, 12.0),
            P("Yaourt Danone nature 125g",   null,            idLaitier,   65.0,   90.0,  24.0,  8.0),
            P("Beurre Président 200g",       "3073781099091", idLaitier,  300.0,  410.0,  10.0,  4.0),
            P("Crème fraîche 200mL",         null,            idLaitier,  175.0,  240.0,  12.0,  4.0),
            // ── Fromagerie (27–28)
            P("La Vache Qui Rit 8 portions", "7622300420161", idFromage,  300.0,  410.0,  12.0,  4.0),
            P("Kiri 6 portions",             "7622300220065", idFromage,  340.0,  440.0,   8.0,  3.0),
            // ── Boulangerie & Snacks (29–35)
            P("Pain baguette 250g",          null,            idBoulang,   15.0,   25.0,  60.0, 20.0),
            P("Croissant pur beurre",        null,            idBoulang,   40.0,   60.0,  24.0, 10.0),
            P("Biscuits LU Petit Beurre",    "3017760000261", idBoulang,  140.0,  195.0,  20.0,  6.0),
            P("Chips Lay's 60g",             "5000177108440", idBoulang,  160.0,  220.0,  24.0,  8.0),
            P("Chocolat Milka 100g",         "7622210449283", idBoulang,  300.0,  420.0,  12.0,  4.0),
            P("Kinder barre 25g",            "8000500032038", idBoulang,   80.0,  115.0,  36.0, 12.0),
            P("Chewing-gum Orbit",           "4009900432085", idBoulang,   60.0,   85.0,  30.0, 10.0),
            // ── Hygiène & Beauté (36–41)
            P("Savon Palmolive 90g",         "8718951182776", idHygiene,  120.0,  165.0,  24.0,  8.0),
            P("H&S Anti-pelliculaire 200mL", "8001090266484", idHygiene,  450.0,  600.0,  12.0,  3.0),
            P("Dentifrice Signal 75mL",      "8710908546846", idHygiene,  220.0,  300.0,  18.0,  6.0),
            P("Déodorant Axe 150mL",         "8717163680186", idHygiene,  380.0,  510.0,  10.0,  3.0),
            P("Gel douche Dove 250mL",       "0031900013847", idHygiene,  320.0,  440.0,  12.0,  4.0),
            P("Rasoir Gillette ×5",          "3014260282691", idHygiene,  280.0,  390.0,   8.0,  2.0),
            // ── Produits ménagers (42–46)
            P("Eau de Javel 1L",             null,            idMenage,    65.0,   90.0,  24.0,  6.0),
            P("Détergent OMO 500g",          "8690637695871", idMenage,   300.0,  415.0,  15.0,  5.0),
            P("Liquide vaisselle Paic 500mL","3254900018700", idMenage,   175.0,  240.0,  18.0,  6.0),
            P("Papier WC Hamama ×6",         null,            idMenage,   220.0,  300.0,  20.0,  6.0),
            P("Sac poubelle ×10",            null,            idMenage,    95.0,  135.0,  20.0,  6.0),
            // ── Divers (47–48)
            P("Sac plastique ×100",          null,            idDivers,    60.0,  100.0,   4.0,  5.0),
            P("Piles AA ×4",                 null,            idDivers,   120.0,  180.0,   8.0,  2.0)
        )

        val produits = specs.map { s ->
            Produit(nom = s.nom, codeBarre = s.code, categorieId = s.cat,
                    prixAchat = s.pa, prixVente = s.pv,
                    quantite = s.q, quantiteMin = s.qm, unite = s.u)
        }
        val ids = produits.map { db.produitDao().inserer(it) }
        // indexed[i] = Pair(id, Produit)  — used in sales/reception loops
        val indexed = ids.zip(produits)

        // ── Fournisseurs ──────────────────────────────────────────────────────
        val idFournA = db.fournisseurDao().inserer(Fournisseur(nom = "Farid & Fils Distribution", telephone = "0550 12 34 56"))
        val idFournB = db.fournisseurDao().inserer(Fournisseur(nom = "Sodibo SARL",               telephone = "0770 55 44 33"))
        val idFournC = db.fournisseurDao().inserer(Fournisseur(nom = "Ben Salah Épicerie Gros",   telephone = "0661 87 65 43"))

        // ── Compte caissier de démonstration (PIN : 1234) ─────────────────────
        val caissierExistant = db.utilisateurDao().parRole(ROLE_CAISSIER)
        val caissierId = caissierExistant?.id ?: db.utilisateurDao().inserer(
            Utilisateur(nom = "Caissier démo", role = ROLE_CAISSIER, pinHash = sha256("1234"))
        )

        val maintenant = System.currentTimeMillis()
        val unJour = 86_400_000L

        // ── Réceptions marchandise ────────────────────────────────────────────
        // Réception 1 — il y a 25 jours (Farid & Fils : boissons)
        val recep1Id = db.receptionDao().insererReception(
            Reception(fournisseurId = idFournA, dateHeure = maintenant - 25 * unJour)
        )
        db.receptionDao().insererLignes(
            (0..11).map { i ->
                val (pid, prod) = indexed[i]
                LigneReception(receptionId = recep1Id, produitId = pid, quantite = 48.0, prixAchat = prod.prixAchat)
            }
        )

        // Réception 2 — il y a 10 jours (Sodibo : hygiène + ménage)
        val recep2Id = db.receptionDao().insererReception(
            Reception(fournisseurId = idFournB, dateHeure = maintenant - 10 * unJour)
        )
        db.receptionDao().insererLignes(
            (36..46).map { i ->
                val (pid, prod) = indexed[i]
                LigneReception(receptionId = recep2Id, produitId = pid, quantite = 24.0, prixAchat = prod.prixAchat)
            }
        )

        // Réception 3 — il y a 5 jours (Ben Salah : épicerie)
        val recep3Id = db.receptionDao().insererReception(
            Reception(fournisseurId = idFournC, dateHeure = maintenant - 5 * unJour)
        )
        db.receptionDao().insererLignes(
            (12..21).map { i ->
                val (pid, prod) = indexed[i]
                LigneReception(receptionId = recep3Id, produitId = pid, quantite = 30.0, prixAchat = prod.prixAchat)
            }
        )

        // ── Historique des ventes — 60 jours ─────────────────────────────────
        // Weights per product index (higher = more frequently sold)
        val poids = intArrayOf(
            // Boissons 0–11
            9, 7, 7, 6, 6, 12, 10, 8, 5, 5, 2, 3,
            // Épicerie 12–21
            7, 5, 3, 3, 3, 6,  3, 7, 3, 3,
            // Laitier 22–26
            7, 5, 4, 3, 2,
            // Fromagerie 27–28
            3, 2,
            // Boulangerie 29–35
            9, 4, 4, 5, 2, 3, 2,
            // Hygiène 36–41
            3, 2, 2, 2, 2, 1,
            // Ménage 42–46
            4, 3, 3, 5, 3,
            // Divers 47–48
            5, 2
        )
        val totalPoids = poids.sum()

        fun choisirIdx(rng: Random): Int {
            var r = rng.nextInt(totalPoids)
            for (i in poids.indices) { r -= poids[i]; if (r < 0) return i.coerceIn(0, indexed.lastIndex) }
            return 0
        }

        val rng = Random(42)
        repeat(60) { jourOffset ->
            val nbVentes = rng.nextInt(18, 35)
            repeat(nbVentes) {
                val heure = rng.nextInt(7, 21) * 3_600_000L + rng.nextLong(0, 3_600_000L)
                val dateVente = maintenant - (59 - jourOffset) * unJour + heure
                val nbLignes = rng.nextInt(1, 7)
                val lignes = (0 until nbLignes).map {
                    val idx = choisirIdx(rng)
                    val (pid, prod) = indexed[idx]
                    Triple(pid, prod, rng.nextInt(1, 4).toDouble())
                }
                val total = lignes.sumOf { (_, prod, qte) -> prod.prixVente * qte }
                val venteId = db.venteDao().insererVente(
                    Vente(caissierId = caissierId, dateHeure = dateVente, total = total)
                )
                db.venteDao().insererLignes(
                    lignes.map { (pid, prod, qte) ->
                        LigneVente(venteId = venteId, produitId = pid,
                                   nomProduit = prod.nom, quantite = qte, prixUnitaire = prod.prixVente)
                    }
                )
            }
        }
    }
}

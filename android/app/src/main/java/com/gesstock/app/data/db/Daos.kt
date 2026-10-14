package com.gesstock.app.data.db

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Embedded
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface UtilisateurDao {
    @Query("SELECT COUNT(*) FROM utilisateurs")
    suspend fun nombre(): Int

    @Query("SELECT * FROM utilisateurs WHERE id = :id LIMIT 1")
    suspend fun parId(id: Long): Utilisateur?

    @Query("SELECT * FROM utilisateurs WHERE role = :role LIMIT 1")
    suspend fun parRole(role: String): Utilisateur?

    @Insert
    suspend fun inserer(utilisateur: Utilisateur): Long

    @Update
    suspend fun modifier(utilisateur: Utilisateur)
}

data class CategorieAvecNombre(
    @Embedded val categorie: Categorie,
    val nombreProduits: Int
)

@Dao
interface CategorieDao {
    @Query(
        "SELECT c.*, (SELECT COUNT(*) FROM produits p WHERE p.categorieId = c.id) AS nombreProduits " +
            "FROM categories c ORDER BY c.nom"
    )
    fun toutesAvecNombre(): Flow<List<CategorieAvecNombre>>

    @Query("SELECT * FROM categories ORDER BY nom")
    suspend fun liste(): List<Categorie>

    @Insert
    suspend fun inserer(categorie: Categorie): Long

    @Update
    suspend fun modifier(categorie: Categorie)

    @Delete
    suspend fun supprimer(categorie: Categorie)

    @Query("DELETE FROM categories")
    suspend fun viderTout()
}

@Dao
interface ProduitDao {
    @Query(
        "SELECT * FROM produits WHERE nom LIKE '%' || :recherche || '%' " +
            "OR codeBarre LIKE '%' || :recherche || '%' ORDER BY nom"
    )
    fun rechercher(recherche: String): Flow<List<Produit>>

    @Query("SELECT * FROM produits ORDER BY nom")
    suspend fun tous(): List<Produit>

    @Query("SELECT * FROM produits WHERE codeBarre = :code LIMIT 1")
    suspend fun parCodeBarre(code: String): Produit?

    @Query("SELECT * FROM produits WHERE id = :id")
    suspend fun parId(id: Long): Produit?

    @Query("SELECT * FROM produits WHERE quantite <= quantiteMin ORDER BY quantite")
    fun enAlerte(): Flow<List<Produit>>

    @Query("SELECT COUNT(*) FROM produits WHERE quantite <= quantiteMin")
    suspend fun nombreEnAlerte(): Int

    @Query("UPDATE produits SET quantite = quantite + :delta WHERE id = :id")
    suspend fun ajusterStock(id: Long, delta: Double)

    @Insert
    suspend fun inserer(produit: Produit): Long

    @Update
    suspend fun modifier(produit: Produit)

    @Delete
    suspend fun supprimer(produit: Produit)

    @Query("DELETE FROM produits")
    suspend fun viderTout()
}

data class VenteAvecCaissier(
    @Embedded val vente: Vente,
    val nomCaissier: String
)

data class TopProduit(
    val nom: String,
    val quantiteVendue: Double,
    val total: Double
)

data class VenteParJour(
    val jour: String,
    val total: Double
)

data class VenteParCategorie(
    val categorie: String,
    val total: Double
)

@Dao
interface VenteDao {
    @Insert
    suspend fun insererVente(vente: Vente): Long

    @Insert
    suspend fun insererLignes(lignes: List<LigneVente>)

    @Query("DELETE FROM ventes")
    suspend fun viderVentes()

    @Query("DELETE FROM lignes_vente")
    suspend fun viderLignes()

    @Query(
        "SELECT v.*, u.nom AS nomCaissier FROM ventes v " +
            "JOIN utilisateurs u ON u.id = v.caissierId ORDER BY v.dateHeure DESC"
    )
    fun toutes(): Flow<List<VenteAvecCaissier>>

    @Query(
        "SELECT v.*, u.nom AS nomCaissier FROM ventes v " +
            "JOIN utilisateurs u ON u.id = v.caissierId " +
            "WHERE v.caissierId = :caissierId ORDER BY v.dateHeure DESC"
    )
    fun parCaissier(caissierId: Long): Flow<List<VenteAvecCaissier>>

    @Query("SELECT * FROM ventes WHERE id = :id")
    suspend fun parId(id: Long): Vente?

    @Query("SELECT * FROM lignes_vente WHERE venteId = :venteId")
    suspend fun lignes(venteId: Long): List<LigneVente>
    @Query("SELECT IFNULL(SUM(total), 0) FROM ventes WHERE dateHeure BETWEEN :debut AND :fin")
    suspend fun chiffreAffaires(debut: Long, fin: Long): Double

    @Query("SELECT COUNT(*) FROM ventes WHERE dateHeure BETWEEN :debut AND :fin")
    suspend fun nombreVentes(debut: Long, fin: Long): Int

    @Query(
        "SELECT IFNULL(SUM(lv.quantite * (lv.prixUnitaire - IFNULL(p.prixAchat, 0))), 0) " +
            "FROM lignes_vente lv JOIN ventes v ON v.id = lv.venteId " +
            "LEFT JOIN produits p ON p.id = lv.produitId " +
            "WHERE v.dateHeure BETWEEN :debut AND :fin"
    )
    suspend fun marge(debut: Long, fin: Long): Double

    @Query(
        "SELECT lv.nomProduit AS nom, SUM(lv.quantite) AS quantiteVendue, " +
            "SUM(lv.quantite * lv.prixUnitaire) AS total " +
            "FROM lignes_vente lv JOIN ventes v ON v.id = lv.venteId " +
            "WHERE v.dateHeure BETWEEN :debut AND :fin " +
            "GROUP BY lv.nomProduit ORDER BY quantiteVendue DESC LIMIT 5"
    )
    suspend fun topProduits(debut: Long, fin: Long): List<TopProduit>

    @Query(
        "SELECT strftime('%d/%m', dateHeure / 1000, 'unixepoch', 'localtime') AS jour, " +
            "SUM(total) AS total FROM ventes WHERE dateHeure BETWEEN :debut AND :fin " +
            "GROUP BY jour ORDER BY MIN(dateHeure)"
    )
    suspend fun ventesParJour(debut: Long, fin: Long): List<VenteParJour>

    @Query(
        "SELECT IFNULL(c.nom, 'Autre') AS categorie, " +
            "SUM(lv.quantite * lv.prixUnitaire) AS total " +
            "FROM lignes_vente lv JOIN ventes v ON v.id = lv.venteId " +
            "JOIN produits p ON p.id = lv.produitId " +
            "LEFT JOIN categories c ON c.id = p.categorieId " +
            "WHERE v.dateHeure BETWEEN :debut AND :fin " +
            "GROUP BY c.id ORDER BY total DESC"
    )
    suspend fun ventesParCategorie(debut: Long, fin: Long): List<VenteParCategorie>

    @Query(
        "SELECT v.*, u.nom AS nomCaissier FROM ventes v " +
            "JOIN utilisateurs u ON u.id = v.caissierId ORDER BY v.dateHeure DESC LIMIT 5"
    )
    suspend fun dernieres(): List<VenteAvecCaissier>
}

@Dao
interface FournisseurDao {
    @Query("SELECT * FROM fournisseurs ORDER BY nom")
    fun tous(): Flow<List<Fournisseur>>

    @Query("SELECT * FROM fournisseurs ORDER BY nom")
    suspend fun liste(): List<Fournisseur>

    @Insert
    suspend fun inserer(fournisseur: Fournisseur): Long

    @Delete
    suspend fun supprimer(fournisseur: Fournisseur)

    @Query("DELETE FROM fournisseurs")
    suspend fun viderTout()
}

@Dao
interface ReceptionDao {
    @Insert
    suspend fun insererReception(reception: Reception): Long

    @Insert
    suspend fun insererLignes(lignes: List<LigneReception>)
}

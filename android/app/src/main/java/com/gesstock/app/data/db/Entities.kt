package com.gesstock.app.data.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "utilisateurs")
data class Utilisateur(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nom: String,
    val role: String, // "manager" ou "caissier"
    val pinHash: String
)

@Entity(tableName = "categories")
data class Categorie(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nom: String,
    val couleur: Int
)

@Entity(
    tableName = "produits",
    indices = [Index(value = ["codeBarre"], unique = true)]
)
data class Produit(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nom: String,
    val codeBarre: String? = null,
    val categorieId: Long? = null,
    val prixAchat: Double,
    val prixVente: Double,
    val quantite: Double,
    val quantiteMin: Double,
    val unite: String,
    val dateAjout: Long = System.currentTimeMillis()
)

@Entity(tableName = "ventes")
data class Vente(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val caissierId: Long,
    val dateHeure: Long,
    val total: Double
)

@Entity(tableName = "lignes_vente")
data class LigneVente(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val venteId: Long,
    val produitId: Long,
    val nomProduit: String,
    val quantite: Double,
    val prixUnitaire: Double
)

@Entity(tableName = "fournisseurs")
data class Fournisseur(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nom: String,
    val telephone: String
)

@Entity(tableName = "receptions")
data class Reception(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val fournisseurId: Long?,
    val dateHeure: Long
)

@Entity(tableName = "lignes_reception")
data class LigneReception(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val receptionId: Long,
    val produitId: Long,
    val quantite: Double,
    val prixAchat: Double?
)

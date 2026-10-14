package com.gesstock.app.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        Utilisateur::class,
        Categorie::class,
        Produit::class,
        Vente::class,
        LigneVente::class,
        Fournisseur::class,
        Reception::class,
        LigneReception::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun utilisateurDao(): UtilisateurDao
    abstract fun categorieDao(): CategorieDao
    abstract fun produitDao(): ProduitDao
    abstract fun venteDao(): VenteDao
    abstract fun fournisseurDao(): FournisseurDao
    abstract fun receptionDao(): ReceptionDao

    companion object {
        fun creer(context: Context): AppDatabase =
            Room.databaseBuilder(context.applicationContext, AppDatabase::class.java, "gesstock.db")
                .build()
    }
}

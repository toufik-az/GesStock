package com.gesstock.app.data

import com.gesstock.app.data.db.Utilisateur

const val ROLE_MANAGER = "manager"
const val ROLE_CAISSIER = "caissier"

object Session {
    var utilisateur: Utilisateur? = null

    val estManager: Boolean
        get() = utilisateur?.role == ROLE_MANAGER

    fun deconnecter() {
        utilisateur = null
    }
}

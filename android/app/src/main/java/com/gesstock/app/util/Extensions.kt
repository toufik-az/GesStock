package com.gesstock.app.util

import android.content.Context
import androidx.fragment.app.Fragment
import com.gesstock.app.StockApplication
import com.gesstock.app.data.db.AppDatabase
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

fun Double.versDa(): String = String.format(Locale.FRANCE, "%,.2f DA", this)

/** Compact format without decimals — used in narrow dashboard stat cards. */
fun Double.versDaCompact(): String = String.format(Locale.FRANCE, "%,.0f DA", this)

fun Double.versQte(): String =
    if (this % 1.0 == 0.0) this.toLong().toString() else this.toString()

fun Long.versDateFr(): String =
    SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.FRANCE).format(Date(this))

fun sha256(texte: String): String =
    MessageDigest.getInstance("SHA-256")
        .digest(texte.toByteArray())
        .joinToString("") { "%02x".format(it) }

val Fragment.db: AppDatabase
    get() = (requireActivity().application as StockApplication).db

fun Context.appDb(): AppDatabase = (applicationContext as StockApplication).db

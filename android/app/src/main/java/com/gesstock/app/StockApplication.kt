package com.gesstock.app

import android.app.Application
import com.gesstock.app.data.db.AppDatabase

class StockApplication : Application() {
    val db: AppDatabase by lazy { AppDatabase.creer(this) }
}

package com.gesstock.app

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavController
import kotlinx.coroutines.launch
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.navigateUp
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import com.gesstock.app.data.Session
import com.gesstock.app.databinding.ActivityMainBinding
import com.gesstock.app.ui.login.LoginActivity
import com.gesstock.app.util.insererDonneesDemonstration

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var appBarConfiguration: AppBarConfiguration
    private lateinit var navController: NavController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (Session.utilisateur == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        androidx.core.view.WindowCompat.setDecorFitsSystemWindows(window, false)
        androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, insets ->
            val bars = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars() or androidx.core.view.WindowInsetsCompat.Type.ime())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            androidx.core.view.WindowInsetsCompat.CONSUMED
        }
        androidx.core.view.WindowCompat.getInsetsController(window, binding.root).isAppearanceLightStatusBars = false
        setSupportActionBar(binding.toolbar)

        val navHost = supportFragmentManager.findFragmentById(R.id.navHost) as NavHostFragment
        navController = navHost.navController

        val graph = navController.navInflater.inflate(R.navigation.nav_graph)
        graph.setStartDestination(if (Session.estManager) R.id.dashboardFragment else R.id.caisseFragment)
        navController.graph = graph

        binding.bottomNav.inflateMenu(
            if (Session.estManager) R.menu.bottom_nav_manager else R.menu.bottom_nav_caissier
        )
        binding.bottomNav.setupWithNavController(navController)

        appBarConfiguration = AppBarConfiguration(
            setOf(
                R.id.dashboardFragment, R.id.caisseFragment, R.id.produitsFragment,
                R.id.historiqueFragment, R.id.parametresFragment
            )
        )
        setupActionBarWithNavController(navController, appBarConfiguration)

        // Auto-load demo data on very first launch (empty database)
        lifecycleScope.launch {
            val db = (application as StockApplication).db
            if (db.produitDao().tous().isEmpty()) {
                insererDonneesDemonstration(db)
            }
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.toolbar_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return if (item.itemId == R.id.action_deconnexion) {
            Session.deconnecter()
            getSharedPreferences("gesstock_prefs", Context.MODE_PRIVATE)
                .edit().remove("session_user_id").apply()
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            true
        } else {
            super.onOptionsItemSelected(item)
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        return navController.navigateUp(appBarConfiguration) || super.onSupportNavigateUp()
    }
}

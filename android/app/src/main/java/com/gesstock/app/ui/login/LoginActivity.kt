package com.gesstock.app.ui.login

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.gesstock.app.MainActivity
import com.gesstock.app.R
import com.gesstock.app.StockApplication
import com.gesstock.app.data.ROLE_CAISSIER
import com.gesstock.app.data.ROLE_MANAGER
import com.gesstock.app.data.Session
import com.gesstock.app.data.db.Utilisateur
import com.gesstock.app.databinding.ActivityLoginBinding
import com.gesstock.app.util.sha256
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val db by lazy { (application as StockApplication).db }
    private val prefs by lazy { getSharedPreferences("gesstock_prefs", Context.MODE_PRIVATE) }
    private var roleChoisi = ROLE_MANAGER

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, insets ->
            val bars = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars() or androidx.core.view.WindowInsetsCompat.Type.ime())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            androidx.core.view.WindowInsetsCompat.CONSUMED
        }

        // Restauration automatique de la session
        val savedId = prefs.getLong("session_user_id", -1L)
        if (savedId != -1L) {
            lifecycleScope.launch {
                val user = db.utilisateurDao().parId(savedId)
                if (user != null) {
                    Session.utilisateur = user
                    startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                    finish()
                    return@launch
                }
            }
        }

        binding.toggleRole.check(R.id.btnRoleManager)
        binding.toggleRole.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                roleChoisi = if (checkedId == R.id.btnRoleManager) ROLE_MANAGER else ROLE_CAISSIER
            }
        }

        binding.btnConnexion.setOnClickListener { connecter() }

        lifecycleScope.launch {
            if (db.utilisateurDao().nombre() == 0) premierLancement()
        }
    }

    private fun premierLancement() {
        val champ = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = getString(R.string.nouveau_pin)
            textSize = 22f
        }
        val conteneur = FrameLayout(this).apply {
            setPadding(60, 20, 60, 0)
            addView(champ)
        }
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.creation_compte_manager)
            .setMessage(R.string.msg_creation_manager)
            .setView(conteneur)
            .setCancelable(false)
            .setPositiveButton(R.string.creer) { _, _ ->
                val pin = champ.text.toString()
                if (pin.length in 4..6) {
                    lifecycleScope.launch {
                        db.utilisateurDao().inserer(
                            Utilisateur(nom = getString(R.string.role_manager), role = ROLE_MANAGER, pinHash = sha256(pin))
                        )
                        Toast.makeText(this@LoginActivity, R.string.enregistre, Toast.LENGTH_SHORT).show()
                        proposerCaissierPremierLancement()
                    }
                } else {
                    Toast.makeText(this, R.string.pin_invalide, Toast.LENGTH_SHORT).show()
                    premierLancement()
                }
            }
            .show()
    }

    private fun proposerCaissierPremierLancement() {
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.creation_compte_caissier)
            .setMessage(R.string.msg_proposition_caissier)
            .setCancelable(false)
            .setPositiveButton(R.string.creer) { _, _ -> dialoguePinCaissier() }
            .setNegativeButton(R.string.plus_tard, null)   // FIX: was missing — user was blocked with no way to skip
            .show()
    }

    private fun dialoguePinCaissier() {
        val champ = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = getString(R.string.nouveau_pin)
            textSize = 22f
        }
        val conteneur = FrameLayout(this).apply {
            setPadding(60, 20, 60, 0)
            addView(champ)
        }
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.pin_caissier_nouveau)
            .setView(conteneur)
            .setCancelable(false)
            .setPositiveButton(R.string.creer) { _, _ ->
                val pin = champ.text.toString()
                if (pin.length in 4..6) {
                    lifecycleScope.launch {
                        db.utilisateurDao().inserer(
                            Utilisateur(nom = getString(R.string.role_caissier), role = ROLE_CAISSIER, pinHash = sha256(pin))
                        )
                        Toast.makeText(this@LoginActivity, R.string.compte_caissier_cree, Toast.LENGTH_LONG).show()
                    }
                } else {
                    Toast.makeText(this, R.string.pin_invalide, Toast.LENGTH_SHORT).show()
                    dialoguePinCaissier()
                }
            }
            .show()
    }

    private fun connecter() {
        val pin = binding.etPin.text?.toString().orEmpty()
        binding.btnConnexion.isEnabled = false   // FIX: prevent double-tap during async auth
        lifecycleScope.launch {
            val utilisateur = db.utilisateurDao().parRole(roleChoisi)
            when {
                utilisateur == null -> {
                    Toast.makeText(this@LoginActivity, R.string.compte_caissier_inexistant, Toast.LENGTH_LONG).show()
                    binding.btnConnexion.isEnabled = true
                }

                pin.isEmpty() -> {
                    Toast.makeText(this@LoginActivity, R.string.pin_incorrect, Toast.LENGTH_SHORT).show()
                    binding.btnConnexion.isEnabled = true
                }

                utilisateur.pinHash == sha256(pin) -> {
                    Session.utilisateur = utilisateur
                    prefs.edit().putLong("session_user_id", utilisateur.id).apply()
                    startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                    finish()
                    // intentionally not re-enabling: activity is finishing
                }

                else -> {
                    Toast.makeText(this@LoginActivity, R.string.pin_incorrect, Toast.LENGTH_SHORT).show()
                    binding.btnConnexion.isEnabled = true
                }
            }
        }
    }
}

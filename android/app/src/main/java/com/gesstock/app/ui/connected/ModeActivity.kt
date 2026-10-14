package com.gesstock.app.ui.connected

import android.content.Intent
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.gesstock.app.ui.login.LoginActivity
import com.google.android.material.button.MaterialButton

/** Local data stays on the phone; connected data belongs to the shared store. */
class ModeActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val spacing = (24 * resources.displayMetrics.density).toInt()
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_VERTICAL
            setBackgroundColor(0xFFF8F9FA.toInt())
        }
        ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(spacing + bars.left, spacing + bars.top, spacing + bars.right, spacing + bars.bottom)
            insets
        }
        fun label(text: String, size: Float, color: Int) {
            content.addView(TextView(this).apply {
                this.text = text
                textSize = size
                setTextColor(color)
                setPadding(0, spacing / 2, 0, spacing / 2)
            })
        }
        label("GesStock", 38f, 0xFF1A1A2E.toInt())
        label("Votre magasin, sur tous vos écrans.", 20f, 0xFF111827.toInt())
        label("Retrouvez les produits et les ventes de votre ordinateur avec le même compte. Une connexion Internet est nécessaire.", 16f, 0xFF6B7280.toInt())
        content.addView(MaterialButton(this).apply {
            text = "Ouvrir mon magasin connecté"
            setOnClickListener { startActivity(Intent(this@ModeActivity, ConnectedActivity::class.java)) }
        })
        label("Données locales existantes", 18f, 0xFF111827.toInt())
        label("Le mode local conserve les données de ce téléphone. Elles ne sont pas synchronisées avec votre ordinateur.", 14f, 0xFF6B7280.toInt())
        content.addView(MaterialButton(this, null, com.google.android.material.R.attr.materialButtonOutlinedStyle).apply {
            text = "Ouvrir le mode local"
            setOnClickListener { startActivity(Intent(this@ModeActivity, LoginActivity::class.java)) }
        })
        val scroll = android.widget.ScrollView(this).apply { isFillViewport = true; addView(content) }
        setContentView(scroll)
    }
}

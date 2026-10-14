package com.gesstock.app.ui.dashboard

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.gesstock.app.R
import com.gesstock.app.data.db.TopProduit
import com.gesstock.app.data.db.VenteParCategorie
import com.gesstock.app.data.db.VenteParJour
import com.gesstock.app.databinding.FragmentDashboardBinding
import com.gesstock.app.util.db
import com.gesstock.app.util.versDa
import com.gesstock.app.util.versDaCompact
import com.gesstock.app.util.versDateFr
import com.gesstock.app.util.versQte
import java.util.Locale
import androidx.core.content.ContextCompat
import kotlinx.coroutines.launch
import java.util.Calendar

class DashboardFragment : Fragment() {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.chipsPeriode.setOnCheckedStateChangeListener { _, _ -> charger() }
        binding.btnNouvelleVente.setOnClickListener { findNavController().navigate(R.id.caisseFragment) }
        binding.btnReception.setOnClickListener { findNavController().navigate(R.id.receptionFragment) }
        binding.cardAlertes.setOnClickListener { findNavController().navigate(R.id.alertesFragment) }
        binding.btnVoirTout.setOnClickListener { findNavController().navigate(R.id.historiqueFragment) }
    }

    override fun onResume() {
        super.onResume()
        charger()
    }

    private fun debutPeriode(): Long {
        val calendrier = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        when {
            binding.chipSemaine.isChecked -> calendrier.add(Calendar.DAY_OF_YEAR, -6)
            binding.chipMois.isChecked -> calendrier.add(Calendar.DAY_OF_YEAR, -29)
        }
        return calendrier.timeInMillis
    }

    private fun charger() {
        viewLifecycleOwner.lifecycleScope.launch {
            val debut = debutPeriode()
            val fin = System.currentTimeMillis()

            val ca = db.venteDao().chiffreAffaires(debut, fin)
            val nb = db.venteDao().nombreVentes(debut, fin)
            val marge = db.venteDao().marge(debut, fin)
            val alertes = db.produitDao().nombreEnAlerte()
            val top = db.venteDao().topProduits(debut, fin)
            val parCategorie = db.venteDao().ventesParCategorie(debut, fin)
            val dernieres = db.venteDao().dernieres()

            if (_binding == null) return@launch
            binding.tvCa.text = ca.versDa()
            binding.tvNbVentes.text = nb.toString()
            binding.tvMarge.text = marge.versDaCompact()
            binding.tvAlertes.text = alertes.toString()

            binding.llTop.removeAllViews()
            if (top.isEmpty()) {
                binding.llTop.addView(creerLigne(getString(R.string.aucune_donnee)))
            } else {
                top.forEachIndexed { index, produit ->
                    binding.llTop.addView(
                        creerLigne("${index + 1}. ${produit.nom}\n${produit.quantiteVendue.versQte()} vendus · ${produit.total.versDa()}")
                    )
                }
            }

            binding.llDernieres.removeAllViews()
            if (dernieres.isEmpty()) {
                binding.llDernieres.addView(creerLigne(getString(R.string.aucune_vente)))
            } else {
                dernieres.forEach { v ->
                    binding.llDernieres.addView(
                        creerLigne("${v.vente.dateHeure.versDateFr()}\n${v.vente.total.versDa()}")
                    )
                }
            }

            afficherGraphiques(parCategorie, top)
        }
    }

    private val palette = intArrayOf(
        0xFF2E7D32.toInt(), // vert
        0xFF1565C0.toInt(), // bleu
        0xFFF9A825.toInt(), // ambre
        0xFFC62828.toInt(), // rouge
        0xFF00838F.toInt(), // sarcelle
        0xFF6A1B9A.toInt()  // violet
    )

    private fun afficherGraphiques(parCategorie: List<VenteParCategorie>, top: List<TopProduit>) {
        binding.imgBarres.post {
            if (_binding == null) return@post
            val w = binding.imgBarres.width
            val h = binding.imgBarres.height
            if (w > 0 && h > 0) binding.imgBarres.setImageBitmap(dessinerBarres(parCategorie, w, h))
        }
        binding.imgCamembert.post {
            if (_binding == null) return@post
            val w = binding.imgCamembert.width
            val h = binding.imgCamembert.height
            if (w > 0 && h > 0) binding.imgCamembert.setImageBitmap(dessinerCamembert(top, w, h))
        }

        binding.llLegende.removeAllViews()
        val totalGlobal = top.sumOf { it.total }
        top.forEachIndexed { index, item ->
            val pourcent = if (totalGlobal > 0) (item.total / totalGlobal * 100).toInt() else 0
            binding.llLegende.addView(creerLigneLegende(palette[index % palette.size], "${item.nom}  —  $pourcent%"))
        }
    }

    private fun dessinerBarres(donnees: List<VenteParCategorie>, w: Int, h: Int): Bitmap {
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        if (donnees.isEmpty()) return bmp
        val paddingBas = 52f
        val paddingHaut = 34f
        val max = donnees.maxOf { it.total }.coerceAtLeast(1.0)
        val espace = w.toFloat() / donnees.size
        val largeurBarre = (espace * 0.60f).coerceAtMost(88f)
        val couleurs = palette  // chaque catégorie prend une couleur différente de la palette
        val pTexte = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = ContextCompat.getColor(requireContext(), R.color.gris)
            textSize = 20f
            textAlign = Paint.Align.CENTER
        }
        val pValeur = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = ContextCompat.getColor(requireContext(), R.color.texte)
            textSize = 20f
            isFakeBoldText = true
            textAlign = Paint.Align.CENTER
        }
        val pBarre = Paint(Paint.ANTI_ALIAS_FLAG)
        donnees.forEachIndexed { i, d ->
            pBarre.color = couleurs[i % couleurs.size]
            val ratio = (d.total / max).toFloat()
            val hauteurBarre = (h - paddingBas - paddingHaut) * ratio
            val cx = espace * i + espace / 2
            val left = cx - largeurBarre / 2
            val topBarre = h - paddingBas - hauteurBarre
            canvas.drawRoundRect(left, topBarre, left + largeurBarre, h - paddingBas, 12f, 12f, pBarre)
            if (d.total > 0) {
                val k = d.total / 1000.0
                val etiquette = if (k >= 1) String.format(Locale.FRANCE, "%.0fk", k) else d.total.toInt().toString()
                canvas.drawText(etiquette, cx, topBarre - 8f, pValeur)
            }
            // Truncate category name to fit under the bar
            val label = if (d.categorie.length > 7) d.categorie.take(6) + "." else d.categorie
            canvas.drawText(label, cx, h - 18f, pTexte)
        }
        return bmp
    }

    private fun dessinerCamembert(top: List<TopProduit>, w: Int, h: Int): Bitmap {
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val totalGlobal = top.sumOf { it.total }
        if (totalGlobal <= 0) return bmp
        val taille = minOf(w, h).toFloat() - 24f
        val left = (w - taille) / 2
        val top0 = (h - taille) / 2
        val rect = RectF(left, top0, left + taille, top0 + taille)
        val p = Paint(Paint.ANTI_ALIAS_FLAG)
        var startAngle = -90f
        top.forEachIndexed { i, item ->
            val sweep = (item.total / totalGlobal * 360.0).toFloat()
            p.color = palette[i % palette.size]
            canvas.drawArc(rect, startAngle, sweep, true, p)
            startAngle += sweep
        }
        // Centre adapté au thème (clair/sombre) pour l'effet anneau.
        p.color = ContextCompat.getColor(requireContext(), R.color.surface_color)
        canvas.drawCircle(left + taille / 2, top0 + taille / 2, taille * 0.22f, p)
        return bmp
    }

    private fun creerLigneLegende(couleur: Int, texte: String): View =
        LinearLayout(requireContext()).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, 6, 0, 6)
            addView(View(requireContext()).apply {
                layoutParams = LinearLayout.LayoutParams(28, 28).also { it.marginEnd = 12 }
                setBackgroundColor(couleur)
            })
            addView(TextView(requireContext()).apply {
                text = texte
                textSize = 15f
                setTextColor(ContextCompat.getColor(requireContext(), R.color.texte))
            })
        }

    private fun creerLigne(texte: String): TextView =
        TextView(requireContext()).apply {
            text = texte
            textSize = 14f
            setTextColor(ContextCompat.getColor(requireContext(), R.color.texte))
            val spacing = (10 * resources.displayMetrics.density).toInt()
            setPadding(0, spacing, 0, spacing)
        }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

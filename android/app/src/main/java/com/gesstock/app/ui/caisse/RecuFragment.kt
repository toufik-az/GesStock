package com.gesstock.app.ui.caisse

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.gesstock.app.R
import com.gesstock.app.databinding.FragmentRecuBinding
import com.gesstock.app.util.db
import com.gesstock.app.util.versDa
import com.gesstock.app.util.versDateFr
import com.gesstock.app.util.versQte
import kotlinx.coroutines.launch

class RecuFragment : Fragment() {

    private var _binding: FragmentRecuBinding? = null
    private val binding get() = _binding!!
    private var texteRecu = ""

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentRecuBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val venteId = requireArguments().getLong("venteId")
        val nomMagasin = requireContext()
            .getSharedPreferences("gesstock_prefs", Context.MODE_PRIVATE)
            .getString("nom_magasin", getString(R.string.app_name)) ?: getString(R.string.app_name)

        binding.btnPartager.setOnClickListener {
            val intention = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, texteRecu)
            }
            startActivity(Intent.createChooser(intention, getString(R.string.partager)))
        }

        binding.btnNouvelleVente.setOnClickListener {
            if (!findNavController().popBackStack(R.id.caisseFragment, false)) {
                findNavController().navigate(R.id.caisseFragment)
            }
        }

        viewLifecycleOwner.lifecycleScope.launch {
            val vente = db.venteDao().parId(venteId) ?: return@launch
            val lignes = db.venteDao().lignes(venteId)

            binding.tvMagasin.text = nomMagasin
            binding.tvDate.text = vente.dateHeure.versDateFr()
            // FIX: was hardcoded empty string — lookup caissier name from DB
            val caissier = db.utilisateurDao().parId(vente.caissierId)
            binding.tvCaissier.text = caissier?.nom.orEmpty()
            binding.tvTotal.text = vente.total.versDa()

            binding.llLignes.removeAllViews()
            val constructeur = StringBuilder()
            constructeur.appendLine(nomMagasin)
            constructeur.appendLine(vente.dateHeure.versDateFr())
            constructeur.appendLine("--------------------------")

            lignes.forEach { ligne ->
                val sousTotal = ligne.quantite * ligne.prixUnitaire
                val texte = "${ligne.nomProduit}\n   ${ligne.quantite.versQte()} × ${ligne.prixUnitaire.versDa()} = ${sousTotal.versDa()}"
                binding.llLignes.addView(TextView(requireContext()).apply {
                    this.text = texte
                    textSize = 14f
                    setPadding(0, 8, 0, 8)
                })
                constructeur.appendLine(texte)
            }

            constructeur.appendLine("--------------------------")
            constructeur.appendLine("${getString(R.string.total)} : ${vente.total.versDa()}")
            constructeur.appendLine(getString(R.string.merci))
            texteRecu = constructeur.toString()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

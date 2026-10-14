package com.gesstock.app.ui.produits

import android.app.Activity
import android.content.Intent
import android.database.sqlite.SQLiteConstraintException
import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.gesstock.app.R
import com.gesstock.app.data.db.Categorie
import com.gesstock.app.data.db.Produit
import com.gesstock.app.databinding.FragmentProduitFormBinding
import com.gesstock.app.ui.scanner.ScannerActivity
import com.gesstock.app.util.db
import com.gesstock.app.util.versQte
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.launch

class ProduitFormFragment : Fragment() {

    private var _binding: FragmentProduitFormBinding? = null
    private val binding get() = _binding!!

    private var produitExistant: Produit? = null
    private var categories: List<Categorie> = emptyList()
    private val unites = listOf("Pièce", "Kg", "Litre", "Boîte", "Carton")

    private val paletteCouleurs = listOf(
        0xFF00695C.toInt(), 0xFFD32F2F.toInt(), 0xFF1976D2.toInt(),
        0xFFFFA000.toInt(), 0xFF7B1FA2.toInt(), 0xFF388E3C.toInt(),
        0xFF5D4037.toInt(), 0xFF455A64.toInt()
    )

    private val scanLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { resultat ->
            if (resultat.resultCode == Activity.RESULT_OK) {
                binding.etCodeBarre.setText(resultat.data?.getStringExtra(ScannerActivity.EXTRA_CODE))
            }
        }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentProduitFormBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.spUnite.adapter =
            ArrayAdapter(requireContext(), android.R.layout.simple_spinner_dropdown_item, unites)

        binding.btnScanner.setOnClickListener {
            scanLauncher.launch(Intent(requireContext(), ScannerActivity::class.java))
        }

        binding.btnNouvelleCategorie.setOnClickListener { dialogueNouvelleCategorie() }
        binding.btnEnregistrer.setOnClickListener { enregistrer() }
        binding.btnSupprimer.setOnClickListener { confirmerSuppression() }

        val codeBarreInitial = arguments?.getString("codeBarre").orEmpty()
        if (codeBarreInitial.isNotEmpty()) binding.etCodeBarre.setText(codeBarreInitial)

        val produitId = arguments?.getLong("produitId", -1L) ?: -1L

        viewLifecycleOwner.lifecycleScope.launch {
            chargerCategories()
            if (produitId >= 0) {
                val produit = db.produitDao().parId(produitId) ?: return@launch
                produitExistant = produit
                requireActivity().title = getString(R.string.modifier_produit)   // FIX: was always "Ajouter un produit"
                binding.etNom.setText(produit.nom)
                binding.etCodeBarre.setText(produit.codeBarre.orEmpty())
                binding.etPrixAchat.setText(produit.prixAchat.versQte())
                binding.etPrixVente.setText(produit.prixVente.versQte())
                binding.etQuantite.setText(produit.quantite.versQte())
                binding.etQuantiteMin.setText(produit.quantiteMin.versQte())
                val indexUnite = unites.indexOf(produit.unite)
                if (indexUnite >= 0) binding.spUnite.setSelection(indexUnite)
                val indexCategorie = categories.indexOfFirst { it.id == produit.categorieId }
                if (indexCategorie >= 0) binding.spCategorie.setSelection(indexCategorie + 1)
                binding.btnSupprimer.visibility = View.VISIBLE
            }
        }
    }

    private suspend fun chargerCategories(idASelectionner: Long? = null) {
        categories = db.categorieDao().liste()
        val noms = listOf(getString(R.string.sans_categorie)) + categories.map { it.nom }
        binding.spCategorie.adapter =
            ArrayAdapter(requireContext(), android.R.layout.simple_spinner_dropdown_item, noms)
        if (idASelectionner != null) {
            val index = categories.indexOfFirst { it.id == idASelectionner }
            if (index >= 0) binding.spCategorie.setSelection(index + 1)
        }
    }

    private fun dialogueNouvelleCategorie() {
        val champ = EditText(requireContext()).apply {
            inputType = InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
            hint = getString(R.string.nom_categorie)
        }
        val conteneur = FrameLayout(requireContext()).apply {
            setPadding(48, 16, 48, 0)
            addView(champ)
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.nouvelle_categorie)
            .setView(conteneur)
            .setNegativeButton(R.string.annuler, null)
            .setPositiveButton(R.string.creer) { _, _ ->
                val nom = champ.text.toString().trim()
                if (nom.isNotEmpty()) {
                    viewLifecycleOwner.lifecycleScope.launch {
                        val couleur = paletteCouleurs[categories.size % paletteCouleurs.size]
                        val id = db.categorieDao().inserer(Categorie(nom = nom, couleur = couleur))
                        chargerCategories(id)
                    }
                }
            }
            .show()
    }

    private fun enregistrer() {
        val nom = binding.etNom.text?.toString()?.trim().orEmpty()
        val prixVente = binding.etPrixVente.text?.toString()?.toDoubleOrNull()
        if (nom.isEmpty()) {
            binding.etNom.error = getString(R.string.champ_obligatoire)
            return
        }
        if (prixVente == null) {
            binding.etPrixVente.error = getString(R.string.champ_obligatoire)
            return
        }
        val codeBarre = binding.etCodeBarre.text?.toString()?.trim().orEmpty().ifEmpty { null }
        val indexCategorie = binding.spCategorie.selectedItemPosition
        val categorieId = if (indexCategorie > 0) categories[indexCategorie - 1].id else null

        val produit = Produit(
            id = produitExistant?.id ?: 0,
            nom = nom,
            codeBarre = codeBarre,
            categorieId = categorieId,
            prixAchat = binding.etPrixAchat.text?.toString()?.toDoubleOrNull() ?: 0.0,
            prixVente = prixVente,
            quantite = binding.etQuantite.text?.toString()?.toDoubleOrNull() ?: 0.0,
            quantiteMin = binding.etQuantiteMin.text?.toString()?.toDoubleOrNull() ?: 5.0,
            unite = unites[binding.spUnite.selectedItemPosition],
            dateAjout = produitExistant?.dateAjout ?: System.currentTimeMillis()
        )

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                if (produitExistant == null) db.produitDao().inserer(produit)
                else db.produitDao().modifier(produit)
                Toast.makeText(requireContext(), R.string.produit_enregistre, Toast.LENGTH_SHORT).show()
                findNavController().popBackStack()
            } catch (e: SQLiteConstraintException) {
                Toast.makeText(requireContext(), R.string.code_barre_existant, Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun confirmerSuppression() {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.confirmer_suppression)
            .setMessage(R.string.supprimer_produit_question)
            .setNegativeButton(R.string.annuler, null)
            .setPositiveButton(R.string.supprimer) { _, _ ->
                viewLifecycleOwner.lifecycleScope.launch {
                    produitExistant?.let { db.produitDao().supprimer(it) }
                    findNavController().popBackStack()
                }
            }
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

package com.gesstock.app.ui.caisse

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.room.withTransaction
import com.gesstock.app.R
import com.gesstock.app.data.Session
import com.gesstock.app.data.ROLE_CAISSIER
import com.gesstock.app.data.db.LigneVente
import com.gesstock.app.data.db.Produit
import com.gesstock.app.data.db.Vente
import com.gesstock.app.databinding.FragmentCaisseBinding
import com.gesstock.app.databinding.ItemPanierBinding
import com.gesstock.app.ui.scanner.ScannerActivity
import com.gesstock.app.util.db
import com.gesstock.app.util.versDa
import com.gesstock.app.util.versQte
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.core.widget.doAfterTextChanged
import kotlinx.coroutines.launch

data class LignePanier(val produit: Produit, var quantite: Double)

class CaisseFragment : Fragment() {

    private var _binding: FragmentCaisseBinding? = null
    private val binding get() = _binding!!

    private val panier = mutableListOf<LignePanier>()
    private lateinit var adapter: PanierAdapter

    private val scanLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { resultat ->
            if (resultat.resultCode == Activity.RESULT_OK) {
                resultat.data?.getStringExtra(ScannerActivity.EXTRA_CODE)?.let { ajouterParCode(it) }
            }
        }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentCaisseBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = PanierAdapter(panier) { rafraichir() }
        binding.rvPanier.layoutManager = LinearLayoutManager(requireContext())
        binding.rvPanier.adapter = adapter

        binding.btnScanner.setOnClickListener {
            scanLauncher.launch(Intent(requireContext(), ScannerActivity::class.java))
        }

        binding.btnAjouterCode.setOnClickListener {
            val code = binding.etCode.text?.toString()?.trim().orEmpty()
            if (code.isNotEmpty()) {
                ajouterParCode(code)
                binding.etCode.setText("")
            }
        }

        binding.btnValiderVente.setOnClickListener { confirmerVente() }
        rafraichir()
    }

    private fun ajouterParCode(code: String) {
        viewLifecycleOwner.lifecycleScope.launch {
            val produit = db.produitDao().parCodeBarre(code)
            if (produit == null) {
                if (Session.utilisateur?.role == ROLE_CAISSIER) {
                    dialogueCreationRapide(code)
                } else {
                    MaterialAlertDialogBuilder(requireContext())
                        .setTitle(R.string.produit_introuvable)
                        .setMessage(R.string.produit_introuvable_question)
                        .setNegativeButton(R.string.annuler, null)
                        .setPositiveButton(R.string.oui) { _, _ ->
                            findNavController().navigate(
                                R.id.produitFormFragment,
                                bundleOf("codeBarre" to code)
                            )
                        }
                        .show()
                }
            } else {
                ajouterProduit(produit)
            }
        }
    }

    private fun dialogueCreationRapide(code: String) {
        val champNom = EditText(requireContext()).apply {
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_WORDS
            hint = getString(R.string.nom_produit_court)
            textSize = 18f
        }
        val champAchat = EditText(requireContext()).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
            hint = getString(R.string.prix_achat_da)
            textSize = 18f
        }
        val champVente = EditText(requireContext()).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
            hint = getString(R.string.prix_vente_da)
            textSize = 18f
        }
        val etiquette = TextView(requireContext()).apply {
            text = "Code : $code"
            textSize = 13f
            setTextColor(resources.getColor(R.color.gris, null))
            setPadding(0, 0, 0, 8)
        }
        val conteneur = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(60, 16, 60, 0)
            addView(etiquette)
            addView(champNom)
            addView(champAchat)
            addView(champVente)
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.creer_produit_rapide)
            .setView(conteneur)
            .setNegativeButton(R.string.annuler, null)
            .setPositiveButton(R.string.creer) { _, _ ->
                val nom = champNom.text.toString().trim()
                val achat = champAchat.text.toString().toDoubleOrNull() ?: 0.0
                val vente = champVente.text.toString().toDoubleOrNull() ?: 0.0
                if (nom.isEmpty() || vente <= 0) {
                    Toast.makeText(requireContext(), R.string.champ_obligatoire, Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                viewLifecycleOwner.lifecycleScope.launch {
                    val nouveauProduit = com.gesstock.app.data.db.Produit(
                        nom = nom,
                        codeBarre = code.ifEmpty { null },
                        prixAchat = achat,
                        prixVente = vente,
                        quantite = 0.0,
                        quantiteMin = 0.0,
                        unite = "Pièce"
                    )
                    val id = db.produitDao().inserer(nouveauProduit)
                    val cree = db.produitDao().parId(id)
                    if (cree != null) {
                        panier.add(LignePanier(cree, 1.0))
                        adapter.notifyDataSetChanged()
                        rafraichir()
                        Toast.makeText(requireContext(), R.string.produit_cree_ajoute, Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .show()
    }

    private fun ajouterProduit(produit: Produit) {
        val ligne = panier.find { it.produit.id == produit.id }
        if (ligne != null) {
            if (ligne.quantite + 1 > produit.quantite) {
                Toast.makeText(requireContext(), R.string.stock_insuffisant, Toast.LENGTH_SHORT).show()
                return
            }
            ligne.quantite += 1
        } else {
            if (produit.quantite < 1) {
                Toast.makeText(requireContext(), R.string.stock_insuffisant, Toast.LENGTH_SHORT).show()
                return
            }
            panier.add(LignePanier(produit, 1.0))
        }
        adapter.notifyDataSetChanged()
        rafraichir()
    }

    private fun rafraichir() {
        val total = panier.sumOf { it.quantite * it.produit.prixVente }
        binding.tvTotal.text = total.versDa()
        binding.btnValiderVente.isEnabled = panier.isNotEmpty()
        binding.tvVide.visibility = if (panier.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun confirmerVente() {
        val total = panier.sumOf { it.quantite * it.produit.prixVente }

        val champMontant = EditText(requireContext()).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
            hint = getString(R.string.montant_recu)
            textSize = 18f
        }
        val tvMonnaie = TextView(requireContext()).apply {
            textSize = 15f
            setPadding(0, 8, 0, 0)
        }
        val conteneur = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(60, 8, 60, 0)
            addView(TextView(requireContext()).apply {
                text = "${getString(R.string.total)} : ${total.versDa()}"
                textSize = 17f
            })
            addView(champMontant)
            addView(tvMonnaie)
        }

        champMontant.doAfterTextChanged {
            val montant = it?.toString()?.replace(',', '.')?.toDoubleOrNull() ?: 0.0
            val monnaie = montant - total
            tvMonnaie.text = when {
                montant <= 0.0 -> ""
                monnaie >= 0.0 -> "${getString(R.string.monnaie_a_rendre)} : ${monnaie.versDa()}"
                else -> getString(R.string.montant_insuffisant)
            }
            tvMonnaie.setTextColor(
                ContextCompat.getColor(
                    requireContext(),
                    if (monnaie >= 0 && montant > 0) R.color.vert else R.color.rouge
                )
            )
        }

        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.confirmer_vente)
            .setView(conteneur)
            .setNegativeButton(R.string.annuler, null)
            .setPositiveButton(R.string.encaisser, null)
            .create()

        dialog.show()
        // Override the positive button click to prevent auto-dismiss on validation failure
        dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setOnClickListener {
            val montant = champMontant.text.toString().replace(',', '.').toDoubleOrNull() ?: 0.0
            if (montant < total) {
                champMontant.error = getString(R.string.montant_insuffisant)
                return@setOnClickListener
            }
            dialog.dismiss()
            enregistrerVente(total)
        } ?: run {
            // Fallback: if button isn't available yet, use standard listener
            dialog.setButton(AlertDialog.BUTTON_POSITIVE, getString(R.string.encaisser)) { _, _ ->
                val montant = champMontant.text.toString().replace(',', '.').toDoubleOrNull() ?: 0.0
                if (montant >= total) enregistrerVente(total)
            }
        }
    }

    private fun enregistrerVente(total: Double) {
        binding.btnValiderVente.isEnabled = false
        val caissier = Session.utilisateur
        if (caissier == null) {
            binding.btnValiderVente.isEnabled = true
            return
        }
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                var venteId = 0L
                db.withTransaction {
                    venteId = db.venteDao().insererVente(
                        Vente(caissierId = caissier.id, dateHeure = System.currentTimeMillis(), total = total)
                    )
                    db.venteDao().insererLignes(
                        panier.map {
                            LigneVente(
                                venteId = venteId,
                                produitId = it.produit.id,
                                nomProduit = it.produit.nom,
                                quantite = it.quantite,
                                prixUnitaire = it.produit.prixVente
                            )
                        }
                    )
                    panier.forEach { db.produitDao().ajusterStock(it.produit.id, -it.quantite) }
                }
                panier.clear()
                adapter.notifyDataSetChanged()
                rafraichir()
                if (_binding == null) return@launch
                Toast.makeText(requireContext(), R.string.vente_enregistree, Toast.LENGTH_SHORT).show()
                findNavController().navigate(R.id.recuFragment, bundleOf("venteId" to venteId))
            } catch (e: Exception) {
                if (_binding == null) return@launch
                binding.btnValiderVente.isEnabled = true
                Toast.makeText(requireContext(), R.string.erreur_enregistrement, Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class PanierAdapter(
    private val panier: MutableList<LignePanier>,
    private val onChange: () -> Unit
) : RecyclerView.Adapter<PanierAdapter.VH>() {

    inner class VH(val binding: ItemPanierBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemPanierBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount(): Int = panier.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val ligne = panier[position]
        holder.binding.tvNom.text = ligne.produit.nom
        holder.binding.tvQuantite.text = ligne.quantite.versQte()
        holder.binding.tvSousTotal.text =
            "${ligne.quantite.versQte()} × ${ligne.produit.prixVente.versDa()} = ${(ligne.quantite * ligne.produit.prixVente).versDa()}"

        holder.binding.btnPlus.setOnClickListener {
            if (ligne.quantite + 1 <= ligne.produit.quantite) {
                ligne.quantite += 1
                notifyItemChanged(holder.adapterPosition)
                onChange()
            }
        }
        holder.binding.btnMoins.setOnClickListener {
            if (ligne.quantite > 1) {
                ligne.quantite -= 1
                notifyItemChanged(holder.adapterPosition)
                onChange()
            }
        }
        holder.binding.btnSupprimerLigne.setOnClickListener {
            val index = holder.adapterPosition
            if (index != RecyclerView.NO_POSITION) {
                panier.removeAt(index)
                notifyItemRemoved(index)
                onChange()
            }
        }
    }
}

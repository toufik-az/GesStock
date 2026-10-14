package com.gesstock.app.ui.reception

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.room.withTransaction
import com.gesstock.app.R
import com.gesstock.app.data.db.Fournisseur
import com.gesstock.app.data.db.LigneReception
import com.gesstock.app.data.db.Produit
import com.gesstock.app.data.db.Reception
import com.gesstock.app.databinding.FragmentReceptionBinding
import com.gesstock.app.databinding.ItemPanierBinding
import com.gesstock.app.ui.scanner.ScannerActivity
import com.gesstock.app.util.db
import com.gesstock.app.util.versQte
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.launch

data class LigneRecep(val produit: Produit, var quantite: Double)

class ReceptionFragment : Fragment() {

    private var _binding: FragmentReceptionBinding? = null
    private val binding get() = _binding!!

    private val lignes = mutableListOf<LigneRecep>()
    private var fournisseurs: List<Fournisseur> = emptyList()
    private lateinit var adapter: ReceptionAdapter

    private val scanLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { resultat ->
            if (resultat.resultCode == Activity.RESULT_OK) {
                resultat.data?.getStringExtra(ScannerActivity.EXTRA_CODE)?.let { ajouterParCode(it) }
            }
        }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentReceptionBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = ReceptionAdapter(lignes) { rafraichir() }
        binding.rvLignes.layoutManager = LinearLayoutManager(requireContext())
        binding.rvLignes.adapter = adapter

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

        binding.btnChoisirProduit.setOnClickListener { choisirProduit() }
        binding.btnValiderReception.setOnClickListener { valider() }

        viewLifecycleOwner.lifecycleScope.launch {
            fournisseurs = db.fournisseurDao().liste()
            val noms = listOf(getString(R.string.sans_fournisseur)) + fournisseurs.map { it.nom }
            binding.spFournisseur.adapter =
                ArrayAdapter(requireContext(), android.R.layout.simple_spinner_dropdown_item, noms)
        }
    }

    private fun ajouterParCode(code: String) {
        viewLifecycleOwner.lifecycleScope.launch {
            val produit = db.produitDao().parCodeBarre(code)
            if (produit == null) {
                Toast.makeText(requireContext(), R.string.produit_introuvable, Toast.LENGTH_SHORT).show()
            } else {
                ajouterProduit(produit)
            }
        }
    }

    private fun choisirProduit() {
        viewLifecycleOwner.lifecycleScope.launch {
            val produits = db.produitDao().tous()
            if (produits.isEmpty()) {
                Toast.makeText(requireContext(), R.string.aucun_produit, Toast.LENGTH_SHORT).show()
                return@launch
            }
            MaterialAlertDialogBuilder(requireContext())
                .setTitle(R.string.choisir_produit)
                .setItems(produits.map { it.nom }.toTypedArray()) { _, index ->
                    ajouterProduit(produits[index])
                }
                .show()
        }
    }

    private fun ajouterProduit(produit: Produit) {
        val existante = lignes.find { it.produit.id == produit.id }
        if (existante != null) existante.quantite += 1
        else lignes.add(LigneRecep(produit, 1.0))
        adapter.notifyDataSetChanged()
        rafraichir()
    }

    private fun rafraichir() {
        binding.btnValiderReception.isEnabled = lignes.isNotEmpty()
        binding.tvVide.visibility = if (lignes.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun valider() {
        val indexFournisseur = binding.spFournisseur.selectedItemPosition
        val fournisseurId = if (indexFournisseur > 0) fournisseurs[indexFournisseur - 1].id else null
        // FIX: confirmation dialog before the irreversible stock update
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.valider_reception)
            .setMessage(getString(R.string.confirmer_reception_msg, lignes.size))
            .setNegativeButton(R.string.annuler, null)
            .setPositiveButton(R.string.confirmer) { _, _ -> executerReception(fournisseurId) }
            .show()
    }

    private fun executerReception(fournisseurId: Long?) {
        binding.btnValiderReception.isEnabled = false   // FIX: prevent double-tap
        viewLifecycleOwner.lifecycleScope.launch {
            db.withTransaction {
                val receptionId = db.receptionDao().insererReception(
                    Reception(fournisseurId = fournisseurId, dateHeure = System.currentTimeMillis())
                )
                db.receptionDao().insererLignes(
                    lignes.map {
                        LigneReception(
                            receptionId = receptionId,
                            produitId = it.produit.id,
                            quantite = it.quantite,
                            prixAchat = it.produit.prixAchat   // FIX: was always null
                        )
                    }
                )
                lignes.forEach { db.produitDao().ajusterStock(it.produit.id, it.quantite) }
            }
            lignes.clear()
            adapter.notifyDataSetChanged()
            rafraichir()
            Toast.makeText(requireContext(), R.string.reception_enregistree, Toast.LENGTH_LONG).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class ReceptionAdapter(
    private val lignes: MutableList<LigneRecep>,
    private val onChange: () -> Unit
) : RecyclerView.Adapter<ReceptionAdapter.VH>() {

    inner class VH(val binding: ItemPanierBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemPanierBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount(): Int = lignes.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val ligne = lignes[position]
        holder.binding.tvNom.text = ligne.produit.nom
        holder.binding.tvQuantite.text = ligne.quantite.versQte()
        holder.binding.tvSousTotal.text = "+${ligne.quantite.versQte()} ${ligne.produit.unite}"

        holder.binding.btnPlus.setOnClickListener {
            ligne.quantite += 1
            notifyItemChanged(holder.adapterPosition)
            onChange()
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
                lignes.removeAt(index)
                notifyItemRemoved(index)
                onChange()
            }
        }
    }
}

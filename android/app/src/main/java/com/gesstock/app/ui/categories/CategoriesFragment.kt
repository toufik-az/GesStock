package com.gesstock.app.ui.categories

import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.gesstock.app.R
import com.gesstock.app.data.db.Categorie
import com.gesstock.app.data.db.CategorieAvecNombre
import com.gesstock.app.databinding.FragmentCategoriesBinding
import com.gesstock.app.databinding.ItemCategorieBinding
import com.gesstock.app.util.db
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.launch

class CategoriesFragment : Fragment() {

    private var _binding: FragmentCategoriesBinding? = null
    private val binding get() = _binding!!

    private val paletteCouleurs = listOf(
        0xFF00695C.toInt(), 0xFFD32F2F.toInt(), 0xFF1976D2.toInt(),
        0xFFFFA000.toInt(), 0xFF7B1FA2.toInt(), 0xFF388E3C.toInt(),
        0xFF5D4037.toInt(), 0xFF455A64.toInt()
    )
    private var nombreCategories = 0

    private val adapter = CategorieAdapter(
        onClick = { dialogueCategorie(it.categorie) },
        onLongClick = { confirmerSuppression(it.categorie) }
    )

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentCategoriesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.rvCategories.layoutManager = LinearLayoutManager(requireContext())
        binding.rvCategories.adapter = adapter

        binding.fabAjouter.setOnClickListener { dialogueCategorie(null) }

        viewLifecycleOwner.lifecycleScope.launch {
            db.categorieDao().toutesAvecNombre().collect { liste ->
                nombreCategories = liste.size
                adapter.submitList(liste)
                binding.tvVide.visibility = if (liste.isEmpty()) View.VISIBLE else View.GONE
            }
        }
    }

    private fun dialogueCategorie(existante: Categorie?) {
        val champ = EditText(requireContext()).apply {
            inputType = InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
            hint = getString(R.string.nom_categorie)
            setText(existante?.nom.orEmpty())
        }
        val conteneur = FrameLayout(requireContext()).apply {
            setPadding(48, 16, 48, 0)
            addView(champ)
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(if (existante == null) R.string.ajouter_categorie else R.string.renommer)
            .setView(conteneur)
            .setNegativeButton(R.string.annuler, null)
            .setPositiveButton(R.string.enregistrer) { _, _ ->
                val nom = champ.text.toString().trim()
                if (nom.isNotEmpty()) {
                    viewLifecycleOwner.lifecycleScope.launch {
                        if (existante == null) {
                            val couleur = paletteCouleurs[nombreCategories % paletteCouleurs.size]
                            db.categorieDao().inserer(Categorie(nom = nom, couleur = couleur))
                        } else {
                            db.categorieDao().modifier(existante.copy(nom = nom))
                        }
                    }
                }
            }
            .show()
    }

    private fun confirmerSuppression(categorie: Categorie) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.confirmer_suppression)
            .setMessage(R.string.supprimer_categorie_question)
            .setNegativeButton(R.string.annuler, null)
            .setPositiveButton(R.string.supprimer) { _, _ ->
                viewLifecycleOwner.lifecycleScope.launch {
                    db.categorieDao().supprimer(categorie)
                }
            }
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class CategorieAdapter(
    private val onClick: (CategorieAvecNombre) -> Unit,
    private val onLongClick: (CategorieAvecNombre) -> Unit
) : ListAdapter<CategorieAvecNombre, CategorieAdapter.VH>(DIFF) {

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<CategorieAvecNombre>() {
            override fun areItemsTheSame(old: CategorieAvecNombre, new: CategorieAvecNombre) =
                old.categorie.id == new.categorie.id

            override fun areContentsTheSame(old: CategorieAvecNombre, new: CategorieAvecNombre) = old == new
        }
    }

    inner class VH(val binding: ItemCategorieBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemCategorieBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun onBindViewHolder(holder: VH, position: Int) {
        val element = getItem(position)
        holder.binding.tvNom.text = element.categorie.nom
        holder.binding.tvNombre.text = holder.binding.root.context
            .getString(R.string.nb_produits, element.nombreProduits)
        holder.binding.viewCouleur.setBackgroundColor(element.categorie.couleur)
        holder.binding.root.setOnClickListener { onClick(element) }
        holder.binding.root.setOnLongClickListener { onLongClick(element); true }
    }
}

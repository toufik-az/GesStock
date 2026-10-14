package com.gesstock.app.ui.produits

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.gesstock.app.R
import com.gesstock.app.data.db.Produit
import com.gesstock.app.databinding.ItemProduitBinding
import com.gesstock.app.util.versDa
import com.gesstock.app.util.versQte

class ProduitAdapter(
    private val onClick: (Produit) -> Unit
) : ListAdapter<Produit, ProduitAdapter.VH>(DIFF) {

    var nomsCategories: Map<Long, String> = emptyMap()

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<Produit>() {
            override fun areItemsTheSame(old: Produit, new: Produit) = old.id == new.id
            override fun areContentsTheSame(old: Produit, new: Produit) = old == new
        }
    }

    inner class VH(val binding: ItemProduitBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemProduitBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun onBindViewHolder(holder: VH, position: Int) {
        val produit = getItem(position)
        val contexte = holder.binding.root.context
        holder.binding.tvNom.text = produit.nom
        holder.binding.tvDetails.text = listOfNotNull(
            produit.categorieId?.let { nomsCategories[it] },
            produit.codeBarre
        ).joinToString("  •  ").ifEmpty { contexte.getString(R.string.sans_categorie) }
        holder.binding.tvPrix.text = produit.prixVente.versDa()
        holder.binding.tvQuantite.text = "${produit.quantite.versQte()} ${produit.unite}"
        holder.binding.tvQuantite.setTextColor(
            ContextCompat.getColor(
                contexte,
                if (produit.quantite <= produit.quantiteMin) R.color.rouge else R.color.vert
            )
        )
        holder.binding.root.setOnClickListener { onClick(produit) }
    }
}

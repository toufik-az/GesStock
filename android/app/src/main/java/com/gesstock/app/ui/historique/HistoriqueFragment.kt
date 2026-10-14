package com.gesstock.app.ui.historique

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.gesstock.app.R
import com.gesstock.app.data.Session
import com.gesstock.app.data.db.VenteAvecCaissier
import com.gesstock.app.databinding.FragmentHistoriqueBinding
import com.gesstock.app.databinding.ItemVenteBinding
import com.gesstock.app.util.db
import com.gesstock.app.util.versDa
import com.gesstock.app.util.versDateFr
import kotlinx.coroutines.launch

class HistoriqueFragment : Fragment() {

    private var _binding: FragmentHistoriqueBinding? = null
    private val binding get() = _binding!!

    private val adapter = VenteAdapter { vente ->
        findNavController().navigate(R.id.recuFragment, bundleOf("venteId" to vente.vente.id))
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHistoriqueBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.rvVentes.layoutManager = LinearLayoutManager(requireContext())
        binding.rvVentes.adapter = adapter

        val utilisateur = Session.utilisateur ?: return
        val flux = if (Session.estManager) db.venteDao().toutes()
        else db.venteDao().parCaissier(utilisateur.id)

        viewLifecycleOwner.lifecycleScope.launch {
            flux.collect { ventes ->
                adapter.submitList(ventes)
                binding.tvVide.visibility = if (ventes.isEmpty()) View.VISIBLE else View.GONE
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class VenteAdapter(
    private val onClick: (VenteAvecCaissier) -> Unit
) : ListAdapter<VenteAvecCaissier, VenteAdapter.VH>(DIFF) {

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<VenteAvecCaissier>() {
            override fun areItemsTheSame(old: VenteAvecCaissier, new: VenteAvecCaissier) =
                old.vente.id == new.vente.id

            override fun areContentsTheSame(old: VenteAvecCaissier, new: VenteAvecCaissier) = old == new
        }
    }

    inner class VH(val binding: ItemVenteBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemVenteBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun onBindViewHolder(holder: VH, position: Int) {
        val element = getItem(position)
        holder.binding.tvDate.text = element.vente.dateHeure.versDateFr()
        holder.binding.tvCaissier.text = element.nomCaissier
        holder.binding.tvTotal.text = element.vente.total.versDa()
        holder.binding.root.setOnClickListener { onClick(element) }
    }
}

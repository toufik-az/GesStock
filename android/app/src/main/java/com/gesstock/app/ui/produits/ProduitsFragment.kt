package com.gesstock.app.ui.produits

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.os.bundleOf
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.gesstock.app.R
import com.gesstock.app.databinding.FragmentProduitsBinding
import com.gesstock.app.util.db
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.launch

class ProduitsFragment : Fragment() {

    private var _binding: FragmentProduitsBinding? = null
    private val binding get() = _binding!!
    private val recherche = MutableStateFlow("")
    private lateinit var adapter: ProduitAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentProduitsBinding.inflate(inflater, container, false)
        return binding.root
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = ProduitAdapter { produit ->
            findNavController().navigate(R.id.produitFormFragment, bundleOf("produitId" to produit.id))
        }
        binding.rvProduits.layoutManager = LinearLayoutManager(requireContext())
        binding.rvProduits.adapter = adapter

        binding.etRecherche.doAfterTextChanged { recherche.value = it?.toString().orEmpty() }

        binding.fabAjouter.setOnClickListener {
            findNavController().navigate(R.id.produitFormFragment)
        }

        viewLifecycleOwner.lifecycleScope.launch {
            adapter.nomsCategories = db.categorieDao().liste().associate { it.id to it.nom }
            recherche.flatMapLatest { db.produitDao().rechercher(it) }.collect { produits ->
                adapter.submitList(produits)
                binding.tvVide.visibility = if (produits.isEmpty()) View.VISIBLE else View.GONE
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

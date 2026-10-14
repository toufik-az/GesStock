package com.gesstock.app.ui.alertes

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.gesstock.app.R
import com.gesstock.app.databinding.FragmentAlertesBinding
import com.gesstock.app.ui.produits.ProduitAdapter
import com.gesstock.app.util.db
import kotlinx.coroutines.launch

class AlertesFragment : Fragment() {

    private var _binding: FragmentAlertesBinding? = null
    private val binding get() = _binding!!

    private val adapter = ProduitAdapter { produit ->
        findNavController().navigate(R.id.produitFormFragment, bundleOf("produitId" to produit.id))
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentAlertesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.rvAlertes.layoutManager = LinearLayoutManager(requireContext())
        binding.rvAlertes.adapter = adapter

        binding.btnReception.setOnClickListener {
            findNavController().navigate(R.id.receptionFragment)
        }

        viewLifecycleOwner.lifecycleScope.launch {
            adapter.nomsCategories = db.categorieDao().liste().associate { it.id to it.nom }
            db.produitDao().enAlerte().collect { produits ->
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

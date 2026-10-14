package com.gesstock.app.ui.parametres

import android.content.Context
import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.gesstock.app.util.insererDonneesDemonstration
import com.gesstock.app.R
import com.gesstock.app.data.ROLE_CAISSIER
import com.gesstock.app.data.ROLE_MANAGER
import com.gesstock.app.data.db.Fournisseur
import com.gesstock.app.data.db.Utilisateur
import com.gesstock.app.databinding.FragmentParametresBinding
import com.gesstock.app.util.db
import com.gesstock.app.util.sha256
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import androidx.core.content.ContextCompat
import kotlinx.coroutines.launch

class ParametresFragment : Fragment() {

    private var _binding: FragmentParametresBinding? = null
    private val binding get() = _binding!!

    private val prefs by lazy {
        requireContext().getSharedPreferences("gesstock_prefs", Context.MODE_PRIVATE)
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentParametresBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.etNomMagasin.setText(prefs.getString("nom_magasin", ""))

        binding.btnEnregistrerMagasin.setOnClickListener {
            prefs.edit().putString("nom_magasin", binding.etNomMagasin.text?.toString()?.trim()).apply()
            Toast.makeText(requireContext(), R.string.enregistre, Toast.LENGTH_SHORT).show()
        }

        binding.btnChangerPinManager.setOnClickListener { changerPin(ROLE_MANAGER) }
        binding.btnChangerPinCaissier.setOnClickListener { changerPin(ROLE_CAISSIER) }
        binding.btnCategories.setOnClickListener { findNavController().navigate(R.id.categoriesFragment) }

        binding.btnChargerDemo.setOnClickListener {
            MaterialAlertDialogBuilder(requireContext())
                .setTitle(R.string.charger_demo)
                .setMessage(R.string.confirmer_demo)
                .setNegativeButton(R.string.annuler, null)
                .setPositiveButton(R.string.oui) { _, _ ->
                    viewLifecycleOwner.lifecycleScope.launch {
                        try {
                            insererDonneesDemonstration(db)
                            Toast.makeText(requireContext(), R.string.demo_chargee, Toast.LENGTH_LONG).show()
                        } catch (e: Exception) {
                            Toast.makeText(requireContext(), "Erreur démo : ${e.message}", Toast.LENGTH_LONG).show()
                        }
                    }
                }
                .show()
        }

        binding.btnAjouterFournisseur.setOnClickListener { dialogueFournisseur() }

        viewLifecycleOwner.lifecycleScope.launch {
            db.fournisseurDao().tous().collect { fournisseurs ->
                if (_binding == null) return@collect
                binding.llFournisseurs.removeAllViews()
                if (fournisseurs.isEmpty()) {
                    binding.llFournisseurs.addView(TextView(requireContext()).apply {
                        setText(R.string.aucun_fournisseur)
                        setPadding(0, 8, 0, 8)
                    })
                } else {
                    fournisseurs.forEach { fournisseur ->
                        binding.llFournisseurs.addView(creerLigneFournisseur(fournisseur))
                    }
                }
            }
        }
    }

    private fun creerLigneFournisseur(fournisseur: Fournisseur): View {
        val ligne = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            val padding = (12 * resources.displayMetrics.density).toInt()
            setPadding(0, padding, 0, padding)
        }
        ligne.addView(TextView(requireContext()).apply {
            text = if (fournisseur.telephone.isNotEmpty())
                "${fournisseur.nom}\n${fournisseur.telephone}" else fournisseur.nom
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            textSize = 14f
            setTextColor(ContextCompat.getColor(requireContext(), R.color.texte))
        })
        ligne.addView(Button(requireContext(), null, 0, com.google.android.material.R.style.Widget_Material3_Button_TextButton).apply {
            setText(R.string.supprimer)
            setTextColor(ContextCompat.getColor(requireContext(), R.color.rouge))   // FIX: was using deprecated resources.getColor
            setOnClickListener {
                // FIX: was deleting without confirmation
                MaterialAlertDialogBuilder(requireContext())
                    .setTitle(R.string.confirmer_suppression)
                    .setMessage(getString(R.string.supprimer_fournisseur_question, fournisseur.nom))
                    .setNegativeButton(R.string.annuler, null)
                    .setPositiveButton(R.string.supprimer) { _, _ ->
                        viewLifecycleOwner.lifecycleScope.launch {
                            db.fournisseurDao().supprimer(fournisseur)
                        }
                    }
                    .show()
            }
        })
        return ligne
    }

    private fun changerPin(role: String) {
        val champ = EditText(requireContext()).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = getString(R.string.nouveau_pin)
        }
        val conteneur = FrameLayout(requireContext()).apply {
            setPadding(48, 16, 48, 0)
            addView(champ)
        }
        val titre = if (role == ROLE_MANAGER) R.string.changer_pin_manager else R.string.changer_pin_caissier
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(titre)
            .setView(conteneur)
            .setNegativeButton(R.string.annuler, null)
            .setPositiveButton(R.string.enregistrer) { _, _ ->
                val pin = champ.text.toString()
                if (pin.length !in 4..6) {
                    Toast.makeText(requireContext(), R.string.pin_invalide, Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                viewLifecycleOwner.lifecycleScope.launch {
                    val existant = db.utilisateurDao().parRole(role)
                    if (existant == null) {
                        db.utilisateurDao().inserer(
                            Utilisateur(
                                nom = getString(if (role == ROLE_MANAGER) R.string.role_manager else R.string.role_caissier),
                                role = role,
                                pinHash = sha256(pin)
                            )
                        )
                    } else {
                        db.utilisateurDao().modifier(existant.copy(pinHash = sha256(pin)))
                    }
                    Toast.makeText(requireContext(), R.string.enregistre, Toast.LENGTH_SHORT).show()
                }
            }
            .show()
    }

    private fun dialogueFournisseur() {
        val champNom = EditText(requireContext()).apply {
            inputType = InputType.TYPE_TEXT_FLAG_CAP_WORDS
            hint = getString(R.string.nom_fournisseur)
        }
        val champTelephone = EditText(requireContext()).apply {
            inputType = InputType.TYPE_CLASS_PHONE
            hint = getString(R.string.telephone)
        }
        val conteneur = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 16, 48, 0)
            addView(champNom)
            addView(champTelephone)
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.ajouter_fournisseur)
            .setView(conteneur)
            .setNegativeButton(R.string.annuler, null)
            .setPositiveButton(R.string.enregistrer) { _, _ ->
                val nom = champNom.text.toString().trim()
                if (nom.isNotEmpty()) {
                    viewLifecycleOwner.lifecycleScope.launch {
                        db.fournisseurDao().inserer(
                            Fournisseur(nom = nom, telephone = champTelephone.text.toString().trim())
                        )
                    }
                }
            }
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

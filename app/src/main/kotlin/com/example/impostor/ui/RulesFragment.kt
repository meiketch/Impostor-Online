package com.example.impostor.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import com.example.impostor.data.GameRepository
import com.example.impostor.databinding.FragmentRulesBinding

class RulesFragment : Fragment() {
    private lateinit var binding: FragmentRulesBinding
    private lateinit var gameRepository: GameRepository

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        binding = FragmentRulesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        gameRepository = GameRepository(requireContext())
        
        displayRules()
        
        binding.backBtn.setOnClickListener { parentFragmentManager.popBackStack() }
        binding.editRulesBtn.setOnClickListener { showEditRulesDialog() }
    }

    private fun displayRules() {
        binding.rulesTextView.text = gameRepository.getRules()
    }

    private fun showEditRulesDialog() {
        val input = EditText(requireContext()).apply {
            setText(gameRepository.getRules())
            setPadding(40, 40, 40, 40)
            gravity = android.view.Gravity.TOP
            minLines = 10
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Regelwerk bearbeiten")
            .setView(input)
            .setPositiveButton("Speichern") { _, _ ->
                gameRepository.saveRules(input.text.toString())
                displayRules()
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }
}

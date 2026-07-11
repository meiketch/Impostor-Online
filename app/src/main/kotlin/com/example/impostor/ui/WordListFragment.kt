package com.example.impostor.ui

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import com.example.impostor.data.GameRepository
import com.example.impostor.data.GameWord
import com.example.impostor.databinding.FragmentWordListBinding

class WordListFragment : Fragment() {

    private lateinit var binding: FragmentWordListBinding
    private lateinit var gameRepository: GameRepository
    private lateinit var adapter: WordAdapter
    private var allWords = listOf<GameWord>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        binding = FragmentWordListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        gameRepository = GameRepository(requireContext())
        setupUI()
        loadWords()
    }

    private fun setupUI() {
        adapter = WordAdapter(emptyList(), onEdit = { word ->
            showAddEditWordDialog(word)
        }, onDelete = { word ->
            showDeleteConfirmation(word)
        })
        binding.wordsRecyclerView.adapter = adapter

        binding.backBtn.setOnClickListener {
            parentFragmentManager.popBackStack()
        }

        binding.addWordBtn.setOnClickListener {
            showAddEditWordDialog()
        }

        binding.searchWordsInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                filterWords(s.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun showAddEditWordDialog(existingWord: GameWord? = null) {
        val layout = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(50, 20, 50, 10)
        }

        val wordInput = EditText(requireContext()).apply {
            hint = "Wort (z.B. Apfel)"
            setText(existingWord?.word ?: "")
            if (existingWord != null) isEnabled = false // Wort selbst als ID behalten
        }
        val cluesInput = EditText(requireContext()).apply {
            hint = "Hinweise (Kommagetrennt, z.B. Rot, Frucht, Baum)"
            setText(existingWord?.clues?.joinToString(", ") ?: "")
        }

        layout.addView(wordInput)
        layout.addView(cluesInput)

        AlertDialog.Builder(requireContext())
            .setTitle(if (existingWord == null) "Neues Wort hinzufügen" else "Wort bearbeiten")
            .setView(layout)
            .setPositiveButton("Speichern") { _, _ ->
                val word = wordInput.text.toString().trim()
                val clues = cluesInput.text.toString().split(",")
                    .map { it.trim() }
                    .filter { it.isNotEmpty() }
                
                if (word.isNotEmpty() && clues.isNotEmpty()) {
                    if (existingWord != null) {
                        // Lösche das alte und füge das neue (bearbeitete) hinzu
                        gameRepository.deleteWord(existingWord.word)
                    }
                    gameRepository.addWord(GameWord(word, clues))
                    loadWords()
                }
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun loadWords() {
        allWords = gameRepository.getWordList().sortedBy { it.word }
        adapter.updateWords(allWords)
    }

    private fun filterWords(query: String) {
        val filtered = allWords.filter { 
            it.word.contains(query, ignoreCase = true) || 
            it.clues.any { clue -> clue.contains(query, ignoreCase = true) }
        }
        adapter.updateWords(filtered)
    }

    private fun showDeleteConfirmation(word: GameWord) {
        AlertDialog.Builder(requireContext())
            .setTitle("Wort löschen?")
            .setMessage("Möchtes du '${word.word}' wirklich löschen?")
            .setPositiveButton("Löschen") { _, _ ->
                gameRepository.deleteWord(word.word)
                loadWords()
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    private fun showAddWordDialog() {
        val layout = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(50, 20, 50, 10)
        }

        val wordInput = EditText(requireContext()).apply {
            hint = "Wort (z.B. Apfel)"
        }
        val cluesInput = EditText(requireContext()).apply {
            hint = "Hinweise (Kommagetrennt, z.B. Rot, Frucht, Baum)"
        }

        layout.addView(wordInput)
        layout.addView(cluesInput)

        AlertDialog.Builder(requireContext())
            .setTitle("Neues Wort hinzufügen")
            .setView(layout)
            .setPositiveButton("Speichern") { _, _ ->
                val word = wordInput.text.toString().trim()
                val clues = cluesInput.text.toString().split(",")
                    .map { it.trim() }
                    .filter { it.isNotEmpty() }
                
                if (word.isNotEmpty() && clues.isNotEmpty()) {
                    gameRepository.addWord(GameWord(word, clues))
                    loadWords()
                }
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }
}

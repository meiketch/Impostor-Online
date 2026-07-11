package com.example.impostor.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.impostor.data.GameWord
import com.example.impostor.databinding.ItemWordBinding

class WordAdapter(
    private var words: List<GameWord>,
    private val onEdit: (GameWord) -> Unit,
    private val onDelete: (GameWord) -> Unit
) : RecyclerView.Adapter<WordAdapter.WordViewHolder>() {

    inner class WordViewHolder(private val binding: ItemWordBinding) : 
        RecyclerView.ViewHolder(binding.root) {
        
        fun bind(gameWord: GameWord) {
            binding.wordText.text = gameWord.word
            binding.cluesText.text = gameWord.clues.joinToString(", ")
            binding.editWordBtn.setOnClickListener { onEdit(gameWord) }
            binding.deleteWordBtn.setOnClickListener {
                onDelete(gameWord)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): WordViewHolder {
        val binding = ItemWordBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return WordViewHolder(binding)
    }

    override fun onBindViewHolder(holder: WordViewHolder, position: Int) {
        holder.bind(words[position])
    }

    override fun getItemCount(): Int = words.size

    fun updateWords(newWords: List<GameWord>) {
        words = newWords
        notifyDataSetChanged()
    }
}

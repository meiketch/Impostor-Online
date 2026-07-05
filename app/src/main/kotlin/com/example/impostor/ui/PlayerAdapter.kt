package com.example.impostor.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.impostor.data.Player
import com.example.impostor.databinding.ItemPlayerBinding

class PlayerAdapter(
    private val players: MutableList<Player>,
    private val onRemove: (Player) -> Unit
) : RecyclerView.Adapter<PlayerAdapter.PlayerViewHolder>() {

    inner class PlayerViewHolder(private val binding: ItemPlayerBinding) : 
        RecyclerView.ViewHolder(binding.root) {
        
        fun bind(player: Player) {
            binding.playerName.text = player.name
            binding.playerPhone.text = player.phoneNumber
            binding.removeBtn.setOnClickListener {
                onRemove(player)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlayerViewHolder {
        val binding = ItemPlayerBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return PlayerViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PlayerViewHolder, position: Int) {
        holder.bind(players[position])
    }

    override fun getItemCount(): Int = players.size

    fun updatePlayers(newPlayers: List<Player>) {
        players.clear()
        players.addAll(newPlayers)
        notifyDataSetChanged()
    }
}

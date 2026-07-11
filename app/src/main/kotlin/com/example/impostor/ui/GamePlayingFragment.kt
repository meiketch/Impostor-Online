package com.example.impostor.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.example.impostor.data.GameRepository
import com.example.impostor.data.SmsService
import com.example.impostor.databinding.FragmentGamePlayingBinding

class GamePlayingFragment : Fragment() {

    private lateinit var binding: FragmentGamePlayingBinding
    private lateinit var gameRepository: GameRepository
    private lateinit var smsService: SmsService
    private var onGameEnded: (() -> Unit)? = null
    private var onNewRound: (() -> Unit)? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        binding = FragmentGamePlayingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        gameRepository = GameRepository(requireContext())
        smsService = SmsService(requireContext())
        
        updateGameInfo()
        
        binding.endGameBtn.setOnClickListener {
            endGame()
        }
        
        binding.newRoundBtn.setOnClickListener {
            newRound()
        }

        binding.sendDetMsgBtn.setOnClickListener {
            sendDetectiveMessage()
        }
    }

    private fun sendDetectiveMessage() {
        val msg = binding.detectiveMessageInput.text.toString().trim()
        if (msg.isEmpty()) return
        
        val currentRound = gameRepository.getCurrentRound() ?: return
        val players = gameRepository.getPlayers()
        val fullMsg = "🕵️ Detektiv Nachricht:\n$msg"
        
        // Nachricht geht an: Bürger, Detektive und Scherzbolde
        // Nachricht geht NICHT an: Impostoren und Doppelgänger
        for (player in players) {
            val isImpostor = currentRound.impostors.contains(player.id)
            val isDoppelganger = currentRound.doppelgangers.contains(player.id)
            
            if (!isImpostor && !isDoppelganger) {
                smsService.sendGlobalInfoMessage(player.phoneNumber, fullMsg)
            }
        }
        
        binding.detectiveMessageInput.text.clear()
        android.widget.Toast.makeText(requireContext(), "Nachricht an Verbündete versendet!", android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun updateGameInfo() {
        val currentRound = gameRepository.getCurrentRound()
        val players = gameRepository.getPlayers()
        
        if (currentRound != null) {
            binding.playerCountText.text = players.size.toString()
            binding.impostorCountText.text = currentRound.impostors.size.toString()
        }
    }

    private fun endGame() {
        val currentRound = gameRepository.getCurrentRound()
        if (currentRound != null) {
            gameRepository.addToGameHistory(currentRound)
        }
        gameRepository.clearCurrentRound()
        onGameEnded?.invoke()
    }

    private fun newRound() {
        val currentRound = gameRepository.getCurrentRound()
        if (currentRound != null) {
            gameRepository.addToGameHistory(currentRound)
        }
        gameRepository.clearCurrentRound()
        onNewRound?.invoke()
    }

    fun setOnGameEndedListener(listener: () -> Unit) {
        this.onGameEnded = listener
    }

    fun setOnNewRoundListener(listener: () -> Unit) {
        this.onNewRound = listener
    }
}

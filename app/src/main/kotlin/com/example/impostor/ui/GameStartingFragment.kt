package com.example.impostor.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import com.example.impostor.data.GameLogic
import com.example.impostor.data.GameRepository
import com.example.impostor.data.SmsService
import com.example.impostor.databinding.FragmentGameStartingBinding

class GameStartingFragment : Fragment() {

    private lateinit var binding: FragmentGameStartingBinding
    private lateinit var gameRepository: GameRepository
    private lateinit var smsService: SmsService
    private var impostorCount: Int = 0
    private var onGameReady: (() -> Unit)? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        binding = FragmentGameStartingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        gameRepository = GameRepository(requireContext())
        smsService = SmsService(requireContext())
        
        impostorCount = arguments?.getInt("impostor_count", 1) ?: 1
        
        startGame()
    }

    private fun startGame() {
        viewLifecycleOwner.lifecycleScope.launch {
            if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                binding.statusText.text = "Fehler: Keine SMS-Berechtigung!"
                return@launch
            }

            binding.statusText.text = "Wähle ein Wort..."
            delay(300)
            
            val players = gameRepository.getPlayers()
            if (players.isEmpty()) {
                binding.statusText.text = "Fehler: Keine Spieler!"
                return@launch
            }
            
            // Create game round
            val gameLogic = GameLogic(gameRepository)
            val gameRound = gameLogic.createGameRound(players, impostorCount)
            gameRepository.saveCurrentRound(gameRound)
            
            binding.statusText.text = "Sende Nachrichten..."
            
            val actualImpostorCount = gameRound.impostors.size
            // Wir wählen die Hilfswörter EINMAL vor der Schleife aus, damit alle die gleichen bekommen
            val sharedClues = gameRound.clues.shuffled().take(actualImpostorCount)
            
            // Send SMS to all players
            for (player in players) {
                binding.statusText.text = "Sende an ${player.name}..."
                delay(500) // Zeige den Namen kurz an bevor gesendet wird
                
                val isImpostor = gameRound.impostors.contains(player.id)
                
                try {
                    if (isImpostor) {
                        if (actualImpostorCount == 1) {
                            val clue = sharedClues.firstOrNull() ?: "???"
                            smsService.sendGameRoleMessage(player.phoneNumber, player.name, true, null, clue)
                        } else {
                            val otherImpostors = players.filter { 
                                it.id != player.id && gameRound.impostors.contains(it.id) 
                            }.map { it.name }
                            
                            if (otherImpostors.isNotEmpty()) {
                                smsService.sendCompliceMessage(player.phoneNumber, player.name, otherImpostors, sharedClues)
                            } else {
                                val clue = sharedClues.firstOrNull() ?: "???"
                                smsService.sendGameRoleMessage(player.phoneNumber, player.name, true, null, clue)
                            }
                        }
                    } else {
                        smsService.sendGameRoleMessage(player.phoneNumber, player.name, false, gameRound.word, null)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                
                // Wartezeit nach dem Senden für das Funkmodul
                delay(1200)
            }
            
            binding.statusText.text = "Fertig!"
            delay(500)
            
            onGameReady?.invoke()
        }
    }

    fun setOnGameReadyListener(listener: () -> Unit) {
        this.onGameReady = listener
    }
}


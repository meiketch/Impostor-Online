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
            val jesterCount = arguments?.getInt("jester_count", 0) ?: 0
            val detectiveCount = arguments?.getInt("detective_count", 0) ?: 0
            val detItemsCount = arguments?.getInt("det_items_count", 1) ?: 1
            val doppelMax = arguments?.getInt("doppel_max", 0) ?: 0
            
            val gameRound = gameLogic.createGameRound(
                players, 
                impostorCount, 
                jesterCount, 
                detectiveCount, 
                detItemsCount,
                doppelMax
            )
            gameRepository.saveCurrentRound(gameRound)
            
            binding.statusText.text = "Sende Nachrichten..."
            
            val sharedClues = gameRound.clues.shuffled().take(gameRound.impostors.size)
            val detectiveNames = players.filter { gameRound.detectives.contains(it.id) }.map { it.name }
            
            // Send SMS to all players
            for (player in players) {
                binding.statusText.text = "Sende an ${player.name}..."
                delay(500)
                
                when {
                    gameRound.impostors.contains(player.id) -> {
                        val otherImpostors = players.filter { 
                            it.id != player.id && gameRound.impostors.contains(it.id) 
                        }.map { it.name }
                        
                        var info = ""
                        if (jesterCount > 0) info += "\nEin Scherzbold ist im Spiel! 🤡"
                        if (detectiveNames.isNotEmpty()) info += "\nDetektive: ${detectiveNames.joinToString(", ")} 🕵️"
                        
                        if (otherImpostors.isNotEmpty()) {
                            val message = """
                                Impostor - ${player.name}
                                Deine Komplizen: ${otherImpostors.joinToString(", ")}
                                Eure Hilfswörter: ${sharedClues.joinToString(", ")}$info
                                🕵️‍♂️ 🕵️‍♀️
                            """.trimIndent()
                            smsService.sendGlobalInfoMessage(player.phoneNumber, message)
                        } else {
                            val clue = sharedClues.firstOrNull() ?: "???"
                            val message = "Impostor - ${player.name}\nDein Hilfswort: $clue$info\nFinde das Wort heraus! 🕵️"
                            smsService.sendGlobalInfoMessage(player.phoneNumber, message)
                        }
                    }
                    gameRound.jesters.contains(player.id) -> {
                        var info = ""
                        if (detectiveNames.isNotEmpty()) info += "\nDetektive: ${detectiveNames.joinToString(", ")} 🕵️"
                        
                        val message = """
                            🤡 Scherzbold - ${player.name}
                            Du kennst das Wort: ${gameRound.word}
                            Dein Ziel: Lass dich rausvoten!$info
                            Sei auffällig, aber nicht zu offensichtlich. 🎭
                        """.trimIndent()
                        smsService.sendGlobalInfoMessage(player.phoneNumber, message)
                    }
                    gameRound.detectives.contains(player.id) -> {
                        val items = gameRound.detectiveItemsMap[player.id] ?: emptyList()
                        var info = ""
                        if (jesterCount > 0) info += "\nEin Scherzbold ist im Spiel! 🤡"
                        val otherDets = detectiveNames.filter { it != player.name }
                        if (otherDets.isNotEmpty()) info += "\nAndere Detektive: ${otherDets.joinToString(", ")} 🕵️"

                        val message = """
                            🕵️ Detektiv - ${player.name}
                            Du spielst für die Spieler!$info
                            Deine verfügbaren Items:
                            ${items.joinToString("\n- ", prefix = "- ")}
                            Wähle eines aus und setze es klug ein! 🔍
                        """.trimIndent()
                        smsService.sendGlobalInfoMessage(player.phoneNumber, message)
                    }
                    gameRound.doppelgangers.contains(player.id) -> {
                        var info = ""
                        if (detectiveNames.isNotEmpty()) info += "\nDetektive: ${detectiveNames.joinToString(", ")} 🕵️"
                        
                        val message = """
                            🌓 Doppelgänger - ${player.name}
                            Du kennst das Wort NICHT.
                            Du gewinnst mit dem Team, das am Ende gewinnt.$info
                            Bleib bis zum Ende im Spiel! 🎭
                        """.trimIndent()
                        smsService.sendGlobalInfoMessage(player.phoneNumber, message)
                    }
                    else -> {
                        // Spieler - bekommt Infos über Scherzbolde und Detektive
                        var info = ""
                        if (jesterCount > 0) info += "\nEin Scherzbold ist im Spiel! 🤡"
                        if (detectiveNames.isNotEmpty()) info += "\nDetektive: ${detectiveNames.joinToString(", ")} 🕵️"
                        
                        val message = "Spieler - ${player.name}\nDas Wort ist: ${gameRound.word} ✓$info\nFinde den Impostor! 🔍"
                        smsService.sendGlobalInfoMessage(player.phoneNumber, message)
                    }
                }
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


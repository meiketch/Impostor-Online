package com.example.impostor.data

import kotlin.random.Random

class GameLogic(private val repository: GameRepository? = null) {
    
    fun selectGameWord(): GameWord {
        val words = repository?.getWordList() ?: WordList.words
        val random = Random(System.nanoTime())
        return words[random.nextInt(words.size)]
    }
    
    fun selectImpostors(playerIds: List<String>, impostorCount: Int): List<String> {
        require(impostorCount > 0 && impostorCount < playerIds.size) {
            "Impostoranzahl muss zwischen 1 und ${playerIds.size - 1} liegen"
        }
        
        // Wir verwenden System.nanoTime() als Seed für maximale Zufälligkeit
        val random = Random(System.nanoTime())
        return playerIds.shuffled(random).take(impostorCount)
    }
    
    fun getClueForImpostor(gameWord: GameWord, impostorCount: Int): String {
        return if (impostorCount == 1) {
            // Nur 1 Hilfswort für 1 Impostor
            gameWord.clues[Random.nextInt(gameWord.clues.size)]
        } else {
            // 2 verschiedene Hilfswörter für mehrere Impostoren
            gameWord.clues.shuffled().take(impostorCount).first()
        }
    }
    
    fun getCluesForImpostors(gameWord: GameWord, impostorCount: Int): List<String> {
        return if (impostorCount > 1) {
            gameWord.clues.shuffled().take(2)
        } else {
            listOf(gameWord.clues[Random.nextInt(gameWord.clues.size)])
        }
    }
    
    fun createGameRound(
        players: List<Player>,
        impostorCount: Int
    ): GameRound {
        require(players.size >= 3) { "Mindestens 3 Spieler erforderlich" }
        require(impostorCount > 0 && impostorCount < players.size) {
            "Impostoranzahl ungültig"
        }
        
        val word = selectGameWord()
        val playerIds = players.map { it.id }
        val impostors = selectImpostors(playerIds, impostorCount)
        
        return GameRound(
            id = System.currentTimeMillis().toString(),
            word = word.word,
            clues = word.clues,
            impostors = impostors,
            impostor1Id = impostors.getOrNull(0),
            impostor2Id = impostors.getOrNull(1),
            timestamp = System.currentTimeMillis()
        )
    }
}

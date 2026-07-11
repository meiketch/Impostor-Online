package com.example.impostor.data

import kotlin.random.Random

class GameLogic(private val repository: GameRepository? = null) {
    
    fun selectGameWord(): GameWord {
        val words = repository?.getWordList() ?: WordList.words
        val random = Random(System.nanoTime())
        return words[random.nextInt(words.size)]
    }
    
    fun createGameRound(
        players: List<Player>,
        impostorCount: Int,
        jesterCount: Int,
        detectiveCount: Int,
        itemsPerDetective: Int,
        doppelgangerMaxCount: Int
    ): GameRound {
        val random = Random(System.nanoTime())
        
        // Doppelgänger Anzahl zufällig bestimmen (0 bis Max)
        val actualDoppelCount = if (doppelgangerMaxCount > 0) random.nextInt(doppelgangerMaxCount + 1) else 0
        
        require(players.size >= (impostorCount + jesterCount + detectiveCount + actualDoppelCount + 1)) { 
            "Nicht genügend Spieler für diese Rollenverteilung" 
        }
        
        val word = selectGameWord()
        val shuffledPlayers = players.shuffled(random)
        
        val impostors = shuffledPlayers.take(impostorCount).map { it.id }
        val jesters = shuffledPlayers.drop(impostorCount).take(jesterCount).map { it.id }
        val detectives = shuffledPlayers.drop(impostorCount + jesterCount).take(detectiveCount).map { it.id }
        val doppelgangers = shuffledPlayers.drop(impostorCount + jesterCount + detectiveCount).take(actualDoppelCount).map { it.id }
        
        val allDetectiveItems = repository?.getDetectiveItems() ?: DefaultData.items
        val availableItems = allDetectiveItems.filter { it.minPlayers <= players.size }
        
        val detectiveItemsMap = detectives.associateWith {
            availableItems.shuffled(random).take(itemsPerDetective).map { it.name }
        }
        
        return GameRound(
            id = System.currentTimeMillis().toString(),
            word = word.word,
            clues = word.clues,
            impostors = impostors,
            jesters = jesters,
            detectives = detectives,
            doppelgangers = doppelgangers,
            detectiveItemsMap = detectiveItemsMap,
            timestamp = System.currentTimeMillis()
        )
    }
}

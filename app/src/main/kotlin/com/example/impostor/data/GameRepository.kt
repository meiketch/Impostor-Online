package com.example.impostor.data

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

data class Player(
    val id: String,
    val name: String,
    val phoneNumber: String
)

data class GameRound(
    val id: String,
    val word: String,
    val clues: List<String>,
    val impostors: List<String>,
    val jesters: List<String> = emptyList(),
    val detectives: List<String> = emptyList(),
    val doppelgangers: List<String> = emptyList(),
    val detectiveItemsMap: Map<String, List<String>> = emptyMap(), // playerId to items
    val timestamp: Long = System.currentTimeMillis()
)

class GameRepository(context: Context) {
    private val sharedPrefs: SharedPreferences = 
        context.getSharedPreferences("impostor_game", Context.MODE_PRIVATE)
    private val gson = Gson()

    // Players
    fun savePlayers(players: List<Player>) {
        val json = gson.toJson(players)
        sharedPrefs.edit().putString("players", json).apply()
    }

    fun getPlayers(): List<Player> {
        val json = sharedPrefs.getString("players", null) ?: return emptyList()
        val type = object : TypeToken<List<Player>>() {}.type
        return gson.fromJson(json, type)
    }

    fun addPlayer(player: Player) {
        val players = getPlayers().toMutableList()
        if (!players.any { it.phoneNumber == player.phoneNumber }) {
            players.add(player)
            savePlayers(players)
        }
    }

    fun removePlayer(phoneNumber: String) {
        val players = getPlayers().filter { it.phoneNumber != phoneNumber }
        savePlayers(players)
    }

    // Current Game Round
    fun saveCurrentRound(round: GameRound) {
        val json = gson.toJson(round)
        sharedPrefs.edit().putString("current_round", json).apply()
    }

    fun getCurrentRound(): GameRound? {
        val json = sharedPrefs.getString("current_round", null) ?: return null
        return gson.fromJson(json, GameRound::class.java)
    }

    fun clearCurrentRound() {
        sharedPrefs.edit().remove("current_round").apply()
    }

    // Settings
    fun saveLastImpostorCount(count: Int) {
        sharedPrefs.edit().putInt("last_impostor_count", count).apply()
    }
    fun getLastImpostorCount(): Int = sharedPrefs.getInt("last_impostor_count", 1)

    fun saveLastJesterCount(count: Int) {
        sharedPrefs.edit().putInt("last_jester_count", count).apply()
    }
    fun getLastJesterCount(): Int = sharedPrefs.getInt("last_jester_count", 0)

    fun saveLastDetectiveCount(count: Int) {
        sharedPrefs.edit().putInt("last_detective_count", count).apply()
    }
    fun getLastDetectiveCount(): Int = sharedPrefs.getInt("last_detective_count", 0)

    fun saveLastDetItemsCount(count: Int) {
        sharedPrefs.edit().putInt("last_det_items_count", count).apply()
    }
    fun getLastDetItemsCount(): Int = sharedPrefs.getInt("last_det_items_count", 1)

    fun saveLastDoppelgangerMaxCount(count: Int) {
        sharedPrefs.edit().putInt("last_doppel_count", count).apply()
    }
    fun getLastDoppelgangerMaxCount(): Int = sharedPrefs.getInt("last_doppel_count", 0)

    // Items and Rules
    fun getDetectiveItems(): List<DetectiveItem> {
        val json = sharedPrefs.getString("detective_items", null)
        return if (json == null) DefaultData.items else gson.fromJson(json, object : TypeToken<List<DetectiveItem>>() {}.type)
    }

    fun saveDetectiveItems(items: List<DetectiveItem>) {
        sharedPrefs.edit().putString("detective_items", gson.toJson(items)).apply()
    }

    // Game History
    fun saveGameHistory(rounds: List<GameRound>) {
        val json = gson.toJson(rounds)
        sharedPrefs.edit().putString("game_history", json).apply()
    }

    fun getGameHistory(): List<GameRound> {
        val json = sharedPrefs.getString("game_history", null) ?: return emptyList()
        val type = object : TypeToken<List<GameRound>>() {}.type
        return gson.fromJson(json, type)
    }

    fun addToGameHistory(round: GameRound) {
        val history = getGameHistory().toMutableList()
        history.add(round)
        saveGameHistory(history)
    }

    // Word List Management
    fun saveWordList(words: List<GameWord>) {
        val json = gson.toJson(words)
        sharedPrefs.edit().putString("custom_word_list", json).apply()
    }

    fun getWordList(): List<GameWord> {
        val json = sharedPrefs.getString("custom_word_list", null)
        return if (json == null) {
            WordList.words
        } else {
            val type = object : TypeToken<List<GameWord>>() {}.type
            gson.fromJson(json, type)
        }
    }

    fun addWord(word: GameWord) {
        val words = getWordList().toMutableList()
        if (!words.any { it.word.equals(word.word, ignoreCase = true) }) {
            words.add(word)
            saveWordList(words)
        }
    }

    fun deleteWord(wordStr: String) {
        val words = getWordList().filter { !it.word.equals(wordStr, ignoreCase = true) }
        saveWordList(words)
    }

    // Rules
    fun getRules(): String {
        return sharedPrefs.getString("game_rules", DefaultRules.content) ?: DefaultRules.content
    }

    fun saveRules(content: String) {
        sharedPrefs.edit().putString("game_rules", content).apply()
    }
}

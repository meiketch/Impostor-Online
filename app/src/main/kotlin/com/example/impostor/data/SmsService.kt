package com.example.impostor.data

import android.content.Context
import android.os.Build
import android.telephony.SmsManager

class SmsService(private val context: Context) {
    
    private fun getSmsManager(): SmsManager {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            context.getSystemService(SmsManager::class.java) ?: @Suppress("DEPRECATION") SmsManager.getDefault()
        } else {
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
        }
    }

    private fun normalizePhoneNumber(number: String): String {
        // Entferne alle Leerzeichen, Bindestriche und andere Sonderzeichen außer '+'
        return number.replace(Regex("[^0-9+]"), "")
    }
    
    private fun sendSms(phoneNumber: String, message: String) {
        val smsManager = getSmsManager()
        val cleanNumber = normalizePhoneNumber(phoneNumber)
        
        if (cleanNumber.isBlank()) return

        try {
            // Wir verwenden konsequent Multipart, da dies auf modernen Geräten 
            // und bei Sonderzeichen (Emojis) zuverlässiger ist.
            val parts = smsManager.divideMessage(message)
            smsManager.sendMultipartTextMessage(cleanNumber, null, parts, null, null)
        } catch (e: Exception) {
            e.printStackTrace()
            // Fallback auf einfache SMS falls Multipart fehlschlägt
            try {
                smsManager.sendTextMessage(cleanNumber, null, 
                    if (message.length > 160) message.substring(0, 157) + "..." else message, 
                    null, null)
            } catch (e2: Exception) {
                e2.printStackTrace()
            }
        }
    }

    fun sendGameRoleMessage(phoneNumber: String, playerName: String, isImpostor: Boolean, word: String?, clue: String?) {
        val message = if (isImpostor) {
            if (clue != null) {
                "Impostor - $playerName\nDein Hilfswort: $clue\nFinde das Wort heraus! 🕵️"
            } else {
                "Impostor - $playerName\nKein Hinweis verfügbar 🕵️"
            }
        } else {
            if (word != null) {
                "Spieler - $playerName\nDas Wort ist: $word ✓\nFinde den Impostor! 🔍"
            } else {
                "Spieler - $playerName\nKein Wort verfügbar ✓"
            }
        }
        sendSms(phoneNumber, message)
    }

    fun sendCompliceMessage(phoneNumber: String, playerName: String, accomplices: List<String>, clues: List<String>) {
        val message = """
            Impostor - $playerName
            Deine Komplizen: ${accomplices.joinToString(", ")}
            Eure Hilfswörter: ${clues.joinToString(", ")}
            🕵️‍♂️ 🕵️‍♀️
        """.trimIndent()
        sendSms(phoneNumber, message)
    }

    fun sendJesterMessage(phoneNumber: String, playerName: String, word: String) {
        val message = """
            🤡 Scherzbold - $playerName
            Du kennst das Wort: $word
            Dein Ziel: Lass dich rausvoten!
            Sei auffällig, aber nicht zu offensichtlich. 🎭
        """.trimIndent()
        sendSms(phoneNumber, message)
    }

    fun sendDetectiveMessage(phoneNumber: String, playerName: String, items: List<String>) {
        val message = """
            🕵️ Detektiv - $playerName
            Du spielst für die Spieler!
            Deine verfügbaren Items:
            ${items.joinToString("\n- ", prefix = "- ")}
            Wähle eines aus und setze es klug ein! 🔍
        """.trimIndent()
        sendSms(phoneNumber, message)
    }

    fun sendDoppelgangerMessage(phoneNumber: String, playerName: String) {
        val message = """
            🌓 Doppelgänger - $playerName
            Du kennst das Wort NICHT.
            Du gewinnst mit dem Team, das am Ende gewinnt.
            Bleib bis zum Ende im Spiel! 🎭
        """.trimIndent()
        sendSms(phoneNumber, message)
    }

    fun sendGlobalInfoMessage(phoneNumber: String, message: String) {
        sendSms(phoneNumber, message)
    }
}


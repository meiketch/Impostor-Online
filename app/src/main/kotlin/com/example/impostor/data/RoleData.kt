package com.example.impostor.data

data class DetectiveItem(
    val name: String,
    val description: String,
    val minPlayers: Int = 0,
    val usesFormula: String? = null // e.g. "playerCount/3"
)

object DefaultData {
    val items = listOf(
        DetectiveItem("🔫 Instant Vote", "Der DT kann jederzeit einen Spieler sofort aus dem Spiel entfernen. Keine Abstimmung nötig."),
        DetectiveItem("❤️ Wiederbelebung", "Der DT kann einen ausgeschiedenen Spieler zurückholen."),
        DetectiveItem("🚫 Extra-Wort", "Der DT bestimmt ein zusätzliches verbotenes Wort. Alle normalen Spieler kennen es, der Impostor nicht."),
        DetectiveItem("🛡️ Immunität", "Der DT schützt einen Spieler. Dieser kann für Spieleranzahl/3 Runden nicht rausgevotet werden.", usesFormula = "playerCount/3"),
        DetectiveItem("🔄 Rollenwechsel", "Der DT darf die komplette Sitzordnung frei verändern."),
        DetectiveItem("⏭️ Skip", "Der DT kann Spieler überspringen lassen. Der Spieler gibt keinen Hinweis.", usesFormula = "playerCount/3"),
        DetectiveItem("⚖️ Zwangsvote", "Der DT erzwingt sofort eine Abstimmung. Alle müssen wählen. Bei Gleichstand entscheidet der DT."),
        DetectiveItem("❌ Veto", "Der DT kann eine Abstimmung aufheben. Die nächste Abstimmung ist für Spieleranzahl/3 Runden gesperrt.", usesFormula = "playerCount/3"),
        DetectiveItem("⚡ Fast Forward", "Ab Aktivierung muss jeder Spieler pro Runde zwei Hinweise geben."),
        DetectiveItem("🔫 Goldene Pistole", "Der DT erhält eine Pistole und kann sie weitergeben. Impostor getroffen -> Impostor scheidet aus. Kein Impostor -> Schütze scheidet aus.", minPlayers = 8, usesFormula = "max(1, playerCount/5)")
    )
}

object DefaultRules {
    val content = """
        # 🕵️ Spielregeln
        
        Ziel des Spiels ist es, den Impostor zu entlarven, bevor dieser alle anderen täuscht.
        
        ## 🤡 Scherzbold (Jester)
        Der Scherzbold gewinnt alleine, wenn er rausgevoted wird.
        - Kennt das normale Wort.
        - Muss versuchen wie ein Impostor zu wirken.
        
        ## 🕵️ Detektiv
        Der Detektiv spielt für die Bürger.
        - Alle Spieler wissen wer Detektiv ist.
        - Hat Zugriff auf Spezial-Items.
        
        ## 🌓 Doppelgänger
        Kennt das Wort nicht.
        - Gewinnt mit dem Gewinner-Team.
        - Verliert wenn er rausgevoted wird.
    """.trimIndent()
}

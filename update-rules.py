#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read app.js
with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the old rulesHtml variable
start_marker = 'const rulesHtml = `'
end_marker = '`;'

start_pos = content.find(start_marker)
if start_pos == -1:
    print("ERROR: Could not find start of rulesHtml")
    exit(1)

# Find the end - we need to find the ]; that closes the template literal
search_pos = start_pos + len(start_marker)
# Look for `; pattern (backtick followed by semicolon)
end_pos = -1
i = search_pos
while i < len(content) - 1:
    if content[i] == '`' and content[i+1] == ';':
        end_pos = i + 2
        break
    i += 1

if end_pos == -1:
    print("ERROR: Could not find end of rulesHtml")
    exit(1)

print(f"Found rulesHtml from position {start_pos} to {end_pos}")

# New rules text (HTML content)
new_rules_content = '''const rulesHtml = `
  <h1>IMPOSTOR</h1>
  <h3>Das Partyspiel um Bluff, Misstrauen und Chaos</h3>

  <h2>1. Spielidee</h2>
  <p>Bei <strong>IMPOSTOR</strong> kennen die meisten Spieler ein geheimes Wort. Sie müssen es beschreiben, ohne das Wort selbst zu nennen oder zu offensichtlich zu verraten.</p>
  <p>Doch nicht jeder kennt das Wort:</p>
  <ul>
    <li>Die <strong>Impostoren</strong> kennen das Wort nicht und müssen es anhand von Hinweisen herausfinden.</li>
    <li>Der <strong>Jester</strong> kennt das Wort und möchte absichtlich aus dem Spiel fliegen.</li>
    <li>Der <strong>Doppelgänger</strong> verfolgt kein eigenes Teamziel, sondern gewinnt mit der Partei, die das Spiel gewinnt – solange er selbst nicht eliminiert wurde.</li>
    <li>Der <strong>Detektiv</strong> kennt das Wort und ist eine öffentlich bekannte Sonderrolle.</li>
  </ul>
  <p>Durch Beschreibungen, Diskussionen, Lügen, Anschuldigungen und Abstimmungen versuchen die Spieler herauszufinden, wem sie vertrauen können.</p>
  <p><strong>Bluffen und Lügen sind ausdrücklich Teil des Spiels.</strong></p>

  <h2>2. Rollen</h2>

  <h3>Normale Spieler</h3>
  <p>Normale Spieler:</p>
  <ul>
    <li>kennen das geheime Wort,</li>
    <li>beschreiben es nach den geltenden Regeln,</li>
    <li>dürfen lügen und bluffen,</li>
    <li>dürfen andere beschuldigen,</li>
    <li>dürfen behaupten, eine andere Rolle zu besitzen,</li>
    <li>gewinnen, wenn die Impostoren ausscheiden und ihre letzte Chance scheitert.</li>
  </ul>

  <h3>Impostor</h3>
  <p>Der Impostor kennt das geheime Wort <strong>nicht</strong>.</p>
  <p>Stattdessen erhält er Hinweise, mit denen er versuchen muss, das Wort herauszufinden.</p>

  <h4>Mehrere Impostoren</h4>
  <p>Wenn mehrere Impostoren im Spiel sind:</p>
  <ul>
    <li>kennen sie sich gegenseitig,</li>
    <li>sehen alle exakt dieselben Hinweiswörter,</li>
    <li>erhalten sie so viele Hinweiswörter wie Impostoren im Spiel sind.</li>
  </ul>
  <p>Impostoren dürfen sich <strong>offen</strong> miteinander absprechen.</p>
  <p>Verboten ist lediglich geheime Kommunikation, beispielsweise:</p>
  <ul>
    <li>private Nachrichten,</li>
    <li>heimliche Chats,</li>
    <li>Nachrichten über Discord,</li>
    <li>andere nicht für alle sichtbare Kommunikation.</li>
  </ul>
  <p>Offene Gespräche, Blicke, Gesten, Winken oder gegenseitige Absprachen am Tisch sind erlaubt.</p>
  <p>Ein Impostor darf sogar einen anderen Impostor beschuldigen oder gegen ihn stimmen.</p>

  <h4>Das Wort erraten</h4>
  <p>Ein Impostor darf jederzeit versuchen, das geheime Wort zu erraten.</p>
  <p>Das ist nicht an seinen eigenen Zug gebunden und darf auch während einer Diskussion oder als Unterbrechung erfolgen.</p>
  <p>Sobald ein Impostor das exakte Wort oder eine grammatikalisch zulässige Variante davon als <strong>Rateversuch</strong> nennt, gilt das Wort als erraten.</p>
  <ul>
    <li><strong>Treffer:</strong> Die Impostoren gewinnen sofort.</li>
    <li><strong>Falscher Versuch:</strong> Der Impostor bleibt im Spiel, darf aber nicht einfach aufgrund desselben Versuchs erneut raten.</li>
  </ul>

  <h4>Versehentliches Nennen des Wortes</h4>
  <p>Nennt ein Impostor das geheime Wort während seiner Beschreibung versehentlich selbst, zählt dies ebenfalls als erfolgreicher Rateversuch.</p>
  <p>Die Absicht spielt dabei keine Rolle.</p>

  <h3>Jester</h3>
  <p>Der Jester kennt das geheime Wort.</p>
  <p>Er möchte jedoch <strong>eliminiert werden</strong>.</p>
  <p>Der Jester gewinnt sofort, sobald er aus dem Spiel entfernt wird – unabhängig davon, wodurch dies geschieht.</p>
  <p>Das gilt beispielsweise bei:</p>
  <ul>
    <li>einer Abstimmung,</li>
    <li>einem Detektiv-Item,</li>
    <li>einem anderen Spieleffekt.</li>
  </ul>

  <h4>Informationen des Jesters</h4>
  <p>Der Jester kennt:</p>
  <ul>
    <li>das geheime Wort,</li>
    <li>die Anzahl der Impostoren,</li>
    <li>die Anzahl der Jester,</li>
    <li>ob Doppelgänger im Spiel sind,</li>
    <li>wer der Detektiv ist.</li>
  </ul>
  <p>Er kennt jedoch <strong>nicht die anderen Jester</strong>.</p>
  <p>Auch wenn mehrere Jester gleichzeitig im Spiel sind, wissen sie nicht voneinander.</p>

  <h4>Jester und Beschreibungen</h4>
  <p>Der Jester ist von fast allen normalen Beschreibungsregeln befreit.</p>
  <p>Er darf beispielsweise:</p>
  <ul>
    <li>mehr als drei Wörter benutzen,</li>
    <li>einen vollständigen Satz sagen,</li>
    <li>bewusst eine ungewöhnliche Beschreibung verwenden,</li>
    <li>andere Spieler provozieren,</li>
    <li>absichtlich verdächtig wirken.</li>
  </ul>
  <p>Das ist regelkonform.</p>
  <p>Allerdings ist es möglicherweise keine besonders clevere Strategie, offen gegen die Beschreibungsregeln zu verstoßen, da dies seine Rolle verraten kann.</p>
  <p>Die allgemeine Regel gegen das direkte Nennen bzw. Verwenden des Zielwortes oder seiner Wortbestandteile bleibt bestehen.</p>

  <h3>Doppelgänger</h3>
  <p>Der Doppelgänger ist eine eigenständige geheime Rolle.</p>
  <p>Er ist:</p>
  <ul>
    <li>kein normaler Spieler,</li>
    <li>kein Impostor,</li>
    <li>kein Jester.</li>
  </ul>
  <p>Der Doppelgänger kennt ausschließlich seine eigene Rolle.</p>
  <p>Er kennt <strong>nicht</strong>:</p>
  <ul>
    <li>das geheime Wort,</li>
    <li>die Impostoren,</li>
    <li>die Impostor-Hinweise,</li>
    <li>den Detektiv,</li>
    <li>andere Doppelgänger.</li>
  </ul>
  <p>Wenn mehrere Doppelgänger im Spiel sind, wissen sie nicht voneinander.</p>

  <h4>Ziel des Doppelgängers</h4>
  <p>Der Doppelgänger gewinnt mit der Partei, die das Spiel gewinnt.</p>
  <p>Das kann sein:</p>
  <ul>
    <li>die normalen Spieler,</li>
    <li>die Impostoren,</li>
    <li>der Jester.</li>
  </ul>
  <p>Die einzige Voraussetzung:</p>
  <p><strong>Der Doppelgänger darf selbst nicht eliminiert worden sein.</strong></p>
  <p>Wird er vor dem Spielende herausgewählt oder anderweitig entfernt, verliert er unabhängig davon, wer anschließend gewinnt.</p>
  <p>Der Doppelgänger muss niemals öffentlich erklären, zu welcher Seite er gehört oder wen er unterstützt.</p>

  <h3>Detektiv</h3>
  <p>Der Detektiv ist eine <strong>öffentliche Rolle</strong>.</p>
  <p>Alle Spieler wissen, wer der Detektiv ist.</p>
  <p>Der Detektiv:</p>
  <ul>
    <li>kennt das geheime Wort,</li>
    <li>kennt die Anzahl der Impostoren,</li>
    <li>kennt die Anzahl der Jester,</li>
    <li>weiß, ob Doppelgänger im Spiel sind,</li>
    <li>kennt seine eigene Rolle.</li>
  </ul>
  <p>Er beschreibt das Wort grundsätzlich wie ein normaler Spieler.</p>

  <h4>Abstimmungen</h4>
  <p>Der Detektiv ist grundsätzlich <strong>nicht stimmberechtigt</strong>.</p>
  <p>Er kann jedoch durch ein entsprechendes Detektiv-Item vorübergehend oder auf andere Weise eine Abstimmung auslösen bzw. daran teilnehmen, sofern dies in der Beschreibung des jeweiligen Items vorgesehen ist.</p>
  <p>Der Detektiv kann selbst herausgewählt werden.</p>

  <h2>3. Detektiv-Items</h2>
  <p>Der Detektiv erhält eine Auswahl verschiedener Items.</p>
  <p>Alle Spieler wissen:</p>
  <ul>
    <li>welche Items grundsätzlich verfügbar sind,</li>
    <li>wie viele Items zur Auswahl stehen,</li>
    <li>wie viele davon der Detektiv verwenden kann.</li>
  </ul>
  <p>Die konkreten verfügbaren Items und die Anzahl der Items, die der Detektiv verwenden kann, werden öffentlich bekannt gegeben. Dadurch weiß jeder, welche Möglichkeiten dem Detektiv zur Verfügung hat.</p>
  <p>Der Detektiv kann selbst entscheiden, wann er ein Item verwendet.</p>
  <p>Er darf sich auch von anderen Spielern beraten lassen.</p>

  <h3>Einmalige Verwendung</h3>
  <p>Ein verwendetes Item ist verbraucht.</p>

  <h3>Übertragbare Items</h3>
  <p>Bestimmte Items können an andere Spieler weitergegeben werden.</p>
  <p>Beispiel: <strong>Goldene Pistole</strong></p>
  <p>Der Detektiv kann sie einem anderen Spieler geben.</p>
  <p>Danach kann der Detektiv das Item <strong>nicht zurückfordern</strong>.</p>
  <p>Der Spieler, der das Item besitzt, entscheidet selbst, was er damit macht.</p>
  <p>Er darf:</p>
  <ul>
    <li>das Item wie vorher besprochen einsetzen,</li>
    <li>etwas anderes behaupten und etwas anderes tun,</li>
    <li>darüber lügen,</li>
    <li>es für einen anderen Zweck einsetzen, sofern die Item-Regeln dies erlauben,</li>
    <li>es an einen weiteren Spieler weitergeben,</li>
    <li>es behalten.</li>
  </ul>
  <p>Ein Spieler könnte beispielsweise behaupten: „Ich benutze die Goldene Pistole gegen B." und sie anschließend trotzdem gegen jemand anderen einsetzen.</p>
  <p>Auch ein Jester darf ein übertragenes Item besitzen und entsprechend seiner eigenen Strategie einsetzen.</p>

  <h3>Detektiv wird eliminiert</h3>
  <p>Wird der Detektiv eliminiert, wird ein Detektiv-Item, das sich zu diesem Zeitpunkt noch beim Detektiv befindet, deaktiviert, sofern es über das gesamte Spiel hinweg aktiv war.</p>
  <p>Bereits an andere Spieler übertragene Items verfallen nicht und bleiben weiterhin aktiv. Sie können entsprechend ihrer jeweiligen Item-Regeln genutzt werden.</p>

  <h2>4. Beschreibungen</h2>
  <p>In jeder Runde sagt jeder lebende Spieler einmal etwas zum geheimen Wort.</p>

  <h3>Normale Beschreibung</h3>
  <p>Eine Beschreibung besteht grundsätzlich aus <strong>einem Wort</strong>.</p>
  <p>Es sind bis zu <strong>drei Wörter</strong> erlaubt, wenn diese zusammen eine sinnvolle kurze Wortgruppe oder Aussage bilden.</p>
  <p>Die Beschreibung muss einen nachvollziehbaren Bezug zum geheimen Wort besitzen.</p>
  <p>Der Zusammenhang darf auch indirekt oder assoziativ sein.</p>

  <h3>Verbotene Beschreibungen</h3>
  <p>Nicht erlaubt sind:</p>
  <ul>
    <li>das geheime Wort selbst,</li>
    <li>Bestandteile des geheimen Wortes,</li>
    <li>Teile bzw. Wortstämme des Zielwortes,</li>
    <li>zusammengesetzte Wörter, die einen verbotenen Bestandteil enthalten,</li>
    <li>Übersetzungen des Zielwortes,</li>
    <li>einzelne Buchstaben oder Silben als Hinweis,</li>
    <li>Aussagen wie „Der erste Teil des Wortes ist …",</li>
    <li>allgemein anerkannte Synonyme oder alternative Bezeichnungen,</li>
    <li>grammatikalische Varianten des Zielwortes.</li>
  </ul>
  <p>Beispielsweise darf eine Beschreibung nicht dadurch zulässig gemacht werden, dass lediglich Singular und Plural oder eine andere grammatikalische Form verwendet wird.</p>

  <h3>Fair Play</h3>
  <p>Auch wenn ein bestimmtes verbotenes Wort theoretisch so unbekannt ist, dass andere Spieler es nicht erkennen würden, soll es nicht absichtlich als Schlupfloch verwendet werden.</p>
  <p>Das Spiel lebt davon, dass die Spieler versuchen, <strong>clever zu beschreiben, ohne die Regeln auszutricksen</strong>.</p>

  <h2>5. Bluffen und Lügen</h2>
  <p>IMPOSTOR ist ausdrücklich ein Spiel mit Täuschung.</p>
  <p>Spieler dürfen über ihre Informationen lügen.</p>
  <p>Sie dürfen beispielsweise behaupten:</p>
  <ul>
    <li>„Ich bin der Detektiv."</li>
    <li>„Ich kenne das Wort."</li>
    <li>„Ich bin Impostor."</li>
    <li>„B ist definitiv der Impostor."</li>
    <li>„Ich habe gerade Item X benutzt."</li>
  </ul>
  <p>Ob eine solche Aussage wahr ist, bleibt jedem selbst überlassen.</p>

  <h3>Technische Informationen</h3>
  <p>Nicht erlaubt ist es, Informationen zu verwenden, die ein Spieler ausschließlich durch einen Blick hinter die technische Umsetzung des Spiels erhalten kann.</p>
  <p>Informationen aus:</p>
  <ul>
    <li>Quellcode,</li>
    <li>internen Spieldaten,</li>
    <li>technischen Debug-Informationen,</li>
    <li>anderen nicht für das Spiel vorgesehenen technischen Quellen</li>
  </ul>
  <p>dürfen nicht zum eigenen Vorteil verwendet oder anderen Spielern zugänglich gemacht werden.</p>

  <h2>6. Rundenablauf</h2>
  <p>Die erste Runde beginnt bei einem beliebigen Spieler.</p>
  <p>Die Gruppe kann beispielsweise festlegen, wer anfangen möchte.</p>
  <p>Danach geht es der Reihe nach weiter.</p>
  <p>Beispiel:</p>
  <p><strong>A → B → C → D → A → B …</strong></p>
  <p>Wird B eliminiert, wird daraus:</p>
  <p><strong>A → C → D → A → C …</strong></p>
  <p>Jeder lebende Spieler ist einmal pro Runde an der Reihe.</p>
  <p>Eine Runde endet, sobald alle noch lebenden Spieler einmal an der Reihe waren.</p>
  <p>Diskussionen dürfen jederzeit stattfinden.</p>
  <p>Es gibt keine vorgeschriebene Diskussionsphase.</p>

  <h2>7. Abstimmungen</h2>
  <p>Eine Abstimmung kann von <strong>jedem stimmberechtigten Spieler jederzeit</strong> ausgelöst werden.</p>
  <p>Der Spieler, der die Abstimmung startet, kann seine Anschuldigung erklären.</p>
  <p>Danach darf die Gruppe diskutieren.</p>
  <p>Die beschuldigte Person erhält die Möglichkeit, sich kurz zu verteidigen.</p>
  <p>Anschließend wird offen abgestimmt.</p>

  <h3>Stimmberechtigt</h3>
  <p>Stimmberechtigt sind grundsätzlich:</p>
  <ul>
    <li>normale Spieler,</li>
    <li>Impostoren,</li>
    <li>Jester,</li>
    <li>Doppelgänger.</li>
  </ul>
  <p>Der Detektiv ist grundsätzlich nicht stimmberechtigt.</p>

  <h3>Echte Mehrheit</h3>
  <p>Eine Person wird nur eliminiert, wenn sie <strong>mehr als 50 % der gesamten Stimmberechtigten</strong> auf sich vereint.</p>
  <p>Es reicht also nicht, genau die Hälfte der Stimmen zu bekommen.</p>
  <p>Beispiel:</p>
  <p>Bei 4 Stimmberechtigten reichen 2 Stimmen <strong>nicht</strong>.</p>
  <p>Es werden mindestens 3 Stimmen benötigt.</p>

  <h3>Keine Mehrheit</h3>
  <p>Erreicht niemand eine echte Mehrheit, wird niemand eliminiert.</p>
  <p>Das Spiel läuft anschließend normal weiter.</p>
  <p>Es gibt keinen automatischen Wiederholungszwang.</p>

  <h2>8. Sonderregel: Drei erfolglose Abstimmungen</h2>
  <p>Um zu verhindern, dass eine Gruppe das Spiel durch endlose Pattsituationen blockiert, gilt:</p>
  <p><strong>Sobald mindestens 4 Spieler leben und drei Abstimmungen hintereinander erfolglos geblieben sind, muss anschließend ein Spieler ausscheiden.</strong></p>
  <p>Eine Abstimmung gilt als erfolglos, wenn niemand eine echte Mehrheit von mehr als 50 % der Stimmberechtigten erreicht.</p>

  <h3>Wer muss gehen?</h3>
  <p>Wenn sich die Spieler nach der dritten erfolglosen Abstimmung <strong>nicht darauf einigen können, wer ausscheidet</strong>, wird derjenige eliminiert, der die <strong>erste der drei erfolglosen Abstimmungen gestartet hat</strong>.</p>
  <p>Damit kann eine Gruppe das Spiel nicht unbegrenzt durch Uneinigkeit am Leben halten.</p>

  <h2>9. Ausscheiden</h2>
  <p>Wird ein Spieler eliminiert, wird seine tatsächliche Rolle aufgedeckt.</p>
  <p>Bis zu diesem Zeitpunkt darf der Spieler gelogen haben.</p>
  <p>Nach der Aufdeckung ist seine tatsächliche Rolle bekannt.</p>

  <h3>Ausgeschiedener Impostor</h3>
  <p>Wird ein Impostor durch eine Abstimmung eliminiert, erhält er <strong>genau einen letzten Rateversuch</strong>.</p>
  <p>Er darf das geheime Wort nennen.</p>
  <ul>
    <li><strong>Richtig:</strong> Das gesamte Impostor-Team gewinnt sofort.</li>
    <li><strong>Falsch:</strong> Der Impostor ist endgültig ausgeschieden.</li>
  </ul>
  <p>Es gibt keinen zweiten Versuch.</p>
  <p>Bleibt nach einem falschen letzten Rateversuch kein lebender Impostor mehr übrig, gewinnen die normalen Spieler.</p>
  <p>Bleibt mindestens ein anderer Impostor am Leben, wird weitergespielt.</p>

  <h3>Ausgeschiedener Jester</h3>
  <p>Wird der Jester eliminiert, gewinnt er sofort.</p>

  <h3>Ausgeschiedener Doppelgänger</h3>
  <p>Wird der Doppelgänger eliminiert, verliert er.</p>
  <p>Das Spiel selbst läuft entsprechend der normalen Siegbedingungen weiter.</p>

  <h3>Ausgeschiedener Detektiv</h3>
  <p>Der Detektiv verliert und scheidet aus.</p>
  <p>Ein Detektiv-Item, das sich zu diesem Zeitpunkt noch beim Detektiv befindet, wird deaktiviert, sofern es über das gesamte Spiel hinweg aktiv war.</p>
  <p>Bereits weitergegebene Items verfallen nicht und bleiben erhalten.</p>

  <h2>10. Die Impostor-Mehrheitsregel</h2>
  <p>Das Spiel endet für die Impostoren, sobald eine Abstimmung gegen sie faktisch nicht mehr sinnvoll möglich ist.</p>
  <p>Dafür wird die Anzahl der lebenden Impostoren mit den <strong>relevanten lebenden Gegenspielern</strong> verglichen.</p>
  <p>Die Impostoren gewinnen sofort, wenn:</p>
  <p><strong>Anzahl lebender Impostoren ≥ Anzahl relevanter lebender Gegenspieler</strong></p>

  <h3>Wer zählt als Gegenspieler?</h3>
  <p>Grundsätzlich zählen:</p>
  <ul>
    <li>normale Spieler,</li>
    <li>Jester,</li>
    <li>Doppelgänger.</li>
  </ul>
  <p>Der Detektiv zählt <strong>niemals</strong> für diese Berechnung.</p>

  <h3>Sonderregel für den Jester</h3>
  <p>Solange <strong>mindestens 4 Spieler leben</strong>, zählt der Jester als Gegenspieler.</p>
  <p>Sobald <strong>weniger als 4 Spieler leben</strong>, zählt der Jester nicht mehr für diese Berechnung.</p>
  <p>Der Doppelgänger zählt dagegen <strong>immer</strong>, unabhängig davon, wie viele Spieler noch leben.</p>

  <h3>Beispiel 1</h3>
  <p><strong>1 Impostor + 1 normaler Spieler + 1 Jester</strong></p>
  <p>Es leben nur 3 Spieler.</p>
  <p>Der Jester zählt deshalb nicht mehr.</p>
  <p>Damit stehen:</p>
  <p><strong>1 Impostor : 1 relevanter Gegenspieler</strong></p>
  <p>Die Impostoren gewinnen.</p>

  <h3>Beispiel 2</h3>
  <p><strong>1 Impostor + 1 normaler Spieler + 1 Doppelgänger</strong></p>
  <p>Der Doppelgänger zählt auch bei nur 3 Spielern.</p>
  <p>Damit stehen:</p>
  <p><strong>1 Impostor : 2 relevante Gegenspieler</strong></p>
  <p>Das Spiel geht weiter.</p>
  <p>Der Doppelgänger muss dabei nicht erklären, auf wessen Seite er steht.</p>

  <h2>11. Siegbedingungen</h2>

  <h3>Normale Spieler</h3>
  <p>Die normalen Spieler gewinnen, wenn:</p>
  <ul>
    <li>kein Impostor mehr lebt,</li>
    <li>und ein ausgeschiedener letzter Impostor seinen finalen Rateversuch falsch abgegeben hat.</li>
  </ul>
  <p>Der Jester gewinnt nicht automatisch mit den normalen Spielern, solange er noch lebt.</p>

  <h3>Impostoren</h3>
  <p>Die Impostoren gewinnen, wenn:</p>
  <ol>
    <li>ein Impostor das geheime Wort korrekt errät,</li>
    <li>ein ausgeschiedener Impostor seinen letzten Rateversuch korrekt abgibt,</li>
    <li>die Impostor-Mehrheitsregel erreicht wird.</li>
  </ol>
  <p>Alle Impostoren gewinnen gemeinsam.</p>
  <p>Das gilt auch für bereits ausgeschiedene Impostoren, wenn ein noch gültiger finaler Rateversuch ihres Teams erfolgreich ist.</p>

  <h3>Jester</h3>
  <p>Der Jester gewinnt, sobald er eliminiert wird.</p>
  <p>Das Spiel endet in diesem Moment.</p>

  <h3>Doppelgänger</h3>
  <p>Der Doppelgänger gewinnt mit der Partei, die das Spiel gewinnt, <strong>solange er selbst nicht eliminiert wurde</strong>.</p>
  <p>Er kann daher gemeinsam mit:</p>
  <ul>
    <li>den normalen Spielern,</li>
    <li>den Impostoren,</li>
    <li>oder dem Jester</li>
  </ul>
  <p>gewinnen.</p>

  <h2>12. Rollenverteilung</h2>
  <p>Die genaue Rollenverteilung kann an die Größe der Gruppe angepasst werden.</p>
  <p>Mehrere Sonderrollen können gleichzeitig vorhanden sein, sofern die Spielerzahl dies sinnvoll zulässt.</p>
  <p>Mehrere Jester oder mehrere Doppelgänger sind möglich.</p>
  <p>Mehrere Doppelgänger kennen sich nicht.</p>
  <p>Bei einer zufälligen Zusammenstellung kann es vorkommen, dass eine Runde ungewöhnlich viele oder ungünstig kombinierte Sonderrollen enthält.</p>
  <p>Wenn eine Kombination offensichtlich nicht sinnvoll oder gewünscht ist, kann die Rollenverteilung neu ausgelost werden.</p>

  <h2>13. Grundprinzip des Spiels</h2>
  <p>IMPOSTOR funktioniert am besten, wenn die Spieler ihre Informationen nicht nur logisch, sondern auch sozial bewerten.</p>
  <p>Ein Spieler darf:</p>
  <ul>
    <li>überzeugend lügen,</li>
    <li>völlig falsche Anschuldigungen machen,</li>
    <li>sich absichtlich verdächtig verhalten,</li>
    <li>andere Spieler gegeneinander ausspielen,</li>
    <li>einen Mitspieler verteidigen,</li>
    <li>einen Verbündeten beschuldigen,</li>
    <li>sich als eine andere Rolle ausgeben,</li>
    <li>oder bewusst Chaos verursachen.</li>
  </ul>
  <p>Solange die Regeln eingehalten werden, ist <strong>Täuschung kein Regelbruch, sondern Teil des Spiels</strong>.</p>
  <p>Das Ziel ist nicht, möglichst ordentlich zu spielen.</p>
  <p>Das Ziel ist, die anderen davon zu überzeugen, dass <strong>du recht hast</strong>.</p>
`;
'''

# Replace
new_content = content[:start_pos] + new_rules_content + content[end_pos:]

# Write back
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully updated rulesHtml!")

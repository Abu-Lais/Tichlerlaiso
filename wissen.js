// Fachliche Orientierung für das Lernmodell. Die Quelle ist keine Freigabe
// einer bestimmten Maschine und ersetzt keine modellbezogene Unterweisung.
const holzSource =
  "https://www.bghm.de/arbeitsschuetzer/themen/holz/holzbearbeitungsmaschinen";

export const PROJECT_STEPS = [
  {
    id: "verstehen",
    title: "Den Auftrag wirklich verstehen",
    short: "Plan verstehen",
    goal: "Du kannst erklären, was du bauen sollst und welche Angaben noch fehlen.",
    why: "Ein unklarer Plan wird durch schnelles Arbeiten nicht klarer. Eine geklärte Frage spart später Material und Umwege.",
    task: "Betrachte zuerst ein Bauteil im Plan. Finde seinen Namen, seine Anzahl und seine Fertigmaße. Markiere jede offene Angabe.",
    checks: [
      "Aufbau und fünf selbst gefertigte Holzhaken sind verstanden.",
      "Maße und Befestigungsart sind im Plan gefunden oder als Frage notiert.",
      "Das gewünschte Endergebnis ist mit dem Auftraggeber geklärt.",
    ],
    machineId: null,
    lessonId: "plan-lesen",
  },
  {
    id: "material",
    title: "Geeignetes Holz auswählen",
    short: "Holz auswählen",
    goal: "Du wählst aus vorhandenem Material eine geeignete, wirtschaftliche Möglichkeit.",
    why: "Der niedrigste Preis allein hilft nicht, wenn Maße, Zustand oder Verwendung nicht passen. Ein nutzbarer Rest kann dagegen sehr wertvoll sein.",
    task: "Erfasse ein vorhandenes Brett mit seinen nutzbaren Maßen, seinem Zustand und dem Preis für das gesamte Brett. Holzart unbekannt ist eine erlaubte Antwort.",
    checks: [
      "Nutzbare Maße und erkennbare Schäden sind erfasst.",
      "Holzart und Eignung sind geklärt oder bewusst als offen markiert.",
      "Die Materialwahl passt zu Nutzung, Befestigung und gewünschter Oberfläche.",
    ],
    machineId: null,
    lessonId: "material-wirtschaftlich",
  },
  {
    id: "stueckliste",
    title: "Aus dem Plan wird eine Stückliste",
    short: "Stückliste",
    goal: "Jedes Bauteil hat eine Stückzahl, eindeutige Fertigmaße und begründete Rohmaße.",
    why: "Eine Stückliste verbindet Zeichnung und Werkstatt. Du kannst damit vor dem ersten Schnitt prüfen, ob Material und Auftrag zusammenpassen.",
    task: "Trage die Maße vom Plan ein. Lege die nötigen Zugaben mit deinem Ausbilder fest und prüfe anschließend die erzeugten Rohmaße.",
    checks: [
      "Alle Maße sind in Millimetern und in der Reihenfolge Länge × Breite × Dicke erfasst.",
      "Stückzahlen, Faserrichtung und Material sind dem Plan zugeordnet.",
      "Rohmaßzugaben und der konkrete Arbeitsablauf sind fachlich abgestimmt.",
    ],
    machineId: null,
    lessonId: "roh-fertig",
  },
  {
    id: "ablaengen",
    title: "Das Ablängen vorbereiten",
    short: "Ablängen",
    goal: "Du kennst das Längenziel, die zugehörige Maschine und die offenen Voraussetzungen.",
    why: "Rohzuschnitt und Fertigzuschnitt haben unterschiedliche Ziele. Das Werkstück muss für den vorgesehenen Arbeitsgang geeignet und beherrschbar sein.",
    task: "Vergleiche Roh- und Fertiglänge. Besprich die konkrete Aufteilung des Materials und den Arbeitsgang an der vorhandenen Kappsäge.",
    checks: [
      "Das Ziel dieses Arbeitsgangs ist als Roh- oder Fertigmaß eindeutig.",
      "Aufteilung, Werkstückgröße und Arbeitsweise wurden an der konkreten Maschine besprochen.",
      "Das entstandene Ergebnis ist gegen das vorgesehene Maß geprüft.",
    ],
    machineId: "saw",
    lessonId: "bezug-anschlag",
  },
  {
    id: "abrichten",
    title: "Eine verlässliche Bezugsfläche verstehen",
    short: "Abrichten",
    goal: "Du verstehst, welche Fläche oder Kante als Bezug für weitere Bearbeitung dient.",
    why: "Weitere Maße brauchen eine eindeutige Ausgangsfläche. Eine krumme Fläche wird durch das Messen allein nicht zu einer verlässlichen Referenz.",
    task: "Lass dir am Werkstück die vorgesehene Bezugsfläche und Bezugskante zeigen. Ordne sie im Lernmodell den Begriffen zu.",
    checks: [
      "Die vorgesehene Bezugsfläche und Bezugskante sind verstanden.",
      "Eignung und Handhabung des Werkstücks sind betrieblich geklärt.",
      "Der erreichte Zustand wurde mit dem Ausbilder überprüft und eindeutig markiert.",
    ],
    machineId: "jointer",
    lessonId: "abrichten-dicke",
  },
  {
    id: "dickenhobeln",
    title: "Die geforderte Dicke erreichen",
    short: "Dickenhobeln",
    goal: "Du kannst Bezugsfläche, Dickenmaß und den gewünschten Endzustand zuordnen.",
    why: "Dickenhobeln und Abrichten erfüllen verschiedene Aufgaben. Die Bezugsfläche beeinflusst, welches Ergebnis der folgende Arbeitsgang erreichen kann.",
    task: "Vergleiche Rohdicke und Fertigdicke. Halte fest, welche Fläche als Bezug dient und welches Maß anschließend geprüft wird.",
    checks: [
      "Bezugsfläche und geforderte Fertigdicke sind eindeutig.",
      "Werkstück und Arbeitsgang sind für die vorhandene Maschine abgestimmt.",
      "Die erreichte Dicke ist an mehreren sinnvollen Stellen geprüft.",
    ],
    machineId: "thickness",
    lessonId: "messen-pruefen",
  },
  {
    id: "formatieren",
    title: "Die endgültigen Bauteilmaße klären",
    short: "Formatieren",
    goal: "Die Bauteile entsprechen den vorgesehenen Fertigmaßen und ihrer Zuordnung.",
    why: "Gleiche Teile brauchen gleiche Bezugspunkte. Form, Faserrichtung und spätere Verbindungen gehören schon beim endgültigen Zuschnitt zusammen.",
    task: "Vergleiche jedes Bauteil mit seiner Zeile in der Stückliste. Kläre die geeigneten Arbeitsmittel und die konkrete Reihenfolge mit deinem Ausbilder.",
    checks: [
      "Bauteile und jeweilige Fertigmaße sind eindeutig zugeordnet.",
      "Arbeitsmittel, Folge und Bezugspunkte sind abgestimmt.",
      "Anzahl, Maße und die für den Auftrag nötige Rechtwinkligkeit sind geprüft.",
    ],
    machineId: null,
    lessonId: "faserrichtung",
  },
  {
    id: "bohren",
    title: "Bohrungen und Verbindung verstehen",
    short: "Bohren & verbinden",
    goal: "Du weißt, wofür jedes Loch gebraucht wird und woran die Verbindung beurteilt wird.",
    why: "Eine Lochposition allein beschreibt noch keine vollständige Bohrung. Verbindung, Material, Durchmesser und Tiefe müssen zusammenpassen.",
    task: "Ordne jede Bohrung ihrem Zweck zu: Befestigung, Verbindung oder Durchführung. Kläre die fehlenden Angaben vor dem Arbeitsgang.",
    checks: [
      "Lochpositionen, Zweck, Durchmesser und Tiefe sind geklärt.",
      "Bohr- oder Schraubwerkzeug und Werkstücksicherung sind abgestimmt.",
      "Bohrungen und Verbindungen entsprechen dem vereinbarten Plan.",
    ],
    machineId: "drill",
    lessonId: "bohren-schrauben",
  },
  {
    id: "pruefen",
    title: "Ergebnis prüfen und Erfahrung behalten",
    short: "Prüfen & lernen",
    goal: "Du kannst zeigen, was fertig ist, und eine Erkenntnis für dein nächstes Projekt festhalten.",
    why: "Dein eigener Erfahrungsschatz wächst, wenn du eine konkrete Beobachtung mit ihrem Grund und einem nächsten Handgriff verbindest.",
    task: "Vergleiche Werkstück und Auftrag. Fotografiere das Ergebnis und halte einen Satz fest: „Beim nächsten Mal achte ich auf …“",
    checks: [
      "Anzahl, Maße, Oberfläche und Anordnung wurden mit dem Auftrag verglichen.",
      "Befestigung und vorgesehene Nutzung sind fachlich beurteilt.",
      "Offene Punkte und eine persönliche Erkenntnis sind dokumentiert.",
    ],
    machineId: null,
    lessonId: "hikmah-reflexion",
  },
];

export const MACHINES = [
  {
    id: "saw",
    name: "Kappsäge",
    short: "Längen verstehen",
    category: "Sägen",
    purpose:
      "Werkstücke quer zur Längsrichtung aufteilen; je nach Maschine auch Winkelzuschnitte herstellen.",
    principle:
      "Das Sägeaggregat bewegt sich zum aufgelegten Werkstück. Rohzuschnitt, Fertigzuschnitt und mögliche Werkstückgrößen müssen für den konkreten Auftrag geklärt sein.",
    questions: [
      "Ist die angegebene Länge ein Rohmaß oder ein Fertigmaß?",
      "Passt Form und Größe des Werkstücks zur vorhandenen Maschine?",
      "Woher kommen Bezug, Maß und Vorgaben für diesen Arbeitsgang?",
    ],
    hotspots: [
      {
        id: "table",
        label: "Auflagetisch",
        description:
          "Trägt das Werkstück und bildet einen räumlichen Bezug. Seine Auflage ist Teil der Beurteilung, ob ein Werkstück geeignet vorbereitet ist.",
        safety:
          "Auflage und Werkstücksicherung gehören zur konkreten Unterweisung; kleine oder unregelmäßige Teile brauchen eine abgestimmte Lösung.",
      },
      {
        id: "guard",
        label: "Sägeblattschutz",
        description:
          "Begrenzt den Zugang zum Sägeblatt. Ausführung und Bewegung unterscheiden sich zwischen Maschinen.",
        safety:
          "Schutzeinrichtungen müssen vorhanden und funktionsfähig sein. Unklare oder beschädigte Einrichtungen vor der Nutzung klären.",
      },
      {
        id: "stop",
        label: "Werkstückanschlag",
        description:
          "Gibt dem Werkstück einen Bezug. Der rückwärtige Anschlag und ein zusätzlicher Längenanschlag erfüllen unterschiedliche Aufgaben.",
        safety:
          "Die geeignete Anschlag- und Spannlösung richtet sich nach Maschine und Werkstück; nicht aus dem Lernmodell übernehmen.",
      },
    ],
    sourceLabel: "BGHM · Gehrungskappkreissäge",
    sourceUrl:
      "https://www.bghm.de/arbeitsschuetzer/praxishilfen/arbeitsschutz-kompakt/097-gehrungskappkreissaege",
  },
  {
    id: "jointer",
    name: "Abrichthobelmaschine",
    short: "Bezug schaffen",
    category: "Hobeln",
    purpose:
      "Eine ebene Bezugsfläche und eine geeignete Bezugskante für weitere Bearbeitung herstellen.",
    principle:
      "Abrichten schafft einen geometrischen Bezug. Das ist eine andere Aufgabe als das Herstellen einer bestimmten Dicke.",
    questions: [
      "Welche Fläche soll später als Bezug dienen?",
      "Welche Kante gehört zu dieser Bezugsfläche?",
      "Welche Werkstückgrößen und Hilfsmittel sind an unserer Maschine zulässig?",
    ],
    hotspots: [
      {
        id: "table",
        label: "Aufgabe- und Abnahmetisch",
        description:
          "Die beiden Tischbereiche liegen vor und hinter der Messerwelle. Ihre Zuordnung hilft, das Bearbeitungsprinzip räumlich zu verstehen.",
        safety:
          "Tischeinstellungen und die konkrete Handhabung werden an der vorhandenen Maschine unterwiesen.",
      },
      {
        id: "fence",
        label: "Abrichtanschlag",
        description:
          "Dient als Bezug beim Bearbeiten einer Kante. Der geforderte Winkel ergibt sich aus dem Auftrag.",
        safety:
          "Anschlagstellung, Befestigung und geeignete Werkstückführung gehören zur modellbezogenen Unterweisung.",
      },
      {
        id: "guard",
        label: "Schutzeinrichtung",
        description:
          "Begrenzt den Zugang zur Messerwelle. Es gibt unterschiedliche Bauformen und Bedienkonzepte.",
        safety:
          "Eine Darstellung erklärt die Funktion; die passende Verwendung muss am konkreten Maschinentyp gezeigt werden.",
      },
    ],
    sourceLabel: "BGHM · Arbeiten an Abrichthobelmaschinen",
    sourceUrl:
      "https://www.bghm.de/arbeitsschuetzer/praxishilfen/arbeitsschutz-kompakt/034-arbeiten-an-abrichthobelmaschinen/",
  },
  {
    id: "thickness",
    name: "Dickenhobelmaschine",
    short: "Dicke herstellen",
    category: "Hobeln",
    purpose:
      "Eine Fläche auf einen bestimmten Abstand zur geeigneten Bezugsfläche bearbeiten.",
    principle:
      "Die vorhandene Bezugsfläche liegt dem Dickenmaß zugrunde. Der Dickenhobel ersetzt daher nicht automatisch das Abrichten einer unebenen Ausgangsfläche.",
    questions: [
      "Welche Fläche ist der Bezug?",
      "Welche Fertigdicke ist im Plan gefordert?",
      "Welche Grenzen gelten für Werkstück und Bearbeitung an dieser Maschine?",
    ],
    hotspots: [
      {
        id: "table",
        label: "Dickentisch",
        description:
          "Trägt das Werkstück. Der Abstand zum Bearbeitungsbereich gehört zum Dickenmaß.",
        safety:
          "Zulässige Werkstückabmessungen und das passende Vorgehen sind aus der Maschine und ihrer Unterweisung zu entnehmen.",
      },
      {
        id: "height",
        label: "Höhenverstellung",
        description:
          "Verändert den für die Dicke maßgeblichen Abstand. Anzeige, Verstellrichtung und Bedienung sind modellabhängig.",
        safety:
          "Keine Einstellwerte aus diesem allgemeinen Modell ableiten; Zielmaß und konkreter Arbeitsgang müssen geklärt sein.",
      },
      {
        id: "feed",
        label: "Einzugs- und Vorschubbereich",
        description:
          "Der maschinelle Vorschub transportiert das Werkstück durch den Bearbeitungsbereich.",
        safety:
          "Einzugsstellen und der mögliche Rückschlagbereich sind Teil der Unterweisung. Eingriffe und Störungsbeseitigung brauchen das vorgeschriebene Vorgehen.",
      },
    ],
    sourceLabel: "BGHM · Arbeiten an Dickenhobelmaschinen",
    sourceUrl:
      "https://www.bghm.de/arbeitsschuetzer/praxishilfen/arbeitsschutz-kompakt/041-arbeiten-an-dickenhobelmaschinen/",
  },
  {
    id: "drill",
    name: "Akku-Bohrschrauber",
    short: "Loch oder Verbindung?",
    category: "Bohren",
    purpose:
      "Mit dem passenden Werkzeug Bohrungen herstellen oder Schraubverbindungen ausführen.",
    principle:
      "Bohren und Schrauben haben unterschiedliche Ziele. Werkzeugaufnahme, Betriebsart und benötigte Angaben müssen zum jeweiligen Arbeitsgang passen.",
    questions: [
      "Brauche ich eine Bohrung oder eine Schraubverbindung?",
      "Welche Angaben zu Durchmesser, Tiefe und Verbindung fehlen noch?",
      "Wie wird das Werkstück für diesen Arbeitsgang zuverlässig gehalten?",
    ],
    hotspots: [
      {
        id: "chuck",
        label: "Werkzeugaufnahme",
        description:
          "Nimmt den geeigneten Bohrer oder das Schraubwerkzeug auf. Aufnahmeart und zulässige Werkzeuge hängen vom Gerät ab.",
        safety:
          "Werkzeugwechsel und Prüfung erfolgen nach Herstellerangaben; unerwarteten Anlauf ausschließen.",
      },
      {
        id: "mode",
        label: "Betriebsart / Drehmoment",
        description:
          "Je nach Gerät gibt es Einstellungen für Bohren, Schrauben und Drehmomentbegrenzung. Die Symbole sind nicht bei jedem Gerät gleich.",
        safety:
          "Betriebsart und Einstellung anhand des konkreten Geräts, Materials und Arbeitsziels klären.",
      },
      {
        id: "trigger",
        label: "Schalter und Griff",
        description:
          "Hier wird das Gerät gehalten und der Antrieb gesteuert. Ein zweiter Schalter kann die Drehrichtung bestimmen.",
        safety:
          "Sicheres Halten, Werkstücksicherung und mögliche Reaktionskräfte werden für den jeweiligen Arbeitsgang besprochen.",
      },
    ],
    sourceLabel: "BGHM · Fachinformationen zu Maschinen",
    sourceUrl: "https://www.bghm.de/arbeitsschuetzer/themen/maschinen",
  },
];

export const LESSONS = [
  {
    id: "plan-lesen",
    title: "Ein Plan wird klarer, Bauteil für Bauteil",
    category: "Plan verstehen",
    summary: "Name → Anzahl → Maße → Verbindung → offene Frage.",
    explanation:
      "Beginne bei einem einzelnen Bauteil. Ordne Ansichten und Maßangaben demselben Teil zu. Ein fehlendes Maß ist eine offene Frage und keine Einladung zum Schätzen. Notiere auch, was ausdrücklich festgelegt ist und was du entscheiden sollst.",
    question: "Was machst du, wenn eine wichtige Angabe im Plan fehlt?",
    answer:
      "Die fehlende Angabe markieren und klären, bevor davon abhängige Arbeit festgelegt wird.",
    relatedMachine: null,
  },
  {
    id: "roh-fertig",
    title: "Rohmaß und Fertigmaß sind zwei verschiedene Ziele",
    category: "Material & Maße",
    summary: "Fertigmaß + begründete Zugabe = vorgesehenes Rohmaß.",
    explanation:
      "Das Fertigmaß beschreibt das gewünschte Bauteil. Das Rohmaß enthält zusätzliches Material für die geplante Bearbeitung. Die nötige Zugabe hängt unter anderem von Ausgangsmaterial und Arbeitsfolge ab. Im Rechner gilt jede Zugabe für das ganze Maß: + 20 mm Länge bedeutet insgesamt 20 mm mehr, nicht an jedem Ende 20 mm.",
    question: "Ist eine Hobelzugabe für jedes Holz und jede Situation gleich?",
    answer:
      "Nein. Zugaben werden für Materialzustand, Werkstück und geplante Bearbeitung festgelegt.",
    relatedMachine: "thickness",
  },
  {
    id: "stueckliste-lesen",
    title: "Eine Zeile muss ein Bauteil eindeutig beschreiben",
    category: "Material & Maße",
    summary: "Bezeichnung, Anzahl, Material und Länge × Breite × Dicke.",
    explanation:
      "Lege eine eindeutige Maßreihenfolge und Einheit fest. Die Bezeichnung soll sich im Plan wiederfinden lassen. Faserrichtung, Kanten, Verbindungen oder sichtbare Flächen können zusätzliche Angaben brauchen. Gleiche Maße allein bedeuten nicht immer gleiche Teile.",
    question: "Warum gehören Einheit und Maßreihenfolge zur Stückliste?",
    answer:
      "Damit dieselben Zahlen nicht unterschiedlich als Länge, Breite, Dicke oder andere Einheiten verstanden werden.",
    relatedMachine: null,
  },
  {
    id: "faserrichtung",
    title: "Holz hat eine Richtung",
    category: "Holz verstehen",
    summary: "Faserrichtung beeinflusst Optik, Bearbeitung und Eigenschaften.",
    explanation:
      "Holz verhält sich längs und quer zur Faser unterschiedlich. Darum ist die Faserrichtung Teil der Material- und Bauteilplanung. Ein geometrisch passendes Reststück ist nicht automatisch für jedes Bauteil geeignet. Holzart und Zustand lassen sich aus einem einzelnen Foto oft nicht sicher bestimmen.",
    question: "Reicht es, wenn ein Reststück nur die Außenmaße erfüllt?",
    answer:
      "Nein. Auch Faserrichtung, Zustand, Materialeigenschaften und geplanter Einsatz müssen passen.",
    relatedMachine: null,
  },
  {
    id: "abrichten-dicke",
    title: "Erst den Bezug verstehen, dann die Dicke",
    category: "Maschinen verstehen",
    summary: "Abrichten schafft einen Bezug; Dickenhobeln bezieht sich darauf.",
    explanation:
      "Beim Abrichten geht es um eine ebene Bezugsfläche beziehungsweise eine geeignete Bezugskante. Beim Dickenhobeln geht es um den Abstand einer Fläche zur vorhandenen Bezugsfläche. Das erklärt den Unterschied der Maschinen, legt aber noch keinen konkreten Arbeitsgang für ein Werkstück fest.",
    question:
      "Stellt die Abrichthobelmaschine automatisch eine festgelegte Bauteildicke her?",
    answer:
      "Nein. Ihr Hauptzweck ist der geometrische Bezug; ein festgelegtes Dickenmaß ist eine andere Aufgabe.",
    relatedMachine: "jointer",
  },
  {
    id: "bezug-anschlag",
    title: "Ein Maß braucht einen eindeutigen Bezug",
    category: "Maschinen verstehen",
    summary: "Von welcher Fläche, Kante oder Markierung wird gemessen?",
    explanation:
      "Zwei Personen können unterschiedliche Ergebnisse erhalten, wenn sie von unterschiedlichen Kanten ausgehen. Ein Bezug verbindet Zeichnung, Messung und Bearbeitung. Anschläge können einen Bezug herstellen; ihre konkrete Funktion hängt von Maschine und Arbeitsgang ab.",
    question: "Welche Zusatzfrage gehört zu „Das Loch ist 30 mm vom Rand“?",
    answer:
      "Von welchem Rand, in welcher Richtung und bis zu welchem Punkt der Bohrung wird gemessen?",
    relatedMachine: "saw",
  },
  {
    id: "messen-pruefen",
    title: "Messen beantwortet eine konkrete Frage",
    category: "Genauigkeit",
    summary:
      "Sollmaß, Messstelle und geeignetes Messmittel zusammen festlegen.",
    explanation:
      "Ein einzelner Messwert beschreibt nicht automatisch das ganze Werkstück. Überlege, welche Eigenschaft du beurteilst: Länge, Dicke, Ebenheit oder Rechtwinkligkeit. Nutze ein geeignetes Messmittel und vergleiche das Ergebnis mit den Vorgaben des Auftrags. Eine Einstellung ist noch kein geprüftes Ergebnis.",
    question:
      "Beweist die Anzeige an einer Maschine schon das Fertigmaß des Werkstücks?",
    answer:
      "Nein. Das tatsächlich bearbeitete Werkstück muss mit einem passenden Messmittel beurteilt werden.",
    relatedMachine: "thickness",
  },
  {
    id: "einstellen-kalibrieren",
    title: "Einstellen, prüfen und kalibrieren unterscheiden",
    category: "Genauigkeit",
    summary: "Arbeitsziel einstellen; Ergebnis prüfen; Messbezug untersuchen.",
    explanation:
      "Einstellen bereitet ein Arbeitsmittel auf eine konkrete Aufgabe vor. Prüfen vergleicht das Ergebnis mit einer Vorgabe. Kalibrieren ermittelt unter festgelegten Bedingungen die Beziehung zu einer Referenz; es bedeutet nicht automatisch, die Maschine nachzustellen. Die Begriffe helfen, die richtige Frage an den Ausbilder zu stellen.",
    question:
      "Du möchtest eine bestimmte Dicke erreichen: Welche Frage hilft zuerst?",
    answer:
      "Welches Zielmaß, welcher Bezug und welche modellbezogenen Vorgaben gelten für diesen Arbeitsgang?",
    relatedMachine: "thickness",
  },
  {
    id: "bohren-schrauben",
    title: "Eine Bohrung braucht mehr als eine Position",
    category: "Verbindungen",
    summary: "Zweck, Durchmesser, Tiefe und Material gehören zusammen.",
    explanation:
      "Eine Durchführung, eine Vorbohrung und ein Sackloch erfüllen verschiedene Aufgaben. Die passende Verbindung bestimmt, welche Angaben erforderlich sind. Beim Schrauben sind Schraubwerkzeug und Verbindung entscheidend; beim Bohren die benötigte Bohrung und das passende Bohrwerkzeug.",
    question: "Was fehlt bei „Hier ein Loch bohren“?",
    answer:
      "Mindestens der Zweck sowie die geklärten Angaben zu Position, Durchmesser, Tiefe und Werkstück.",
    relatedMachine: "drill",
  },
  {
    id: "material-wirtschaftlich",
    title: "Günstig ist, was geeignet und nutzbar ist",
    category: "Material & Maße",
    summary: "Vergleiche das ganze Brett, nutzbare Maße und Verschnitt.",
    explanation:
      "Ein niedriger Stückpreis ist nicht mit einem niedrigen Preis für den gesamten Materialbedarf gleichzusetzen. Schäden, zu kleine Maße und ungeeignete Eigenschaften können ein günstiges Brett unbrauchbar machen. Der Materialvergleich hier prüft nur einen einfachen Längsstreifen mit angenommener 3-mm-Schnittfuge; er optimiert keine Zuschnitte und erkennt keine Holzart.",
    question: "Warum kann ein teureres Brett wirtschaftlicher sein?",
    answer:
      "Weil daraus mehr geeignete Teile entstehen können und weniger zusätzliches Material oder Nacharbeit nötig ist.",
    relatedMachine: null,
  },
  {
    id: "unterbrechung",
    title: "Ein guter Wiedereinstieg beginnt vor der Pause",
    category: "Fokus",
    summary: "Stand → offene Frage → nächster kleiner Handgriff.",
    explanation:
      "Halte vor einer Unterbrechung fest, was tatsächlich erledigt ist. Schreibe den nächsten konkreten Handgriff auf und sichere eine offene Frage. „Am Regal weiterarbeiten“ ist ungenau; „Maße des Trägerbretts mit dem Plan vergleichen“ ist wieder auffindbar. Die App speichert dazu den Projektkontext.",
    question: "Welcher Satz hilft nach einer Unterbrechung mehr?",
    answer:
      "Ein konkreter nächster Handgriff mit dem betroffenen Bauteil, zum Beispiel „Die Fertigdicke des Trägerbretts im Plan nachsehen“.",
    relatedMachine: null,
  },
  {
    id: "hikmah-reflexion",
    title: "Aus einer Beobachtung wird dein Erfahrungswissen",
    category: "Hikmah",
    summary: "Was ist passiert? Warum? Was mache ich nächstes Mal?",
    explanation:
      "Dein Wissensbuch darf kurze, unfertige Einträge enthalten. Verbinde eine Beobachtung mit ihrer Ursache, soweit du sie kennst, und einem konkreten nächsten Verhalten. Fragen bleiben Fragen, bis sie beantwortet sind. Fotos und die Zuordnung zum Projekt helfen, die Situation später wiederzuerkennen.",
    question: "Wie wird aus „Das war schwierig“ eine hilfreiche Merkhilfe?",
    answer:
      "Indem du die konkrete Situation, die offene Ursache und einen nächsten Prüf- oder Lernschritt festhältst.",
    relatedMachine: null,
  },
];

export const KNOWLEDGE_SOURCE = {
  label: "Grundwissen · an der konkreten Maschine mit Unterweisung abgleichen",
  url: holzSource,
};

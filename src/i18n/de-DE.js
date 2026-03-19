// German (Germany) language pack
export default {
    common: {
        loading: 'Wird geladen...',
        error: 'Fehler',
        success: 'Erfolg',
        cancel: 'Abbrechen',
        confirm: 'Bestätigen',
        save: 'Speichern',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        search: 'Suchen',
        filter: 'Filtern',
        sort: 'Sortieren',
        more: 'Mehr',
        less: 'Weniger'
    },

    popup: {
        title: 'AnyTable',
        controlCenter: 'Tabellen-Kontrollzentrum',
        subtitle: 'Tabellenverbesserung für die aktuelle Seite schnell auswählen, zurücksetzen und konfigurieren.',
        pickTable: 'Tabelle auswählen',
        clearSelection: 'Auswahl löschen',
        footerHint: 'Änderungen werden sofort gespeichert und auf die Tabellenverbesserung der aktuellen Seite angewendet.',
        language: {
            label: 'Oberflächensprache'
        },
        state: {
            enabled: 'An',
            disabled: 'Aus',
            expanded: 'Offen',
            collapsed: 'Geschlossen'
        },
        page: {
            eyebrow: 'Aktuelle Seite',
            title: 'Seitenstatus',
            ready: 'Verbunden',
            unsupported: 'Nicht unterstützt',
            unavailable: 'Nicht verfügbar',
            enhancedCount: '{count} Tabellen verbessert',
            unsupportedDescription: 'Diese Seite erlaubt keine Erweiterungsskripte.',
            unavailableDescription: 'Verbindung zur aktuellen Seite nicht möglich. Neu laden und erneut versuchen.',
            modeAutoOn: 'Auto-Verbesserung an',
            modeAutoOff: 'Auto-Verbesserung aus',
            hostFallback: 'Aktueller Tab',
            titleFallback: 'Unbenannte Seite',
            localFile: 'Lokale Datei'
        },
        actions: {
            eyebrow: 'Schnellaktionen',
            title: 'Seitenaktionen',
            description: 'Wähle die Tabelle aus, die du verbessern möchtest, und passe das Verhalten an deinen Workflow an.',
            pickDescription: 'Kehre zur Seite zurück und klicke auf die Zieltabelle.',
            clearDescription: 'Löscht die aktuell auf dieser Seite ausgewählte Tabelle.'
        },
        settings: {
            eyebrow: 'Einstellungen',
            title: 'Verhaltenseinstellungen',
            description: 'Diese Einstellungen werden sofort gespeichert und mit dem aktuellen Tab synchronisiert.'
        },
        status: {
            picking: 'Klicke auf eine Tabelle, um sie zu verbessern...',
            success: 'Auswahl gelöscht',
            error: 'Vorgang fehlgeschlagen, bitte neu laden und erneut versuchen'
        },
        autoEnhance: {
            label: 'Alle Tabellen automatisch verbessern',
            description: 'Alle erkannten Datentabellen automatisch verbessern.',
            enabled: 'Auto-Verbesserung für alle Tabellen aktiviert',
            disabled: 'Auto-Verbesserung für alle Tabellen deaktiviert'
        },
        multiColumnSort: {
            label: 'Mehrspaltige Sortierung aktivieren',
            description: 'Nach Priorität entsprechend der Klickreihenfolge sortieren.',
            enabled: 'Mehrspaltige Sortierung aktiviert',
            disabled: 'Mehrspaltige Sortierung deaktiviert'
        },
        toolbarDefaultExpanded: {
            label: 'Symbolleiste standardmäßig erweitert',
            description: 'Das Werkzeugset oben rechts an der Tabelle automatisch erweitern.',
            expanded: 'Symbolleiste standardmäßig erweitert',
            collapsed: 'Symbolleiste standardmäßig eingeklappt'
        }
    },

    columnControl: {
        filter: {
            placeholder: 'Filterkriterien eingeben...',
            showPanel: 'Filterfeld anzeigen',
            hidePanel: 'Filterfeld ausblenden',
            locked: 'Erweiterter Filter ist aktiviert',
            advanced: 'Erweiterter Filter'
        },
        sort: {
            ascending: 'Aufsteigend',
            descending: 'Absteigend',
            none: 'Keine Sortierung',
            advanced: 'Erweiterte Sortierung'
        },
        statistics: 'Statistik',
        exportCsv: 'CSV exportieren',
        toolbar: {
            expand: 'Symbolleiste erweitern',
            collapse: 'Symbolleiste einklappen'
        }
    },

    advancedPanel: {
        common: {
            columnFallback: 'Spalte {index}',
            duplicateColumnFormat: '{label} (Spalte {index})',
            close: 'Schließen',
            reset: 'Zurücksetzen',
            cancel: 'Abbrechen',
            apply: 'Anwenden',
            delete: 'Löschen'
        },
        filter: {
            title: 'Erweiterter Filter',
            operator: {
                and: 'UND',
                or: 'ODER'
            },
            operatorTooltip: {
                and: 'Alle Bedingungen erfüllen',
                or: 'Beliebige Bedingung erfüllen'
            },
            addRule: '+ Bedingung hinzufügen',
            negateTooltip: 'Diese Bedingung negieren',
            valuePlaceholder: 'Wert',
            minPlaceholder: 'Mindestwert',
            maxPlaceholder: 'Höchstwert',
            flagsPlaceholder: 'Flags',
            comparator: {
                contains: 'Enthält',
                startsWith: 'Beginnt mit',
                endsWith: 'Endet mit',
                equals: 'Gleich',
                regex: 'Regex',
                gt: 'Größer als',
                gte: 'Größer oder gleich',
                lt: 'Kleiner als',
                lte: 'Kleiner oder gleich',
                between: 'Zwischen',
                isEmpty: 'Ist leer',
                isNotEmpty: 'Ist nicht leer'
            },
            addGroup: '+ Gruppe hinzufügen',
            groupLabel: 'Gruppe',
            groupNegateTooltip: 'Diese Gruppe negieren (NOT)',
            hint: {
                keepOneRule: 'Mindestens eine Filterbedingung ist erforderlich.',
                keepOneInGroup: 'In einer Gruppe ist mindestens eine Bedingung erforderlich.',
                maxDepth: 'Maximale Schachtelungstiefe: {max} Ebenen.',
                resetDone: 'Erweiterter Filter wurde zurückgesetzt.',
                needOneRule: 'Bitte füge mindestens eine Filterbedingung hinzu.'
            },
            errors: {
                betweenInvalid: 'Der Zwischen-Vergleich benötigt gültige Mindest- und Höchstwerte',
                betweenOrder: 'Der Mindestwert darf nicht größer als der Höchstwert sein',
                regexRequired: 'Der Regex-Vergleich benötigt ein Muster',
                regexInvalid: 'Ungültige Regex: {message}',
                numericRequired: 'Numerische Vergleiche benötigen eine gültige Zahl'
            }
        },
        sort: {
            title: 'Erweiterte Sortierung',
            addRule: '+ Sortierregel hinzufügen',
            direction: {
                asc: 'Aufsteigend',
                desc: 'Absteigend'
            },
            type: {
                auto: 'Automatisch erkennen',
                number: 'Zahl',
                text: 'Text',
                date: 'Datum',
                percent: 'Prozent',
                duration: 'Dauer',
                mass: 'Masse',
                length: 'Länge',
                area: 'Fläche',
                volume: 'Volumen',
                speed: 'Geschwindigkeit',
                temperature: 'Temperatur',
                pressure: 'Druck',
                energy: 'Energie',
                power: 'Leistung',
                voltage: 'Spannung',
                current: 'Strom',
                resistance: 'Widerstand',
                frequency: 'Frequenz',
                dataSize: 'Datengröße',
                bitrate: 'Bitrate'
            },
            typeButton: {
                autoFormat: 'Auto: {type}'
            },
            typePopup: {
                searchPlaceholder: 'Typ suchen...'
            },
            hint: {
                keepOneRule: 'Mindestens eine Sortierregel ist erforderlich.',
                resetDone: 'Erweiterte Sortierung wurde zurückgesetzt.',
                needOneRule: 'Bitte füge mindestens eine Sortierregel hinzu.',
                multiColumnAuto: 'Mehrspaltige Sortierung wird beim Anwenden aktiviert.',
                allColumnsUsed: 'Alle Spalten haben bereits Sortierregeln.'
            },
            errors: {
                invalidColumn: 'Ungültige Spaltenauswahl'
            }
        },
        statistics: {
            title: 'Statistiken',
            addRule: '+ Statistikregel hinzufügen',
            type: {
                count: 'Anzahl',
                sum: 'Summe',
                average: 'Durchschnitt',
                median: 'Median',
                min: 'Minimum',
                max: 'Maximum',
                range: 'Spannweite',
                variance: 'Varianz',
                stddev: 'Standardabw.'
            },
            hint: {
                keepOneRule: 'Mindestens eine Statistikregel ist erforderlich.',
                resetDone: 'Statistikkonfiguration wurde zurückgesetzt.',
                needOneRule: 'Bitte füge mindestens eine Statistikregel hinzu.',
                duplicateRule: 'Eine Regel mit derselben Spalte und demselben Typ existiert bereits.'
            }
        }
    },

    errors: {
        failedToLoad: 'Laden fehlgeschlagen',
        failedToSave: 'Speichern fehlgeschlagen',
        networkError: 'Netzwerkfehler',
        unknownError: 'Unbekannter Fehler'
    }
};

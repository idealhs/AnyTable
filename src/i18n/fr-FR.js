// French (France) language pack
export default {
    common: {
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',
        cancel: 'Annuler',
        confirm: 'Confirmer',
        save: 'Enregistrer',
        delete: 'Supprimer',
        edit: 'Modifier',
        search: 'Rechercher',
        filter: 'Filtrer',
        sort: 'Trier',
        more: 'Plus',
        less: 'Moins'
    },

    popup: {
        title: 'AnyTable',
        controlCenter: 'Centre de contrôle des tableaux',
        subtitle: 'Sélectionnez, effacez et configurez rapidement l\'amélioration des tableaux pour la page actuelle.',
        pickTable: 'Sélectionner un tableau',
        clearSelection: 'Effacer la sélection',
        footerHint: 'Les changements sont enregistrés immédiatement et appliqués à l\'amélioration des tableaux sur la page actuelle.',
        language: {
            label: 'Langue de l\'interface'
        },
        state: {
            enabled: 'Activé',
            disabled: 'Désactivé',
            expanded: 'Ouvert',
            collapsed: 'Fermé'
        },
        page: {
            eyebrow: 'Page actuelle',
            title: 'État de la page',
            ready: 'Connecté',
            unsupported: 'Non pris en charge',
            unavailable: 'Indisponible',
            enhancedCount: '{count} tableaux améliorés',
            unsupportedDescription: 'Cette page n\'autorise pas les scripts d\'extension.',
            unavailableDescription: 'Impossible de se connecter à la page actuelle. Actualisez puis réessayez.',
            modeAutoOn: 'Amélioration auto activée',
            modeAutoOff: 'Amélioration auto désactivée',
            hostFallback: 'Onglet actuel',
            titleFallback: 'Page sans titre',
            localFile: 'Fichier local'
        },
        actions: {
            eyebrow: 'Actions rapides',
            title: 'Actions de la page',
            description: 'Sélectionnez le tableau à améliorer puis adaptez son comportement à votre usage.',
            pickDescription: 'Retournez sur la page et cliquez sur le tableau ciblé.',
            clearDescription: 'Efface le tableau actuellement sélectionné sur cette page.'
        },
        settings: {
            eyebrow: 'Préférences',
            title: 'Paramètres de comportement',
            description: 'Ces préférences sont enregistrées immédiatement et synchronisées avec l\'onglet actuel.'
        },
        status: {
            picking: 'Cliquez sur un tableau à améliorer...',
            success: 'Sélection effacée',
            error: 'L\'opération a échoué, actualisez puis réessayez'
        },
        autoEnhance: {
            label: 'Améliorer automatiquement tous les tableaux',
            description: 'Améliore automatiquement tous les tableaux de données détectés.',
            enabled: 'L\'amélioration automatique est activée pour tous les tableaux',
            disabled: 'L\'amélioration automatique est désactivée pour tous les tableaux'
        },
        multiColumnSort: {
            label: 'Activer le tri multicolonnes',
            description: 'Trie par priorité selon l\'ordre des clics.',
            enabled: 'Le tri multicolonnes est activé',
            disabled: 'Le tri multicolonnes est désactivé'
        },
        toolbarDefaultExpanded: {
            label: 'Barre d\'outils développée par défaut',
            description: 'Déplie automatiquement l\'ensemble d\'outils en haut à droite du tableau.',
            expanded: 'La barre d\'outils est développée par défaut',
            collapsed: 'La barre d\'outils est repliée par défaut'
        }
    },

    columnControl: {
        filter: {
            placeholder: 'Saisissez des critères de filtre...',
            showPanel: 'Afficher le champ de filtre',
            hidePanel: 'Masquer le champ de filtre',
            locked: 'Le filtre avancé est activé',
            advanced: 'Filtre avancé'
        },
        sort: {
            ascending: 'Croissant',
            descending: 'Décroissant',
            none: 'Pas de tri',
            advanced: 'Tri avancé'
        },
        statistics: 'Statistiques',
        exportCsv: 'Exporter CSV',
        toolbar: {
            expand: 'Développer la barre d\'outils',
            collapse: 'Réduire la barre d\'outils'
        }
    },

    advancedPanel: {
        common: {
            columnFallback: 'Colonne {index}',
            duplicateColumnFormat: '{label} (Colonne {index})',
            close: 'Fermer',
            reset: 'Réinitialiser',
            cancel: 'Annuler',
            apply: 'Appliquer',
            delete: 'Supprimer'
        },
        filter: {
            title: 'Filtre avancé',
            operator: {
                and: 'ET',
                or: 'OU'
            },
            operatorTooltip: {
                and: 'Respecter toutes les conditions',
                or: 'Respecter au moins une condition'
            },
            addRule: '+ Ajouter une condition',
            negateTooltip: 'Inverser cette condition',
            valuePlaceholder: 'Valeur',
            minPlaceholder: 'Valeur min',
            maxPlaceholder: 'Valeur max',
            flagsPlaceholder: 'Options',
            comparator: {
                contains: 'Contient',
                startsWith: 'Commence par',
                endsWith: 'Se termine par',
                equals: 'Égal à',
                regex: 'Regex',
                gt: 'Supérieur à',
                gte: 'Supérieur ou égal',
                lt: 'Inférieur à',
                lte: 'Inférieur ou égal',
                between: 'Entre',
                isEmpty: 'Est vide',
                isNotEmpty: 'N\'est pas vide'
            },
            addGroup: '+ Ajouter un groupe',
            groupLabel: 'Groupe',
            groupNegateTooltip: 'Inverser ce groupe (NOT)',
            hint: {
                keepOneRule: 'Au moins une condition de filtre est requise.',
                keepOneInGroup: 'Au moins une condition est requise dans un groupe.',
                maxDepth: 'La profondeur d\'imbrication maximale est de {max} niveaux.',
                resetDone: 'Le filtre avancé a été réinitialisé.',
                needOneRule: 'Ajoutez au moins une condition de filtre.'
            },
            errors: {
                betweenInvalid: 'Le comparateur Entre nécessite des valeurs min et max valides',
                betweenOrder: 'La valeur min ne peut pas être supérieure à la valeur max',
                regexRequired: 'Le comparateur Regex nécessite un motif',
                regexInvalid: 'Regex invalide : {message}',
                numericRequired: 'Les comparateurs numériques nécessitent un nombre valide'
            }
        },
        sort: {
            title: 'Tri avancé',
            addRule: '+ Ajouter une règle de tri',
            direction: {
                asc: 'Croissant',
                desc: 'Décroissant'
            },
            type: {
                auto: 'Détection auto',
                number: 'Nombre',
                text: 'Texte',
                date: 'Date',
                percent: 'Pourcentage',
                duration: 'Durée',
                mass: 'Masse',
                length: 'Longueur',
                area: 'Surface',
                volume: 'Volume',
                speed: 'Vitesse',
                temperature: 'Température',
                pressure: 'Pression',
                energy: 'Énergie',
                power: 'Puissance',
                voltage: 'Tension',
                current: 'Courant',
                resistance: 'Résistance',
                frequency: 'Fréquence',
                dataSize: 'Taille des données',
                bitrate: 'Débit'
            },
            typeButton: {
                autoFormat: 'Auto : {type}'
            },
            typePopup: {
                searchPlaceholder: 'Rechercher un type...'
            },
            hint: {
                keepOneRule: 'Au moins une règle de tri est requise.',
                resetDone: 'Le tri avancé a été réinitialisé.',
                needOneRule: 'Ajoutez au moins une règle de tri.',
                multiColumnAuto: 'Le tri multicolonnes sera activé à l\'application.',
                allColumnsUsed: 'Toutes les colonnes ont déjà des règles de tri.'
            },
            errors: {
                invalidColumn: 'Sélection de colonne invalide'
            }
        },
        statistics: {
            title: 'Statistiques',
            addRule: '+ Ajouter une règle statistique',
            type: {
                count: 'Nombre',
                sum: 'Somme',
                average: 'Moyenne',
                median: 'Médiane',
                min: 'Minimum',
                max: 'Maximum',
                range: 'Étendue',
                variance: 'Variance',
                stddev: 'Écart type'
            },
            hint: {
                keepOneRule: 'Au moins une règle statistique est requise.',
                resetDone: 'La configuration des statistiques a été réinitialisée.',
                needOneRule: 'Ajoutez au moins une règle statistique.',
                duplicateRule: 'Une règle avec la même colonne et le même type existe déjà.'
            }
        }
    },

    errors: {
        failedToLoad: 'Échec du chargement',
        failedToSave: 'Échec de l\'enregistrement',
        networkError: 'Erreur réseau',
        unknownError: 'Erreur inconnue'
    }
};

// Spanish (Spain) language pack
export default {
    common: {
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        search: 'Buscar',
        filter: 'Filtrar',
        sort: 'Ordenar',
        more: 'Más',
        less: 'Menos'
    },

    popup: {
        title: 'AnyTable',
        controlCenter: 'Centro de control de tablas',
        subtitle: 'Selecciona, limpia y configura rápidamente la mejora de tablas para la página actual.',
        pickTable: 'Seleccionar tabla',
        clearSelection: 'Limpiar selección',
        footerHint: 'Los cambios se guardan al instante y se aplican a la mejora de tablas de la página actual.',
        language: {
            label: 'Idioma de la interfaz'
        },
        state: {
            enabled: 'Activado',
            disabled: 'Desactivado',
            expanded: 'Abierto',
            collapsed: 'Cerrado'
        },
        page: {
            eyebrow: 'Página actual',
            title: 'Estado de la página',
            ready: 'Conectado',
            unsupported: 'No compatible',
            unavailable: 'No disponible',
            enhancedCount: '{count} tablas mejoradas',
            unsupportedDescription: 'Esta página no permite scripts de extensiones.',
            unavailableDescription: 'No se puede conectar con la página actual. Recarga e inténtalo de nuevo.',
            modeAutoOn: 'Auto-mejora activada',
            modeAutoOff: 'Auto-mejora desactivada',
            hostFallback: 'Pestaña actual',
            titleFallback: 'Página sin título',
            localFile: 'Archivo local'
        },
        actions: {
            eyebrow: 'Acciones rápidas',
            title: 'Acciones de la página',
            description: 'Selecciona la tabla que quieras mejorar y ajusta su comportamiento a tu flujo de trabajo.',
            pickDescription: 'Vuelve a la página y haz clic en la tabla objetivo.',
            clearDescription: 'Limpia la tabla seleccionada actualmente en esta página.'
        },
        settings: {
            eyebrow: 'Preferencias',
            title: 'Configuración de comportamiento',
            description: 'Estas preferencias se guardan de inmediato y se sincronizan con la pestaña actual.'
        },
        status: {
            picking: 'Haz clic en una tabla para mejorarla...',
            success: 'Selección borrada',
            error: 'La operación ha fallado; recarga e inténtalo de nuevo'
        },
        autoEnhance: {
            label: 'Mejorar automáticamente todas las tablas',
            description: 'Mejora automáticamente todas las tablas de datos detectadas.',
            enabled: 'Auto-mejora activada para todas las tablas',
            disabled: 'Auto-mejora desactivada para todas las tablas'
        },
        multiColumnSort: {
            label: 'Activar ordenación por varias columnas',
            description: 'Ordena por prioridad según el orden de clic.',
            enabled: 'Ordenación por varias columnas activada',
            disabled: 'Ordenación por varias columnas desactivada'
        },
        toolbarDefaultExpanded: {
            label: 'Barra de herramientas expandida por defecto',
            description: 'Expande automáticamente el conjunto de herramientas en la esquina superior derecha de la tabla.',
            expanded: 'La barra se mostrará expandida por defecto',
            collapsed: 'La barra se mostrará contraída por defecto'
        }
    },

    columnControl: {
        filter: {
            placeholder: 'Introduce criterios de filtro...',
            showPanel: 'Mostrar campo de filtro',
            hidePanel: 'Ocultar campo de filtro',
            locked: 'El filtro avanzado está activado',
            advanced: 'Filtro avanzado'
        },
        sort: {
            ascending: 'Ascendente',
            descending: 'Descendente',
            none: 'Sin ordenar',
            advanced: 'Ordenación avanzada'
        },
        statistics: 'Estadísticas',
        exportCsv: 'Exportar CSV',
        toolbar: {
            expand: 'Expandir barra de herramientas',
            collapse: 'Contraer barra de herramientas'
        }
    },

    advancedPanel: {
        common: {
            columnFallback: 'Columna {index}',
            duplicateColumnFormat: '{label} (Columna {index})',
            close: 'Cerrar',
            reset: 'Restablecer',
            cancel: 'Cancelar',
            apply: 'Aplicar',
            delete: 'Eliminar'
        },
        filter: {
            title: 'Filtro avanzado',
            operator: {
                and: 'Y',
                or: 'O'
            },
            operatorTooltip: {
                and: 'Cumplir todas las condiciones',
                or: 'Cumplir cualquier condición'
            },
            addRule: '+ Añadir condición',
            negateTooltip: 'Negar esta condición',
            valuePlaceholder: 'Valor',
            minPlaceholder: 'Valor mínimo',
            maxPlaceholder: 'Valor máximo',
            flagsPlaceholder: 'Indicadores',
            comparator: {
                contains: 'Contiene',
                startsWith: 'Empieza por',
                endsWith: 'Termina en',
                equals: 'Igual a',
                regex: 'Regex',
                gt: 'Mayor que',
                gte: 'Mayor o igual que',
                lt: 'Menor que',
                lte: 'Menor o igual que',
                between: 'Entre',
                isEmpty: 'Está vacío',
                isNotEmpty: 'No está vacío'
            },
            addGroup: '+ Añadir grupo',
            groupLabel: 'Grupo',
            groupNegateTooltip: 'Negar este grupo (NOT)',
            hint: {
                keepOneRule: 'Se requiere al menos una condición de filtro.',
                keepOneInGroup: 'Se requiere al menos una condición en el grupo.',
                maxDepth: 'La profundidad máxima de anidación es de {max} niveles.',
                resetDone: 'Se ha restablecido el filtro avanzado.',
                needOneRule: 'Añade al menos una condición de filtro.'
            },
            errors: {
                betweenInvalid: 'El comparador Entre requiere valores mínimo y máximo válidos',
                betweenOrder: 'El valor mínimo no puede ser mayor que el máximo',
                regexRequired: 'El comparador Regex requiere un patrón',
                regexInvalid: 'Regex no válida: {message}',
                numericRequired: 'Los comparadores numéricos requieren un número válido'
            }
        },
        sort: {
            title: 'Ordenación avanzada',
            addRule: '+ Añadir regla de ordenación',
            direction: {
                asc: 'Ascendente',
                desc: 'Descendente'
            },
            type: {
                auto: 'Detección automática',
                number: 'Número',
                text: 'Texto',
                date: 'Fecha',
                percent: 'Porcentaje',
                duration: 'Duración',
                mass: 'Masa',
                length: 'Longitud',
                area: 'Área',
                volume: 'Volumen',
                speed: 'Velocidad',
                temperature: 'Temperatura',
                pressure: 'Presión',
                energy: 'Energía',
                power: 'Potencia',
                voltage: 'Voltaje',
                current: 'Corriente',
                resistance: 'Resistencia',
                frequency: 'Frecuencia',
                dataSize: 'Tamaño de datos',
                bitrate: 'Tasa de bits'
            },
            typeButton: {
                autoFormat: 'Automático: {type}'
            },
            typePopup: {
                searchPlaceholder: 'Buscar tipo...'
            },
            hint: {
                keepOneRule: 'Se requiere al menos una regla de ordenación.',
                resetDone: 'Se ha restablecido la ordenación avanzada.',
                needOneRule: 'Añade al menos una regla de ordenación.',
                multiColumnAuto: 'La ordenación por varias columnas se activará al aplicar.',
                allColumnsUsed: 'Todas las columnas ya tienen reglas de ordenación.'
            },
            errors: {
                invalidColumn: 'Selección de columna no válida'
            }
        },
        statistics: {
            title: 'Estadísticas',
            addRule: '+ Añadir regla estadística',
            type: {
                count: 'Conteo',
                sum: 'Suma',
                average: 'Media',
                median: 'Mediana',
                min: 'Mínimo',
                max: 'Máximo',
                range: 'Rango',
                variance: 'Varianza',
                stddev: 'Desv. típ.'
            },
            hint: {
                keepOneRule: 'Se requiere al menos una regla estadística.',
                resetDone: 'Se ha restablecido la configuración de estadísticas.',
                needOneRule: 'Añade al menos una regla estadística.',
                duplicateRule: 'Ya existe una regla con la misma columna y tipo.'
            }
        }
    },

    errors: {
        failedToLoad: 'Error al cargar',
        failedToSave: 'Error al guardar',
        networkError: 'Error de red',
        unknownError: 'Error desconocido'
    }
};

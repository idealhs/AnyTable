// Portuguese (Portugal) language pack
export default {
    common: {
        loading: 'A carregar...',
        error: 'Erro',
        success: 'Sucesso',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        search: 'Pesquisar',
        filter: 'Filtrar',
        sort: 'Ordenar',
        more: 'Mais',
        less: 'Menos'
    },

    popup: {
        title: 'AnyTable',
        controlCenter: 'Centro de controlo de tabelas',
        subtitle: 'Selecione, limpe e configure rapidamente a melhoria de tabelas para a página atual.',
        pickTable: 'Selecionar tabela',
        clearSelection: 'Limpar seleção',
        footerHint: 'As alterações são guardadas de imediato e aplicadas à melhoria de tabelas na página atual.',
        language: {
            label: 'Idioma da interface'
        },
        state: {
            enabled: 'Ligado',
            disabled: 'Desligado',
            expanded: 'Aberto',
            collapsed: 'Fechado'
        },
        page: {
            eyebrow: 'Página atual',
            title: 'Estado da página',
            ready: 'Conectado',
            unsupported: 'Não suportado',
            unavailable: 'Indisponível',
            enhancedCount: '{count} tabelas melhoradas',
            unsupportedDescription: 'Esta página não permite scripts de extensões.',
            unavailableDescription: 'Não foi possível ligar à página atual. Atualize e tente novamente.',
            modeAutoOn: 'Melhoria automática ativa',
            modeAutoOff: 'Melhoria automática desativada',
            hostFallback: 'Separador atual',
            titleFallback: 'Página sem título',
            localFile: 'Ficheiro local'
        },
        actions: {
            eyebrow: 'Ações rápidas',
            title: 'Ações da página',
            description: 'Selecione a tabela que quer melhorar e ajuste o comportamento ao seu fluxo de trabalho.',
            pickDescription: 'Volte à página e clique na tabela pretendida.',
            clearDescription: 'Limpa a tabela atualmente selecionada nesta página.'
        },
        settings: {
            eyebrow: 'Preferências',
            title: 'Definições de comportamento',
            description: 'Estas preferências são guardadas de imediato e sincronizadas com o separador atual.'
        },
        status: {
            picking: 'Clique numa tabela para a melhorar...',
            success: 'Seleção limpa',
            error: 'A operação falhou. Atualize e tente novamente'
        },
        autoEnhance: {
            label: 'Melhorar automaticamente todas as tabelas',
            description: 'Melhora automaticamente todas as tabelas de dados detetadas.',
            enabled: 'Melhoria automática ativada para todas as tabelas',
            disabled: 'Melhoria automática desativada para todas as tabelas'
        },
        multiColumnSort: {
            label: 'Ativar ordenação por várias colunas',
            description: 'Ordena por prioridade conforme a ordem dos cliques.',
            enabled: 'Ordenação por várias colunas ativada',
            disabled: 'Ordenação por várias colunas desativada'
        },
        toolbarDefaultExpanded: {
            label: 'Barra de ferramentas expandida por predefinição',
            description: 'Expande automaticamente o conjunto de ferramentas no canto superior direito da tabela.',
            expanded: 'Barra de ferramentas expandida por predefinição',
            collapsed: 'Barra de ferramentas recolhida por predefinição'
        }
    },

    columnControl: {
        filter: {
            placeholder: 'Introduza critérios de filtro...',
            showPanel: 'Mostrar campo de filtro',
            hidePanel: 'Ocultar campo de filtro',
            locked: 'O filtro avançado está ativado',
            advanced: 'Filtro avançado'
        },
        sort: {
            ascending: 'Ascendente',
            descending: 'Descendente',
            none: 'Sem ordenação',
            advanced: 'Ordenação avançada'
        },
        statistics: 'Estatísticas',
        exportCsv: 'Exportar CSV',
        toolbar: {
            expand: 'Expandir barra de ferramentas',
            collapse: 'Recolher barra de ferramentas'
        }
    },

    advancedPanel: {
        common: {
            columnFallback: 'Coluna {index}',
            duplicateColumnFormat: '{label} (Coluna {index})',
            close: 'Fechar',
            reset: 'Redefinir',
            cancel: 'Cancelar',
            apply: 'Aplicar',
            delete: 'Eliminar'
        },
        filter: {
            title: 'Filtro avançado',
            operator: {
                and: 'E',
                or: 'OU'
            },
            operatorTooltip: {
                and: 'Corresponder a todas as condições',
                or: 'Corresponder a qualquer condição'
            },
            addRule: '+ Adicionar condição',
            negateTooltip: 'Negar esta condição',
            valuePlaceholder: 'Valor',
            minPlaceholder: 'Valor mínimo',
            maxPlaceholder: 'Valor máximo',
            flagsPlaceholder: 'Opções',
            comparator: {
                contains: 'Contém',
                startsWith: 'Começa com',
                endsWith: 'Termina com',
                equals: 'Igual a',
                regex: 'Regex',
                gt: 'Maior que',
                gte: 'Maior ou igual a',
                lt: 'Menor que',
                lte: 'Menor ou igual a',
                between: 'Entre',
                isEmpty: 'Está vazio',
                isNotEmpty: 'Não está vazio'
            },
            addGroup: '+ Adicionar grupo',
            groupLabel: 'Grupo',
            groupNegateTooltip: 'Negar este grupo (NOT)',
            hint: {
                keepOneRule: 'É necessária pelo menos uma condição de filtro.',
                keepOneInGroup: 'É necessária pelo menos uma condição no grupo.',
                maxDepth: 'A profundidade máxima de aninhamento é de {max} níveis.',
                resetDone: 'O filtro avançado foi redefinido.',
                needOneRule: 'Adicione pelo menos uma condição de filtro.'
            },
            errors: {
                betweenInvalid: 'O comparador Entre requer valores mínimo e máximo válidos',
                betweenOrder: 'O valor mínimo não pode ser maior do que o valor máximo',
                regexRequired: 'O comparador Regex requer um padrão',
                regexInvalid: 'Regex inválida: {message}',
                numericRequired: 'Os comparadores numéricos requerem um número válido'
            }
        },
        sort: {
            title: 'Ordenação avançada',
            addRule: '+ Adicionar regra de ordenação',
            direction: {
                asc: 'Ascendente',
                desc: 'Descendente'
            },
            type: {
                auto: 'Deteção automática',
                number: 'Número',
                text: 'Texto',
                date: 'Data',
                percent: 'Percentagem',
                duration: 'Duração',
                mass: 'Massa',
                length: 'Comprimento',
                area: 'Área',
                volume: 'Volume',
                speed: 'Velocidade',
                temperature: 'Temperatura',
                pressure: 'Pressão',
                energy: 'Energia',
                power: 'Potência',
                voltage: 'Tensão',
                current: 'Corrente',
                resistance: 'Resistência',
                frequency: 'Frequência',
                dataSize: 'Tamanho dos dados',
                bitrate: 'Taxa de bits'
            },
            typeButton: {
                autoFormat: 'Auto: {type}'
            },
            typePopup: {
                searchPlaceholder: 'Pesquisar tipo...'
            },
            hint: {
                keepOneRule: 'É necessária pelo menos uma regra de ordenação.',
                resetDone: 'A ordenação avançada foi redefinida.',
                needOneRule: 'Adicione pelo menos uma regra de ordenação.',
                multiColumnAuto: 'A ordenação por várias colunas será ativada ao aplicar.',
                allColumnsUsed: 'Todas as colunas já têm regras de ordenação.'
            },
            errors: {
                invalidColumn: 'Seleção de coluna inválida'
            }
        },
        statistics: {
            title: 'Estatísticas',
            addRule: '+ Adicionar regra estatística',
            type: {
                count: 'Contagem',
                sum: 'Soma',
                average: 'Média',
                median: 'Mediana',
                min: 'Mínimo',
                max: 'Máximo',
                range: 'Amplitude',
                variance: 'Variância',
                stddev: 'Desvio padrão'
            },
            hint: {
                keepOneRule: 'É necessária pelo menos uma regra estatística.',
                resetDone: 'A configuração das estatísticas foi redefinida.',
                needOneRule: 'Adicione pelo menos uma regra estatística.',
                duplicateRule: 'Já existe uma regra com a mesma coluna e tipo.'
            }
        }
    },

    errors: {
        failedToLoad: 'Falha ao carregar',
        failedToSave: 'Falha ao guardar',
        networkError: 'Erro de rede',
        unknownError: 'Erro desconhecido'
    }
};

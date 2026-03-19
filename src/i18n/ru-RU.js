// Russian (Russia) language pack
export default {
    common: {
        loading: 'Загрузка...',
        error: 'Ошибка',
        success: 'Успех',
        cancel: 'Отмена',
        confirm: 'Подтвердить',
        save: 'Сохранить',
        delete: 'Удалить',
        edit: 'Изменить',
        search: 'Поиск',
        filter: 'Фильтр',
        sort: 'Сортировка',
        more: 'Ещё',
        less: 'Свернуть'
    },

    popup: {
        title: 'AnyTable',
        controlCenter: 'Центр управления таблицами',
        subtitle: 'Быстро выберите, очистите и настройте улучшение таблиц для текущей страницы.',
        pickTable: 'Выбрать таблицу',
        clearSelection: 'Очистить выбор',
        footerHint: 'Изменения сохраняются сразу и применяются к улучшению таблиц на текущей странице.',
        language: {
            label: 'Язык интерфейса'
        },
        state: {
            enabled: 'Вкл',
            disabled: 'Выкл',
            expanded: 'Открыто',
            collapsed: 'Закрыто'
        },
        page: {
            eyebrow: 'Текущая страница',
            title: 'Состояние страницы',
            ready: 'Подключено',
            unsupported: 'Не поддерживается',
            unavailable: 'Недоступно',
            enhancedCount: 'Улучшено таблиц: {count}',
            unsupportedDescription: 'На этой странице запрещены скрипты расширений.',
            unavailableDescription: 'Не удалось подключиться к текущей странице. Обновите страницу и попробуйте снова.',
            modeAutoOn: 'Автоулучшение включено',
            modeAutoOff: 'Автоулучшение выключено',
            hostFallback: 'Текущая вкладка',
            titleFallback: 'Страница без названия',
            localFile: 'Локальный файл'
        },
        actions: {
            eyebrow: 'Быстрые действия',
            title: 'Действия со страницей',
            description: 'Выберите таблицу для улучшения, затем настройте поведение под свой сценарий работы.',
            pickDescription: 'Вернитесь на страницу и щёлкните по нужной таблице.',
            clearDescription: 'Очищает текущую выбранную таблицу на этой странице.'
        },
        settings: {
            eyebrow: 'Настройки',
            title: 'Параметры поведения',
            description: 'Эти параметры сохраняются сразу и синхронизируются с текущей вкладкой.'
        },
        status: {
            picking: 'Нажмите на таблицу, чтобы улучшить её...',
            success: 'Выбор очищен',
            error: 'Операция не удалась, обновите страницу и попробуйте снова'
        },
        autoEnhance: {
            label: 'Автоматически улучшать все таблицы',
            description: 'Автоматически улучшать все обнаруженные таблицы данных.',
            enabled: 'Автоулучшение включено для всех таблиц',
            disabled: 'Автоулучшение выключено для всех таблиц'
        },
        multiColumnSort: {
            label: 'Включить сортировку по нескольким столбцам',
            description: 'Сортировать по приоритету в порядке кликов.',
            enabled: 'Сортировка по нескольким столбцам включена',
            disabled: 'Сортировка по нескольким столбцам выключена'
        },
        toolbarDefaultExpanded: {
            label: 'Панель инструментов раскрыта по умолчанию',
            description: 'Автоматически раскрывать набор инструментов в правом верхнем углу таблицы.',
            expanded: 'Панель инструментов по умолчанию раскрыта',
            collapsed: 'Панель инструментов по умолчанию свернута'
        }
    },

    columnControl: {
        filter: {
            placeholder: 'Введите условия фильтра...',
            showPanel: 'Показать поле фильтра',
            hidePanel: 'Скрыть поле фильтра',
            locked: 'Расширенный фильтр включён',
            advanced: 'Расширенный фильтр'
        },
        sort: {
            ascending: 'По возрастанию',
            descending: 'По убыванию',
            none: 'Без сортировки',
            advanced: 'Расширенная сортировка'
        },
        statistics: 'Статистика',
        exportCsv: 'Экспорт CSV',
        toolbar: {
            expand: 'Развернуть панель инструментов',
            collapse: 'Свернуть панель инструментов'
        }
    },

    advancedPanel: {
        common: {
            columnFallback: 'Столбец {index}',
            duplicateColumnFormat: '{label} (Столбец {index})',
            close: 'Закрыть',
            reset: 'Сбросить',
            cancel: 'Отмена',
            apply: 'Применить',
            delete: 'Удалить'
        },
        filter: {
            title: 'Расширенный фильтр',
            operator: {
                and: 'И',
                or: 'ИЛИ'
            },
            operatorTooltip: {
                and: 'Соответствовать всем условиям',
                or: 'Соответствовать любому условию'
            },
            addRule: '+ Добавить условие',
            negateTooltip: 'Инвертировать это условие',
            valuePlaceholder: 'Значение',
            minPlaceholder: 'Минимум',
            maxPlaceholder: 'Максимум',
            flagsPlaceholder: 'Флаги',
            comparator: {
                contains: 'Содержит',
                startsWith: 'Начинается с',
                endsWith: 'Заканчивается на',
                equals: 'Равно',
                regex: 'Регулярное выражение',
                gt: 'Больше чем',
                gte: 'Больше или равно',
                lt: 'Меньше чем',
                lte: 'Меньше или равно',
                between: 'Между',
                isEmpty: 'Пусто',
                isNotEmpty: 'Не пусто'
            },
            addGroup: '+ Добавить группу',
            groupLabel: 'Группа',
            groupNegateTooltip: 'Инвертировать эту группу (NOT)',
            hint: {
                keepOneRule: 'Требуется хотя бы одно условие фильтра.',
                keepOneInGroup: 'В группе требуется хотя бы одно условие.',
                maxDepth: 'Максимальная глубина вложенности: {max} уровней.',
                resetDone: 'Расширенный фильтр сброшен.',
                needOneRule: 'Добавьте хотя бы одно условие фильтра.'
            },
            errors: {
                betweenInvalid: 'Сравнение Между требует корректных минимального и максимального значений',
                betweenOrder: 'Минимальное значение не может быть больше максимального',
                regexRequired: 'Для сравнения Regex требуется шаблон',
                regexInvalid: 'Некорректное регулярное выражение: {message}',
                numericRequired: 'Числовые сравнения требуют корректного числа'
            }
        },
        sort: {
            title: 'Расширенная сортировка',
            addRule: '+ Добавить правило сортировки',
            direction: {
                asc: 'По возрастанию',
                desc: 'По убыванию'
            },
            type: {
                auto: 'Автоопределение',
                number: 'Число',
                text: 'Текст',
                date: 'Дата',
                percent: 'Процент',
                duration: 'Длительность',
                mass: 'Масса',
                length: 'Длина',
                area: 'Площадь',
                volume: 'Объём',
                speed: 'Скорость',
                temperature: 'Температура',
                pressure: 'Давление',
                energy: 'Энергия',
                power: 'Мощность',
                voltage: 'Напряжение',
                current: 'Ток',
                resistance: 'Сопротивление',
                frequency: 'Частота',
                dataSize: 'Размер данных',
                bitrate: 'Битрейт'
            },
            typeButton: {
                autoFormat: 'Авто: {type}'
            },
            typePopup: {
                searchPlaceholder: 'Поиск типа...'
            },
            hint: {
                keepOneRule: 'Требуется хотя бы одно правило сортировки.',
                resetDone: 'Расширенная сортировка сброшена.',
                needOneRule: 'Добавьте хотя бы одно правило сортировки.',
                multiColumnAuto: 'Сортировка по нескольким столбцам будет включена при применении.',
                allColumnsUsed: 'Для всех столбцов уже есть правила сортировки.'
            },
            errors: {
                invalidColumn: 'Некорректный выбор столбца'
            }
        },
        statistics: {
            title: 'Статистика',
            addRule: '+ Добавить статистическое правило',
            type: {
                count: 'Количество',
                sum: 'Сумма',
                average: 'Среднее',
                median: 'Медиана',
                min: 'Минимум',
                max: 'Максимум',
                range: 'Диапазон',
                variance: 'Дисперсия',
                stddev: 'Стандартное отклонение'
            },
            hint: {
                keepOneRule: 'Требуется хотя бы одно статистическое правило.',
                resetDone: 'Настройки статистики сброшены.',
                needOneRule: 'Добавьте хотя бы одно статистическое правило.',
                duplicateRule: 'Правило с таким же столбцом и типом уже существует.'
            }
        }
    },

    errors: {
        failedToLoad: 'Не удалось загрузить',
        failedToSave: 'Не удалось сохранить',
        networkError: 'Ошибка сети',
        unknownError: 'Неизвестная ошибка'
    }
};

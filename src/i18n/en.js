// English language pack
export default {
    // Common
    common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        cancel: 'Cancel',
        confirm: 'Confirm',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        more: 'More',
        less: 'Less'
    },
    
    // Popup
    popup: {
        title: 'AnyTable',
        pickTable: 'Pick Table',
        clearSelection: 'Clear Selection',
        status: {
            picking: 'Click on a table to enhance...',
            success: 'Selection cleared',
            error: 'Operation failed, please refresh and try again'
        },
        autoEnhance: {
            label: 'Auto-enhance all tables',
            enabled: 'Auto-enhancement enabled for all tables',
            disabled: 'Auto-enhancement disabled for all tables'
        },
        multiColumnSort: {
            label: 'Enable multi-column sort',
            enabled: 'Multi-column sort enabled',
            disabled: 'Multi-column sort disabled'
        }
    },
    
    // Column Control Panel
    columnControl: {
        title: 'Column Control',
        filter: {
            placeholder: 'Enter filter criteria...',
            advanced: 'Advanced Filter'
        },
        sort: {
            ascending: 'Ascending',
            descending: 'Descending',
            none: 'No Sort',
            advanced: 'Advanced Sort'
        }
    },

    // Advanced Panel
    advancedPanel: {
        common: {
            columnFallback: 'Column {index}',
            close: 'Close',
            reset: 'Reset',
            cancel: 'Cancel',
            apply: 'Apply',
            delete: 'Delete'
        },
        filter: {
            title: 'Advanced Filter',
            operator: {
                and: 'AND (all conditions)',
                or: 'OR (any condition)'
            },
            addRule: '+ Add Condition',
            negateTooltip: 'Negate this condition',
            valuePlaceholder: 'Value',
            minPlaceholder: 'Min Value',
            maxPlaceholder: 'Max Value',
            flagsPlaceholder: 'flags',
            comparator: {
                contains: 'Contains',
                startsWith: 'Starts with',
                endsWith: 'Ends with',
                equals: 'Equals',
                regex: 'Regex',
                gt: 'Greater than',
                gte: 'Greater than or equal',
                lt: 'Less than',
                lte: 'Less than or equal',
                between: 'Between',
                isEmpty: 'Is empty',
                isNotEmpty: 'Is not empty'
            },
            addGroup: '+ Add Group',
            groupLabel: 'Group',
            groupNegateTooltip: 'Negate this group (NOT)',
            hint: {
                keepOneRule: 'At least one filter condition is required.',
                keepOneInGroup: 'At least one condition is required in a group.',
                maxDepth: 'Maximum nesting depth is {max} levels.',
                resetDone: 'Advanced filter has been reset.',
                needOneRule: 'Please add at least one filter condition.'
            },
            errors: {
                betweenInvalid: 'Between comparator requires valid min and max values',
                betweenOrder: 'Min value cannot be greater than max value',
                regexRequired: 'Regex comparator requires a pattern',
                regexInvalid: 'Invalid regex: {message}',
                numericRequired: 'Numeric comparators require a valid number'
            }
        },
        sort: {
            title: 'Advanced Sort',
            addRule: '+ Add Sort Rule',
            direction: {
                asc: 'Ascending',
                desc: 'Descending'
            },
            type: {
                auto: 'Auto Detect',
                number: 'Number',
                text: 'Text',
                date: 'Date',
                percent: 'Percent',
                duration: 'Duration',
                mass: 'Mass',
                length: 'Length',
                area: 'Area',
                volume: 'Volume',
                speed: 'Speed',
                temperature: 'Temperature',
                pressure: 'Pressure',
                energy: 'Energy',
                power: 'Power',
                voltage: 'Voltage',
                current: 'Current',
                resistance: 'Resistance',
                frequency: 'Frequency',
                dataSize: 'Data Size',
                bitrate: 'Bitrate'
            },
            typeButton: {
                autoFormat: 'Auto: {type}'
            },
            typePopup: {
                searchPlaceholder: 'Search type...'
            },
            hint: {
                keepOneRule: 'At least one sort rule is required.',
                resetDone: 'Advanced sort has been reset.',
                needOneRule: 'Please add at least one sort rule.',
                multiColumnAuto: 'Multi-column sort will be enabled on apply.',
                allColumnsUsed: 'All columns already have sort rules.'
            },
            errors: {
                invalidColumn: 'Invalid column selection'
            }
        }
    },
    
    // Error Messages
    errors: {
        failedToLoad: 'Failed to load',
        failedToSave: 'Failed to save',
        networkError: 'Network error',
        unknownError: 'Unknown error'
    }
}; 

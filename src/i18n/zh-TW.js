// 繁體中文語言包
export default {
    common: {
        loading: '載入中...',
        error: '錯誤',
        success: '成功',
        cancel: '取消',
        confirm: '確認',
        save: '儲存',
        delete: '刪除',
        edit: '編輯',
        search: '搜尋',
        filter: '篩選',
        sort: '排序',
        more: '更多',
        less: '收合'
    },

    popup: {
        title: 'AnyTable',
        controlCenter: '表格控制中心',
        subtitle: '為目前頁面快速選擇、清除並設定表格增強行為。',
        pickTable: '選擇表格',
        clearSelection: '清除選擇',
        footerHint: '變更會立即儲存到瀏覽器，並影響目前頁面的表格增強行為。',
        language: {
            label: '介面語言'
        },
        state: {
            enabled: '開啟',
            disabled: '關閉',
            expanded: '展開',
            collapsed: '收合'
        },
        page: {
            eyebrow: '目前頁面',
            title: '頁面狀態',
            ready: '已連線',
            unsupported: '不可用',
            unavailable: '未連線',
            enhancedCount: '已增強 {count} 個表格',
            unsupportedDescription: '該頁面不允許注入擴充功能腳本。',
            unavailableDescription: '無法連線到目前頁面，請重新整理後再試。',
            modeAutoOn: '自動增強開啟',
            modeAutoOff: '自動增強關閉',
            hostFallback: '目前分頁',
            titleFallback: '未命名頁面',
            localFile: '本機檔案'
        },
        actions: {
            eyebrow: '快速操作',
            title: '本頁操作',
            description: '先選擇要增強的表格，再依照你的偏好調整行為。',
            pickDescription: '返回頁面後點選目標表格即可增強。',
            clearDescription: '清除目前頁面中已選取的表格。'
        },
        settings: {
            eyebrow: '偏好設定',
            title: '行為偏好',
            description: '這些設定會立即儲存，並同步到目前分頁。'
        },
        status: {
            picking: '請點選要增強的表格...',
            success: '已清除所有選擇',
            error: '操作失敗，請重新整理頁面後再試'
        },
        autoEnhance: {
            label: '自動增強所有表格',
            description: '自動增強偵測到的所有資料表格。',
            enabled: '已啟用自動增強所有表格',
            disabled: '已停用自動增強所有表格'
        },
        multiColumnSort: {
            label: '啟用多欄排序',
            description: '依照點擊順序進行優先度排序。',
            enabled: '已啟用多欄排序',
            disabled: '已停用多欄排序'
        },
        toolbarDefaultExpanded: {
            label: '工具列預設展開',
            description: '自動展開表格右上角的工具集。',
            expanded: '工具列預設已設為展開',
            collapsed: '工具列預設已設為收合'
        }
    },

    columnControl: {
        filter: {
            placeholder: '輸入篩選條件...',
            showPanel: '顯示篩選輸入框',
            hidePanel: '隱藏篩選輸入框',
            locked: '高級篩選已啟用',
            advanced: '高級篩選'
        },
        sort: {
            ascending: '升冪',
            descending: '降冪',
            none: '不排序',
            advanced: '高級排序'
        },
        statistics: '統計',
        exportCsv: '匯出 CSV',
        toolbar: {
            expand: '展開工具列',
            collapse: '收合工具列'
        }
    },

    advancedPanel: {
        common: {
            columnFallback: '欄 {index}',
            duplicateColumnFormat: '{label}（第 {index} 欄）',
            close: '關閉',
            reset: '重設',
            cancel: '取消',
            apply: '套用',
            delete: '刪除'
        },
        filter: {
            title: '高級篩選',
            operator: {
                and: 'AND',
                or: 'OR'
            },
            operatorTooltip: {
                and: '符合所有條件',
                or: '符合任一條件'
            },
            addRule: '+ 新增條件',
            negateTooltip: '反轉此條件',
            valuePlaceholder: '值',
            minPlaceholder: '最小值',
            maxPlaceholder: '最大值',
            flagsPlaceholder: '旗標',
            comparator: {
                contains: '包含',
                startsWith: '開頭是',
                endsWith: '結尾是',
                equals: '等於',
                regex: '正則',
                gt: '大於',
                gte: '大於等於',
                lt: '小於',
                lte: '小於等於',
                between: '區間',
                isEmpty: '為空',
                isNotEmpty: '不為空'
            },
            addGroup: '+ 新增群組',
            groupLabel: '條件群組',
            groupNegateTooltip: '反轉此群組（NOT）',
            hint: {
                keepOneRule: '至少需要保留一個篩選條件。',
                keepOneInGroup: '群組內至少需要一個條件。',
                maxDepth: '最多支援 {max} 層巢狀結構。',
                resetDone: '已重設高級篩選。',
                needOneRule: '請至少新增一個篩選條件。'
            },
            errors: {
                betweenInvalid: '區間比較器需要有效的最小值與最大值',
                betweenOrder: '最小值不能大於最大值',
                regexRequired: '正則比較器需要輸入模式',
                regexInvalid: '正則表達式無效：{message}',
                numericRequired: '數值比較器需要有效的數字'
            }
        },
        sort: {
            title: '高級排序',
            addRule: '+ 新增排序規則',
            direction: {
                asc: '升冪',
                desc: '降冪'
            },
            type: {
                auto: '自動判斷',
                number: '數值',
                text: '文字',
                date: '日期',
                percent: '百分比',
                duration: '時長',
                mass: '質量',
                length: '長度',
                area: '面積',
                volume: '體積',
                speed: '速度',
                temperature: '溫度',
                pressure: '壓力',
                energy: '能量',
                power: '功率',
                voltage: '電壓',
                current: '電流',
                resistance: '電阻',
                frequency: '頻率',
                dataSize: '資料量',
                bitrate: '位元率'
            },
            typeButton: {
                autoFormat: '自動：{type}'
            },
            typePopup: {
                searchPlaceholder: '搜尋類型...'
            },
            hint: {
                keepOneRule: '至少需要保留一個排序規則。',
                resetDone: '已重設高級排序。',
                needOneRule: '請至少新增一個排序規則。',
                multiColumnAuto: '套用後將自動啟用多欄排序。',
                allColumnsUsed: '所有欄位都已加入排序規則。'
            },
            errors: {
                invalidColumn: '欄位選擇無效'
            }
        },
        statistics: {
            title: '統計',
            addRule: '+ 新增統計規則',
            type: {
                count: '計數',
                sum: '總和',
                average: '平均值',
                median: '中位數',
                min: '最小值',
                max: '最大值',
                range: '極差',
                variance: '變異數',
                stddev: '標準差'
            },
            hint: {
                keepOneRule: '至少需要保留一個統計規則。',
                resetDone: '已重設統計設定。',
                needOneRule: '請至少新增一個統計規則。',
                duplicateRule: '已存在相同欄位與統計類型的規則。'
            }
        }
    },

    errors: {
        failedToLoad: '載入失敗',
        failedToSave: '儲存失敗',
        networkError: '網路錯誤',
        unknownError: '未知錯誤'
    }
};

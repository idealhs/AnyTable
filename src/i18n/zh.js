// 中文语言包
export default {
    // 通用
    common: {
        loading: '加载中...',
        error: '错误',
        success: '成功',
        cancel: '取消',
        confirm: '确认',
        save: '保存',
        delete: '删除',
        edit: '编辑',
        search: '搜索',
        filter: '筛选',
        sort: '排序',
        more: '更多',
        less: '收起'
    },
    
    // 弹出窗口
    popup: {
        title: 'AnyTable',
        pickTable: '选择表格',
        clearSelection: '清除选择',
        status: {
            picking: '请点击要增强的表格...',
            success: '已清除所有选择',
            error: '操作失败，请刷新页面后重试'
        },
        autoEnhance: {
            label: '自动增强所有表格',
            enabled: '已启用自动增强所有表格',
            disabled: '已禁用自动增强所有表格'
        },
        multiColumnSort: {
            label: '启用多列排序',
            enabled: '已启用多列排序',
            disabled: '已禁用多列排序'
        }
    },
    
    // 表格控制面板
    columnControl: {
        title: '列控制',
        filter: {
            placeholder: '输入筛选条件...',
            advanced: '高级筛选'
        },
        sort: {
            ascending: '升序',
            descending: '降序',
            none: '不排序',
            advanced: '高级排序'
        }
    },

    // 高级面板
    advancedPanel: {
        common: {
            columnFallback: '列{index}',
            close: '关闭',
            reset: '重置',
            cancel: '取消',
            apply: '应用',
            delete: '删除'
        },
        filter: {
            title: '高级筛选',
            operator: {
                and: 'AND（并且）',
                or: 'OR（或者）'
            },
            addRule: '+ 添加条件',
            negateTooltip: '取反当前条件',
            valuePlaceholder: '值',
            minPlaceholder: '最小值',
            maxPlaceholder: '最大值',
            flagsPlaceholder: 'flags',
            comparator: {
                contains: '包含',
                startsWith: '开头是',
                endsWith: '结尾是',
                equals: '等于',
                regex: '正则',
                gt: '大于',
                gte: '大于等于',
                lt: '小于',
                lte: '小于等于',
                between: '区间',
                isEmpty: '为空',
                isNotEmpty: '不为空'
            },
            addGroup: '+ 添加分组',
            groupLabel: '条件组',
            groupNegateTooltip: '取反当前分组（NOT）',
            hint: {
                keepOneRule: '至少保留一个筛选条件。',
                keepOneInGroup: '分组内至少保留一个条件。',
                maxDepth: '最多支持 {max} 层嵌套。',
                resetDone: '已重置高级筛选配置。',
                needOneRule: '请至少添加一个筛选条件。'
            },
            errors: {
                betweenInvalid: '区间筛选需要有效的最小值和最大值',
                betweenOrder: '区间筛选最小值不能大于最大值',
                regexRequired: '正则筛选必须输入表达式',
                regexInvalid: '正则表达式无效：{message}',
                numericRequired: '数值比较器需要有效的数字'
            }
        },
        sort: {
            title: '高级排序',
            addRule: '+ 添加排序规则',
            direction: {
                asc: '升序',
                desc: '降序'
            },
            type: {
                auto: '自动识别',
                number: '数值',
                text: '文本',
                date: '日期'
            },
            detectedType: {
                number: '数值',
                time: '时间',
                weight: '重量',
                percent: '百分比',
                unit: '数值（带单位）',
                text: '文本'
            },
            hint: {
                keepOneRule: '至少保留一个排序规则。',
                resetDone: '已重置高级排序配置。',
                needOneRule: '请至少添加一个排序规则。',
                multiColumnAuto: '应用后将自动启用多列排序。',
                allColumnsUsed: '所有列已添加排序规则。'
            },
            errors: {
                invalidColumn: '列选择无效'
            }
        }
    },
    
    // 错误消息
    errors: {
        failedToLoad: '加载失败',
        failedToSave: '保存失败',
        networkError: '网络错误',
        unknownError: '未知错误'
    }
}; 

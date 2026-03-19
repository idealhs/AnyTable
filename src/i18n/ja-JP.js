// Japanese language pack
export default {
    common: {
        loading: '読み込み中...',
        error: 'エラー',
        success: '成功',
        cancel: 'キャンセル',
        confirm: '確認',
        save: '保存',
        delete: '削除',
        edit: '編集',
        search: '検索',
        filter: 'フィルター',
        sort: '並べ替え',
        more: 'もっと見る',
        less: '折りたたむ'
    },

    popup: {
        title: 'AnyTable',
        controlCenter: 'テーブルコントロールセンター',
        subtitle: '現在のページの表の拡張をすばやく選択、解除、設定します。',
        pickTable: 'テーブルを選択',
        clearSelection: '選択を解除',
        footerHint: '変更はすぐに保存され、現在のページのテーブル拡張に適用されます。',
        language: {
            label: 'インターフェース言語'
        },
        state: {
            enabled: 'オン',
            disabled: 'オフ',
            expanded: '展開',
            collapsed: '折りたたみ'
        },
        page: {
            eyebrow: '現在のページ',
            title: 'ページ状態',
            ready: '接続済み',
            unsupported: '非対応',
            unavailable: '利用不可',
            enhancedCount: '{count} 件のテーブルを拡張',
            unsupportedDescription: 'このページでは拡張機能のスクリプトを実行できません。',
            unavailableDescription: '現在のページに接続できません。再読み込みしてもう一度お試しください。',
            modeAutoOn: '自動拡張オン',
            modeAutoOff: '自動拡張オフ',
            hostFallback: '現在のタブ',
            titleFallback: '無題のページ',
            localFile: 'ローカルファイル'
        },
        actions: {
            eyebrow: 'クイックアクション',
            title: 'ページ操作',
            description: '拡張したいテーブルを選び、使い方に合わせて動作を調整します。',
            pickDescription: 'ページに戻って対象のテーブルをクリックしてください。',
            clearDescription: 'このページで現在選択されているテーブルを解除します。'
        },
        settings: {
            eyebrow: '設定',
            title: '動作設定',
            description: 'これらの設定はすぐに保存され、現在のタブに同期されます。'
        },
        status: {
            picking: '拡張するテーブルをクリックしてください...',
            success: '選択を解除しました',
            error: '操作に失敗しました。ページを再読み込みしてもう一度お試しください'
        },
        autoEnhance: {
            label: 'すべてのテーブルを自動拡張',
            description: '検出したすべてのデータテーブルを自動で拡張します。',
            enabled: 'すべてのテーブルの自動拡張を有効にしました',
            disabled: 'すべてのテーブルの自動拡張を無効にしました'
        },
        multiColumnSort: {
            label: '複数列ソートを有効化',
            description: 'クリック順に優先度を付けて並べ替えます。',
            enabled: '複数列ソートを有効にしました',
            disabled: '複数列ソートを無効にしました'
        },
        toolbarDefaultExpanded: {
            label: 'ツールバーを既定で展開',
            description: 'テーブル右上のツール群を自動的に展開します。',
            expanded: 'ツールバーの既定を展開に設定しました',
            collapsed: 'ツールバーの既定を折りたたみに設定しました'
        }
    },

    columnControl: {
        filter: {
            placeholder: 'フィルター条件を入力...',
            showPanel: 'フィルター入力欄を表示',
            hidePanel: 'フィルター入力欄を非表示',
            locked: '高度なフィルターが有効です',
            advanced: '高度なフィルター'
        },
        sort: {
            ascending: '昇順',
            descending: '降順',
            none: '並べ替えなし',
            advanced: '高度な並べ替え'
        },
        statistics: '統計',
        exportCsv: 'CSV をエクスポート',
        toolbar: {
            expand: 'ツールバーを展開',
            collapse: 'ツールバーを折りたたむ'
        }
    },

    advancedPanel: {
        common: {
            columnFallback: '列 {index}',
            duplicateColumnFormat: '{label}（列 {index}）',
            close: '閉じる',
            reset: 'リセット',
            cancel: 'キャンセル',
            apply: '適用',
            delete: '削除'
        },
        filter: {
            title: '高度なフィルター',
            operator: {
                and: 'AND',
                or: 'OR'
            },
            operatorTooltip: {
                and: 'すべての条件に一致',
                or: 'いずれかの条件に一致'
            },
            addRule: '+ 条件を追加',
            negateTooltip: 'この条件を否定',
            valuePlaceholder: '値',
            minPlaceholder: '最小値',
            maxPlaceholder: '最大値',
            flagsPlaceholder: 'フラグ',
            comparator: {
                contains: '含む',
                startsWith: 'で始まる',
                endsWith: 'で終わる',
                equals: '等しい',
                regex: '正規表現',
                gt: 'より大きい',
                gte: '以上',
                lt: 'より小さい',
                lte: '以下',
                between: '範囲',
                isEmpty: '空',
                isNotEmpty: '空ではない'
            },
            addGroup: '+ グループを追加',
            groupLabel: 'グループ',
            groupNegateTooltip: 'このグループを否定 (NOT)',
            hint: {
                keepOneRule: '少なくとも 1 つのフィルター条件が必要です。',
                keepOneInGroup: 'グループ内に少なくとも 1 つの条件が必要です。',
                maxDepth: 'ネストの最大深さは {max} レベルです。',
                resetDone: '高度なフィルターをリセットしました。',
                needOneRule: '少なくとも 1 つのフィルター条件を追加してください。'
            },
            errors: {
                betweenInvalid: '範囲比較には有効な最小値と最大値が必要です',
                betweenOrder: '最小値を最大値より大きくすることはできません',
                regexRequired: '正規表現比較にはパターンが必要です',
                regexInvalid: '無効な正規表現: {message}',
                numericRequired: '数値比較には有効な数値が必要です'
            }
        },
        sort: {
            title: '高度な並べ替え',
            addRule: '+ ソート条件を追加',
            direction: {
                asc: '昇順',
                desc: '降順'
            },
            type: {
                auto: '自動判定',
                number: '数値',
                text: 'テキスト',
                date: '日付',
                percent: 'パーセント',
                duration: '時間',
                mass: '質量',
                length: '長さ',
                area: '面積',
                volume: '体積',
                speed: '速度',
                temperature: '温度',
                pressure: '圧力',
                energy: 'エネルギー',
                power: '電力',
                voltage: '電圧',
                current: '電流',
                resistance: '抵抗',
                frequency: '周波数',
                dataSize: 'データサイズ',
                bitrate: 'ビットレート'
            },
            typeButton: {
                autoFormat: '自動: {type}'
            },
            typePopup: {
                searchPlaceholder: '種類を検索...'
            },
            hint: {
                keepOneRule: '少なくとも 1 つのソート条件が必要です。',
                resetDone: '高度な並べ替えをリセットしました。',
                needOneRule: '少なくとも 1 つのソート条件を追加してください。',
                multiColumnAuto: '適用時に複数列ソートが有効になります。',
                allColumnsUsed: 'すべての列にソート条件が設定されています。'
            },
            errors: {
                invalidColumn: '無効な列の選択です'
            }
        },
        statistics: {
            title: '統計',
            addRule: '+ 統計条件を追加',
            type: {
                count: '件数',
                sum: '合計',
                average: '平均',
                median: '中央値',
                min: '最小',
                max: '最大',
                range: '範囲',
                variance: '分散',
                stddev: '標準偏差'
            },
            hint: {
                keepOneRule: '少なくとも 1 つの統計条件が必要です。',
                resetDone: '統計設定をリセットしました。',
                needOneRule: '少なくとも 1 つの統計条件を追加してください。',
                duplicateRule: '同じ列と種類のルールが既にあります。'
            }
        }
    },

    errors: {
        failedToLoad: '読み込みに失敗しました',
        failedToSave: '保存に失敗しました',
        networkError: 'ネットワークエラー',
        unknownError: '不明なエラー'
    }
};

// Korean language pack
export default {
    common: {
        loading: '로딩 중...',
        error: '오류',
        success: '성공',
        cancel: '취소',
        confirm: '확인',
        save: '저장',
        delete: '삭제',
        edit: '편집',
        search: '검색',
        filter: '필터',
        sort: '정렬',
        more: '더 보기',
        less: '접기'
    },

    popup: {
        title: 'AnyTable',
        controlCenter: '테이블 제어 센터',
        subtitle: '현재 페이지의 테이블 향상을 빠르게 선택하고 해제하고 설정합니다.',
        pickTable: '테이블 선택',
        clearSelection: '선택 지우기',
        footerHint: '변경 사항은 즉시 저장되어 현재 페이지의 테이블 향상에 적용됩니다.',
        language: {
            label: '인터페이스 언어'
        },
        state: {
            enabled: '켜짐',
            disabled: '꺼짐',
            expanded: '열림',
            collapsed: '닫힘'
        },
        page: {
            eyebrow: '현재 페이지',
            title: '페이지 상태',
            ready: '연결됨',
            unsupported: '지원되지 않음',
            unavailable: '사용할 수 없음',
            enhancedCount: '{count}개 테이블 향상됨',
            unsupportedDescription: '이 페이지는 확장 프로그램 스크립트를 허용하지 않습니다.',
            unavailableDescription: '현재 페이지에 연결할 수 없습니다. 새로고침 후 다시 시도하세요.',
            modeAutoOn: '자동 향상 켜짐',
            modeAutoOff: '자동 향상 꺼짐',
            hostFallback: '현재 탭',
            titleFallback: '제목 없는 페이지',
            localFile: '로컬 파일'
        },
        actions: {
            eyebrow: '빠른 작업',
            title: '페이지 작업',
            description: '향상할 테이블을 선택한 다음 작업 방식에 맞게 동작을 조정하세요.',
            pickDescription: '페이지로 돌아가 대상 테이블을 클릭하세요.',
            clearDescription: '이 페이지에서 현재 선택된 테이블을 지웁니다.'
        },
        settings: {
            eyebrow: '환경설정',
            title: '동작 설정',
            description: '이 설정은 즉시 저장되어 현재 탭과 동기화됩니다.'
        },
        status: {
            picking: '향상할 테이블을 클릭하세요...',
            success: '선택이 지워졌습니다',
            error: '작업에 실패했습니다. 페이지를 새로고침한 후 다시 시도하세요'
        },
        autoEnhance: {
            label: '모든 테이블 자동 향상',
            description: '감지된 모든 데이터 테이블을 자동으로 향상합니다.',
            enabled: '모든 테이블에 대한 자동 향상이 활성화되었습니다',
            disabled: '모든 테이블에 대한 자동 향상이 비활성화되었습니다'
        },
        multiColumnSort: {
            label: '다중 열 정렬 활성화',
            description: '클릭한 순서에 따라 우선순위로 정렬합니다.',
            enabled: '다중 열 정렬이 활성화되었습니다',
            disabled: '다중 열 정렬이 비활성화되었습니다'
        },
        toolbarDefaultExpanded: {
            label: '도구 모음 기본 확장',
            description: '테이블 오른쪽 위의 도구 모음을 자동으로 펼칩니다.',
            expanded: '도구 모음 기본값이 펼침으로 설정되었습니다',
            collapsed: '도구 모음 기본값이 접힘으로 설정되었습니다'
        }
    },

    columnControl: {
        filter: {
            placeholder: '필터 조건 입력...',
            showPanel: '필터 입력 표시',
            hidePanel: '필터 입력 숨기기',
            locked: '고급 필터가 활성화되어 있습니다',
            advanced: '고급 필터'
        },
        sort: {
            ascending: '오름차순',
            descending: '내림차순',
            none: '정렬 안 함',
            advanced: '고급 정렬'
        },
        statistics: '통계',
        exportCsv: 'CSV 내보내기',
        toolbar: {
            expand: '도구 모음 펼치기',
            collapse: '도구 모음 접기'
        }
    },

    advancedPanel: {
        common: {
            columnFallback: '열 {index}',
            duplicateColumnFormat: '{label} (열 {index})',
            close: '닫기',
            reset: '초기화',
            cancel: '취소',
            apply: '적용',
            delete: '삭제'
        },
        filter: {
            title: '고급 필터',
            operator: {
                and: 'AND',
                or: 'OR'
            },
            operatorTooltip: {
                and: '모든 조건과 일치',
                or: '하나 이상의 조건과 일치'
            },
            addRule: '+ 조건 추가',
            negateTooltip: '이 조건 반전',
            valuePlaceholder: '값',
            minPlaceholder: '최소값',
            maxPlaceholder: '최대값',
            flagsPlaceholder: '플래그',
            comparator: {
                contains: '포함',
                startsWith: '다음으로 시작',
                endsWith: '다음으로 끝남',
                equals: '같음',
                regex: '정규식',
                gt: '보다 큼',
                gte: '크거나 같음',
                lt: '보다 작음',
                lte: '작거나 같음',
                between: '범위',
                isEmpty: '비어 있음',
                isNotEmpty: '비어 있지 않음'
            },
            addGroup: '+ 그룹 추가',
            groupLabel: '그룹',
            groupNegateTooltip: '이 그룹 반전 (NOT)',
            hint: {
                keepOneRule: '필터 조건이 하나 이상 필요합니다.',
                keepOneInGroup: '그룹 안에 조건이 하나 이상 필요합니다.',
                maxDepth: '최대 중첩 깊이는 {max}단계입니다.',
                resetDone: '고급 필터가 초기화되었습니다.',
                needOneRule: '필터 조건을 하나 이상 추가하세요.'
            },
            errors: {
                betweenInvalid: '범위 비교에는 유효한 최소값과 최대값이 필요합니다',
                betweenOrder: '최소값은 최대값보다 클 수 없습니다',
                regexRequired: '정규식 비교에는 패턴이 필요합니다',
                regexInvalid: '잘못된 정규식: {message}',
                numericRequired: '숫자 비교에는 유효한 숫자가 필요합니다'
            }
        },
        sort: {
            title: '고급 정렬',
            addRule: '+ 정렬 규칙 추가',
            direction: {
                asc: '오름차순',
                desc: '내림차순'
            },
            type: {
                auto: '자동 감지',
                number: '숫자',
                text: '텍스트',
                date: '날짜',
                percent: '백분율',
                duration: '기간',
                mass: '질량',
                length: '길이',
                area: '면적',
                volume: '부피',
                speed: '속도',
                temperature: '온도',
                pressure: '압력',
                energy: '에너지',
                power: '전력',
                voltage: '전압',
                current: '전류',
                resistance: '저항',
                frequency: '주파수',
                dataSize: '데이터 크기',
                bitrate: '비트레이트'
            },
            typeButton: {
                autoFormat: '자동: {type}'
            },
            typePopup: {
                searchPlaceholder: '유형 검색...'
            },
            hint: {
                keepOneRule: '정렬 규칙이 하나 이상 필요합니다.',
                resetDone: '고급 정렬이 초기화되었습니다.',
                needOneRule: '정렬 규칙을 하나 이상 추가하세요.',
                multiColumnAuto: '적용하면 다중 열 정렬이 활성화됩니다.',
                allColumnsUsed: '모든 열에 이미 정렬 규칙이 있습니다.'
            },
            errors: {
                invalidColumn: '잘못된 열 선택입니다'
            }
        },
        statistics: {
            title: '통계',
            addRule: '+ 통계 규칙 추가',
            type: {
                count: '개수',
                sum: '합계',
                average: '평균',
                median: '중앙값',
                min: '최소',
                max: '최대',
                range: '범위',
                variance: '분산',
                stddev: '표준편차'
            },
            hint: {
                keepOneRule: '통계 규칙이 하나 이상 필요합니다.',
                resetDone: '통계 설정이 초기화되었습니다.',
                needOneRule: '통계 규칙을 하나 이상 추가하세요.',
                duplicateRule: '같은 열과 유형의 규칙이 이미 있습니다.'
            }
        }
    },

    errors: {
        failedToLoad: '불러오기에 실패했습니다',
        failedToSave: '저장에 실패했습니다',
        networkError: '네트워크 오류',
        unknownError: '알 수 없는 오류'
    }
};

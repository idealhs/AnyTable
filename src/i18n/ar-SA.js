// Arabic (Saudi Arabia) language pack
export default {
    common: {
        loading: 'جارٍ التحميل...',
        error: 'خطأ',
        success: 'نجاح',
        cancel: 'إلغاء',
        confirm: 'تأكيد',
        save: 'حفظ',
        delete: 'حذف',
        edit: 'تعديل',
        search: 'بحث',
        filter: 'تصفية',
        sort: 'فرز',
        more: 'المزيد',
        less: 'أقل'
    },

    popup: {
        title: 'AnyTable',
        controlCenter: 'مركز التحكم بالجداول',
        subtitle: 'اختر تحسين الجداول للصفحة الحالية ونظفه واضبطه بسرعة.',
        pickTable: 'تحديد جدول',
        clearSelection: 'مسح التحديد',
        footerHint: 'تُحفَظ التغييرات فورًا وتُطبَّق على تحسين الجداول في الصفحة الحالية.',
        language: {
            label: 'لغة الواجهة'
        },
        state: {
            enabled: 'مفعّل',
            disabled: 'معطّل',
            expanded: 'مفتوح',
            collapsed: 'مغلق'
        },
        page: {
            eyebrow: 'الصفحة الحالية',
            title: 'حالة الصفحة',
            ready: 'متصل',
            unsupported: 'غير مدعوم',
            unavailable: 'غير متاح',
            enhancedCount: 'تم تحسين {count} جدول',
            unsupportedDescription: 'هذه الصفحة لا تسمح بتشغيل نصوص الامتدادات.',
            unavailableDescription: 'تعذّر الاتصال بالصفحة الحالية. أعد التحميل وحاول مرة أخرى.',
            modeAutoOn: 'التحسين التلقائي مفعّل',
            modeAutoOff: 'التحسين التلقائي معطّل',
            hostFallback: 'علامة التبويب الحالية',
            titleFallback: 'صفحة بلا عنوان',
            localFile: 'ملف محلي'
        },
        actions: {
            eyebrow: 'إجراءات سريعة',
            title: 'إجراءات الصفحة',
            description: 'اختر الجدول الذي تريد تحسينه ثم اضبط السلوك بما يناسب طريقة عملك.',
            pickDescription: 'ارجع إلى الصفحة وانقر الجدول المستهدف.',
            clearDescription: 'يمسح الجدول المحدد حاليًا في هذه الصفحة.'
        },
        settings: {
            eyebrow: 'التفضيلات',
            title: 'إعدادات السلوك',
            description: 'تُحفَظ هذه التفضيلات فورًا وتُزامَن مع علامة التبويب الحالية.'
        },
        status: {
            picking: 'انقر جدولًا لتحسينه...',
            success: 'تم مسح التحديد',
            error: 'فشلت العملية، أعد تحميل الصفحة وحاول مرة أخرى'
        },
        autoEnhance: {
            label: 'تحسين جميع الجداول تلقائيًا',
            description: 'يحسّن جميع جداول البيانات المكتشفة تلقائيًا.',
            enabled: 'تم تفعيل التحسين التلقائي لكل الجداول',
            disabled: 'تم تعطيل التحسين التلقائي لكل الجداول'
        },
        multiColumnSort: {
            label: 'تفعيل الفرز متعدد الأعمدة',
            description: 'يفرز حسب الأولوية وفق ترتيب النقر.',
            enabled: 'تم تفعيل الفرز متعدد الأعمدة',
            disabled: 'تم تعطيل الفرز متعدد الأعمدة'
        },
        toolbarDefaultExpanded: {
            label: 'شريط الأدوات موسّع افتراضيًا',
            description: 'يوسّع مجموعة الأدوات تلقائيًا في الزاوية العلوية اليمنى من الجدول.',
            expanded: 'تم ضبط شريط الأدوات على الوضع الموسّع افتراضيًا',
            collapsed: 'تم ضبط شريط الأدوات على الوضع المطوي افتراضيًا'
        }
    },

    columnControl: {
        filter: {
            placeholder: 'أدخل معايير التصفية...',
            showPanel: 'إظهار حقل التصفية',
            hidePanel: 'إخفاء حقل التصفية',
            locked: 'التصفية المتقدمة مفعّلة',
            advanced: 'تصفية متقدمة'
        },
        sort: {
            ascending: 'تصاعدي',
            descending: 'تنازلي',
            none: 'بدون فرز',
            advanced: 'فرز متقدم'
        },
        statistics: 'إحصاءات',
        exportCsv: 'تصدير CSV',
        toolbar: {
            expand: 'توسيع شريط الأدوات',
            collapse: 'طي شريط الأدوات'
        }
    },

    advancedPanel: {
        common: {
            columnFallback: 'العمود {index}',
            duplicateColumnFormat: '{label} (العمود {index})',
            close: 'إغلاق',
            reset: 'إعادة تعيين',
            cancel: 'إلغاء',
            apply: 'تطبيق',
            delete: 'حذف'
        },
        filter: {
            title: 'تصفية متقدمة',
            operator: {
                and: 'و',
                or: 'أو'
            },
            operatorTooltip: {
                and: 'مطابقة كل الشروط',
                or: 'مطابقة أي شرط'
            },
            addRule: '+ إضافة شرط',
            negateTooltip: 'اعكس هذا الشرط',
            valuePlaceholder: 'القيمة',
            minPlaceholder: 'الحد الأدنى',
            maxPlaceholder: 'الحد الأقصى',
            flagsPlaceholder: 'الخيارات',
            comparator: {
                contains: 'يحتوي على',
                startsWith: 'يبدأ بـ',
                endsWith: 'ينتهي بـ',
                equals: 'يساوي',
                regex: 'تعبير نمطي',
                gt: 'أكبر من',
                gte: 'أكبر من أو يساوي',
                lt: 'أصغر من',
                lte: 'أصغر من أو يساوي',
                between: 'بين',
                isEmpty: 'فارغ',
                isNotEmpty: 'غير فارغ'
            },
            addGroup: '+ إضافة مجموعة',
            groupLabel: 'مجموعة',
            groupNegateTooltip: 'اعكس هذه المجموعة (NOT)',
            hint: {
                keepOneRule: 'يلزم شرط تصفية واحد على الأقل.',
                keepOneInGroup: 'يلزم شرط واحد على الأقل داخل المجموعة.',
                maxDepth: 'أقصى عمق للتداخل هو {max} مستويات.',
                resetDone: 'تمت إعادة تعيين التصفية المتقدمة.',
                needOneRule: 'أضف شرط تصفية واحدًا على الأقل.'
            },
            errors: {
                betweenInvalid: 'عامل المقارنة بين يتطلب حدًا أدنى وأقصى صالحين',
                betweenOrder: 'لا يمكن أن يكون الحد الأدنى أكبر من الحد الأقصى',
                regexRequired: 'عامل المقارنة للتعبير النمطي يتطلب نمطًا',
                regexInvalid: 'تعبير نمطي غير صالح: {message}',
                numericRequired: 'عوامل المقارنة العددية تتطلب رقمًا صالحًا'
            }
        },
        sort: {
            title: 'فرز متقدم',
            addRule: '+ إضافة قاعدة فرز',
            direction: {
                asc: 'تصاعدي',
                desc: 'تنازلي'
            },
            type: {
                auto: 'اكتشاف تلقائي',
                number: 'رقم',
                text: 'نص',
                date: 'تاريخ',
                percent: 'نسبة مئوية',
                duration: 'مدة',
                mass: 'كتلة',
                length: 'طول',
                area: 'مساحة',
                volume: 'حجم',
                speed: 'سرعة',
                temperature: 'درجة حرارة',
                pressure: 'ضغط',
                energy: 'طاقة',
                power: 'قدرة',
                voltage: 'جهد',
                current: 'تيار',
                resistance: 'مقاومة',
                frequency: 'تردد',
                dataSize: 'حجم البيانات',
                bitrate: 'معدل البت'
            },
            typeButton: {
                autoFormat: 'تلقائي: {type}'
            },
            typePopup: {
                searchPlaceholder: 'ابحث عن النوع...'
            },
            hint: {
                keepOneRule: 'يلزم قاعدة فرز واحدة على الأقل.',
                resetDone: 'تمت إعادة تعيين الفرز المتقدم.',
                needOneRule: 'أضف قاعدة فرز واحدة على الأقل.',
                multiColumnAuto: 'سيتم تفعيل الفرز متعدد الأعمدة عند التطبيق.',
                allColumnsUsed: 'كل الأعمدة لديها قواعد فرز بالفعل.'
            },
            errors: {
                invalidColumn: 'اختيار عمود غير صالح'
            }
        },
        statistics: {
            title: 'إحصاءات',
            addRule: '+ إضافة قاعدة إحصائية',
            type: {
                count: 'عدد',
                sum: 'مجموع',
                average: 'متوسط',
                median: 'وسيط',
                min: 'أدنى',
                max: 'أقصى',
                range: 'مدى',
                variance: 'تباين',
                stddev: 'انحراف معياري'
            },
            hint: {
                keepOneRule: 'يلزم قاعدة إحصائية واحدة على الأقل.',
                resetDone: 'تمت إعادة تعيين إعدادات الإحصاءات.',
                needOneRule: 'أضف قاعدة إحصائية واحدة على الأقل.',
                duplicateRule: 'توجد قاعدة بنفس العمود والنوع بالفعل.'
            }
        }
    },

    errors: {
        failedToLoad: 'فشل التحميل',
        failedToSave: 'فشل الحفظ',
        networkError: 'خطأ في الشبكة',
        unknownError: 'خطأ غير معروف'
    }
};

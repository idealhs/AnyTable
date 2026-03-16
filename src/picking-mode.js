export class PickingMode {
    constructor({ enhancedTables, selectedTables, enhanceTable, removeEnhancement }) {
        this.enhancedTables = enhancedTables;
        this.selectedTables = selectedTables;
        this.enhanceTable = enhanceTable;
        this.removeEnhancement = removeEnhancement;
        this.isPicking = false;
        this.originalTableStyles = new WeakMap();

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    startPicking() {
        this.isPicking = true;
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('click', this.handleClick);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    handleMouseMove(e) {
        if (!this.isPicking) return;

        const table = this.findTableUnderCursor(e);
        if (table) {
            document.querySelectorAll('.anytable-pickable').forEach(t => {
                if (t !== table) {
                    t.classList.remove('anytable-pickable');
                    this.syncHighlightStyles(t);
                }
            });
            table.classList.add('anytable-pickable');
            this.syncHighlightStyles(table);
        }
    }

    handleClick(e) {
        if (!this.isPicking) return;

        const table = this.findTableUnderCursor(e);
        if (table) {
            e.preventDefault();
            e.stopPropagation();

            if (this.selectedTables.has(table)) {
                this.selectedTables.delete(table);
                table.classList.remove('anytable-picked');
            } else {
                this.selectedTables.add(table);
                table.classList.add('anytable-picked');
                this.enhanceTable(table);
            }
            this.syncHighlightStyles(table);
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Escape' && this.isPicking) {
            this.stopPicking();
        }
    }

    stopPicking() {
        this.isPicking = false;
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('click', this.handleClick);
        document.removeEventListener('keydown', this.handleKeyDown);

        document.querySelectorAll('.anytable-pickable').forEach(table => {
            if (!this.selectedTables.has(table)) {
                table.classList.remove('anytable-pickable');
                this.syncHighlightStyles(table);
            }
        });
    }

    clearSelection() {
        this.selectedTables.forEach(table => {
            table.classList.remove('anytable-picked');
            this.syncHighlightStyles(table);
            this.removeEnhancement(table);
        });
        this.selectedTables.clear();
        this.stopPicking();
    }

    findTableUnderCursor(e) {
        let element = e.target;
        while (element && element.tagName !== 'TABLE') {
            element = element.parentElement;
        }
        return element;
    }

    syncHighlightStyles(table) {
        if (!table) {
            return;
        }

        if (!this.originalTableStyles.has(table)) {
            this.originalTableStyles.set(table, {
                cursor: table.style.cursor,
                outline: table.style.outline,
                outlineOffset: table.style.outlineOffset
            });
        }

        const original = this.originalTableStyles.get(table);
        const isPickable = table.classList.contains('anytable-pickable');
        const isPicked = table.classList.contains('anytable-picked');

        table.style.cursor = isPickable ? 'pointer' : original.cursor;

        if (isPicked) {
            table.style.outline = '2px solid #4a90e2';
            table.style.outlineOffset = '2px';
            return;
        }

        if (isPickable) {
            table.style.outline = '2px dashed #4a90e2';
            table.style.outlineOffset = '2px';
            return;
        }

        table.style.outline = original.outline;
        table.style.outlineOffset = original.outlineOffset;
        if (!table.style.cursor && original.cursor === '') {
            table.style.removeProperty('cursor');
        }
    }
}

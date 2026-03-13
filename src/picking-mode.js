export class PickingMode {
    constructor({ enhancedTables, selectedTables, enhanceTable, removeEnhancement }) {
        this.enhancedTables = enhancedTables;
        this.selectedTables = selectedTables;
        this.enhanceTable = enhanceTable;
        this.removeEnhancement = removeEnhancement;
        this.isPicking = false;

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
                if (t !== table) t.classList.remove('anytable-pickable');
            });
            table.classList.add('anytable-pickable');
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
            }
        });
    }

    clearSelection() {
        this.selectedTables.forEach(table => {
            table.classList.remove('anytable-picked');
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
}

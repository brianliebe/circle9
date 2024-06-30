export type CellState = "circled" | "crossed" | "none";

export type CellValue = {
  value: string;
  state: CellState;
  row: number;
  col: number;
  hint: boolean;
};

export type MoveResult = {
  grid: CellValue[][];
  explanation: string;
};

export function solve(grid: CellValue[][]): [CellValue[][], string[]] {
  grid.forEach((row) =>
    row.forEach((cell) => {
      cell.hint = false;
    }),
  );

  const explanations: string[] = [];

  let iterations = 0;
  while (iterations < 50) {
    iterations += 1;

    const step1 = checkSingleCandidateForGroup(grid);
    if (step1 && gridChanged(step1.grid, grid)) {
      grid = step1.grid;
      explanations.push(step1.explanation);
      continue;
    }

    const step2 = checkSingleCandidateForNumber(grid);
    if (step2 && gridChanged(step2.grid, grid)) {
      grid = step2.grid;
      explanations.push(step2.explanation);
      continue;
    }

    const step3 = checkSingleGroupForNumber(grid);
    if (step3 && gridChanged(step3.grid, grid)) {
      grid = step3.grid;
      explanations.push(step3.explanation);
      continue;
    }

    const step4 = checkSingleNumberInGroup(grid);
    if (step4 && gridChanged(step4.grid, grid)) {
      grid = step4.grid;
      explanations.push(step4.explanation);
      continue;
    }

    const step5 = checkAllBlockCellsAreInSameRowOrColumn(grid);
    if (step5 && gridChanged(step5.grid, grid)) {
      grid = step5.grid;
      explanations.push(step5.explanation);
      continue;
    }

    const step6 = checkAllRowOrColumnCellsAreInSameblock(grid);
    if (step6 && gridChanged(step6.grid, grid)) {
      grid = step6.grid;
      explanations.push(step6.explanation);
      continue;
    }

    const step7 = checkCellSeesAllCandidatesOfNumber(grid);
    if (step7 && gridChanged(step7.grid, grid)) {
      grid = step7.grid;
      explanations.push(step7.explanation);
      continue;
    }

    const step8 = checkCellSeesAllCandidatesOfGroup(grid);
    if (step8 && gridChanged(step8.grid, grid)) {
      grid = step8.grid;
      explanations.push(step8.explanation);
      continue;
    }

    const step9 = checkMatchingPairs(grid);
    if (step9 && gridChanged(step9.grid, grid)) {
      grid = step9.grid;
      explanations.push(step9.explanation);
      continue;
    }

    if (checkDone(grid)) {
      explanations.push("Done");
      return [grid, explanations];
    } else {
      explanations.push("Unknown next move");
      return [grid, explanations];
    }
  }
  explanations.push("Caught in loop, unknown next move");
  return [grid, explanations];
}

export function hint(grid: CellValue[][]): [CellValue[][], string] {
  grid.forEach((row) =>
    row.forEach((cell) => {
      cell.hint = false;
    }),
  );

  const done = checkDone(grid);
  if (done) {
    return [grid, "Done"];
  }

  const step1 = checkSingleCandidateForGroup(grid);
  if (step1 && gridChanged(step1.grid, grid)) {
    return [step1.grid, step1.explanation];
  }

  const step2 = checkSingleCandidateForNumber(grid);
  if (step2 && gridChanged(step2.grid, grid)) {
    return [step2.grid, step2.explanation];
  }

  const step3 = checkSingleGroupForNumber(grid);
  if (step3 && gridChanged(step3.grid, grid)) {
    return [step3.grid, step3.explanation];
  }

  const step4 = checkSingleNumberInGroup(grid);
  if (step4 && gridChanged(step4.grid, grid)) {
    return [step4.grid, step4.explanation];
  }

  const step5 = checkAllBlockCellsAreInSameRowOrColumn(grid);
  if (step5 && gridChanged(step5.grid, grid)) {
    return [step5.grid, step5.explanation];
  }

  const step6 = checkAllRowOrColumnCellsAreInSameblock(grid);
  if (step6 && gridChanged(step6.grid, grid)) {
    return [step6.grid, step6.explanation];
  }

  const step7 = checkCellSeesAllCandidatesOfNumber(grid);
  if (step7 && gridChanged(step7.grid, grid)) {
    return [step7.grid, step7.explanation];
  }

  const step8 = checkCellSeesAllCandidatesOfGroup(grid);
  if (step8 && gridChanged(step8.grid, grid)) {
    return [step8.grid, step8.explanation];
  }

  const step9 = checkMatchingPairs(grid);
  if (step9 && gridChanged(step9.grid, grid)) {
    return [step9.grid, step9.explanation];
  }

  return [grid, "Unknown next move"];
}

function checkDone(grid: CellValue[][]): boolean {
  for (let i = 0; i < 9; i++) {
    const rowCells = getCellsInRow(i, grid);
    if (rowCells.filter((c) => c.state === "circled").length !== 1) {
      // a row with more than 1 circled value
      return false;
    } else if (
      rowCells.filter((c) => c.state === "none" && c.value !== "").length > 1
    ) {
      // a row with uncrossed candidates
      return false;
    }
  }

  for (let j = 0; j < 9; j++) {
    const colCells = getCellsInColumn(j, grid);
    if (colCells.filter((c) => c.state === "circled").length !== 1) {
      // a column with more than 1 circled value
      return false;
    } else if (
      colCells.filter((c) => c.state === "none" && c.value !== "").length > 1
    ) {
      // a column with uncrossed candidates
      return false;
    }
  }

  for (let b = 0; b < 9; b++) {
    const blockCells = getCellsInBlock(b, grid);
    if (blockCells.filter((c) => c.state === "circled").length !== 1) {
      // a block with more than 1 circled value
      return false;
    } else if (
      blockCells.filter((c) => c.state === "none" && c.value !== "").length > 1
    ) {
      // a block with uncrossed candidates
      return false;
    }
  }

  return true;
}

function checkSingleCandidateForGroup(grid: CellValue[][]): MoveResult | null {
  const newCircled: CellValue[] = [];
  const newCrossed: CellValue[] = [];

  // rows
  for (let i = 0; i < 9; i++) {
    const totalCandidates = getCellsInRow(i, grid).filter(isCandidate);
    if (totalCandidates.length === 1) {
      totalCandidates[0].hint = true;
      newCircled.push(totalCandidates[0]);
      newCrossed.push(...getSeenCells(totalCandidates[0], grid));
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `Single candidate (${totalCandidates[0].value}) in row ${
          i + 1
        }`,
      };
    }
  }

  // columns
  for (let j = 0; j < 9; j++) {
    const totalCandidates = getCellsInColumn(j, grid).filter(isCandidate);
    if (totalCandidates.length === 1) {
      totalCandidates[0].hint = true;
      newCircled.push(totalCandidates[0]);
      newCrossed.push(...getSeenCells(totalCandidates[0], grid));
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `Single candidate (${
          totalCandidates[0].value
        }) in column ${j + 1}`,
      };
    }
  }

  // blocks
  for (let b = 0; b < 9; b++) {
    const totalCandidates = getCellsInBlock(b, grid).filter(isCandidate);
    if (totalCandidates.length === 1) {
      totalCandidates[0].hint = true;
      newCircled.push(totalCandidates[0]);
      newCrossed.push(...getSeenCells(totalCandidates[0], grid));
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `Single candidate (${totalCandidates[0].value}) in block ${
          b + 1
        }`,
      };
    }
  }

  return null;
}

function checkSingleCandidateForNumber(grid: CellValue[][]): MoveResult | null {
  const newCircled: CellValue[] = [];
  const newCrossed: CellValue[] = [];

  // values
  for (let v = 0; v < 9; v++) {
    const totalCandidates = getCellsWithValue((v + 1).toString(), grid).filter(
      isCandidate,
    );
    if (totalCandidates.length === 1) {
      totalCandidates[0].hint = true;
      newCircled.push(totalCandidates[0]);
      newCrossed.push(...getSeenCells(totalCandidates[0], grid));
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `Single candidate for value (${totalCandidates[0].value})`,
      };
    }
  }

  return null;
}

function checkSingleGroupForNumber(grid: CellValue[][]): MoveResult | null {
  const newCircled: CellValue[] = [];
  const newCrossed: CellValue[] = [];

  // rows
  const rowValues: string[][] = [];
  for (let i = 0; i < 9; i++) {
    rowValues.push(getUniqueValues(getCellsInRow(i, grid).filter(isCandidate)));
  }
  for (let i = 0; i < 9; i++) {
    const unique = rowValues[i].filter(
      (v) =>
        !rowValues.some((row, rowIndex) => i !== rowIndex && row.includes(v)),
    );
    if (unique.length > 0) {
      newCrossed.push(
        ...getCellsInRow(i, grid)
          .filter(isCandidate)
          .filter((cell) => cell.value !== unique[0]),
      );
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `Unique value (${unique[0]}) in row ${i + 1}`,
      };
    }
  }

  // columns
  const colValues: string[][] = [];
  for (let j = 0; j < 9; j++) {
    colValues.push(
      getUniqueValues(getCellsInColumn(j, grid).filter(isCandidate)),
    );
  }
  for (let j = 0; j < 9; j++) {
    const unique = colValues[j].filter(
      (v) =>
        !colValues.some((col, colIndex) => j !== colIndex && col.includes(v)),
    );
    if (unique.length > 0) {
      newCrossed.push(
        ...getCellsInColumn(j, grid)
          .filter(isCandidate)
          .filter((cell) => cell.value !== unique[0]),
      );
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `Unique value (${unique[0]}) in column ${j + 1}`,
      };
    }
  }

  // blocks
  const blockValues: string[][] = [];
  for (let b = 0; b < 9; b++) {
    blockValues.push(
      getUniqueValues(getCellsInBlock(b, grid).filter(isCandidate)),
    );
  }
  for (let b = 0; b < 9; b++) {
    const unique = blockValues[b].filter(
      (v) =>
        !blockValues.some(
          (block, blockIndex) => b !== blockIndex && block.includes(v),
        ),
    );
    if (unique.length > 0) {
      newCrossed.push(
        ...getCellsInBlock(b, grid)
          .filter(isCandidate)
          .filter((cell) => cell.value !== unique[0]),
      );
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `Unique value (${unique[0]}) in block ${b + 1}`,
      };
    }
  }

  return null;
}

function checkSingleNumberInGroup(grid: CellValue[][]): MoveResult | null {
  const newCircled: CellValue[] = [];
  const newCrossed: CellValue[] = [];

  // rows
  for (let i = 0; i < 9; i++) {
    const unique = getUniqueValues(getCellsInRow(i, grid).filter(isCandidate));
    if (unique.length === 1) {
      newCrossed.push(
        ...getCellsWithValue(unique[0], grid)
          .filter(isCandidate)
          .filter((cell) => cell.row !== i),
      );
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `Single value (${unique[0]}) in row ${i + 1}`,
      };
    }
  }

  // columns
  for (let j = 0; j < 9; j++) {
    const unique = getUniqueValues(
      getCellsInColumn(j, grid).filter(isCandidate),
    );
    if (unique.length === 1) {
      newCrossed.push(
        ...getCellsWithValue(unique[0], grid)
          .filter(isCandidate)
          .filter((cell) => cell.col !== j),
      );
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `Single value (${unique[0]}) in column ${j + 1}`,
      };
    }
  }

  // blocks
  for (let b = 0; b < 9; b++) {
    const unique = getUniqueValues(
      getCellsInBlock(b, grid).filter(isCandidate),
    );
    if (unique.length === 1) {
      newCrossed.push(
        ...getCellsWithValue(unique[0], grid)
          .filter(isCandidate)
          .filter((cell) => getblockIndex(cell) !== b),
      );
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `Single value (${unique[0]}) in block ${b + 1}`,
      };
    }
  }

  return null;
}

function checkAllBlockCellsAreInSameRowOrColumn(
  grid: CellValue[][],
): MoveResult | null {
  const newCircled: CellValue[] = [];
  const newCrossed: CellValue[] = [];

  for (let b = 0; b < 9; b++) {
    const cells = getCellsInBlock(b, grid).filter(isCandidate);

    const rows = getUniqueRowIndexes(cells);
    if (rows.length === 1) {
      newCrossed.push(
        ...getCellsInRow(rows[0], grid)
          .filter(isCandidate)
          .filter((cell) => getblockIndex(cell) !== b),
      );
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `All cells in block ${b + 1} are in the same row (${
          rows[0] + 1
        })`,
      };
    }

    const cols = getUniqueColumnIndexes(cells);
    if (cols.length === 1) {
      newCrossed.push(
        ...getCellsInColumn(cols[0], grid)
          .filter(isCandidate)
          .filter((cell) => getblockIndex(cell) !== b),
      );
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `All cells in block ${b + 1} are in the same column (${
          cols[0] + 1
        })`,
      };
    }
  }

  return null;
}

function checkAllRowOrColumnCellsAreInSameblock(
  grid: CellValue[][],
): MoveResult | null {
  const newCircled: CellValue[] = [];
  const newCrossed: CellValue[] = [];

  // rows
  for (let i = 0; i < 9; i++) {
    const blocks = getUniqueblockIndexes(
      getCellsInRow(i, grid).filter(isCandidate),
    );
    if (blocks.length === 1) {
      newCrossed.push(
        ...getCellsInBlock(blocks[0], grid)
          .filter(isCandidate)
          .filter((cell) => cell.row !== i),
      );
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `All row (${i + 1}) cells are in the same block (${
          blocks[0] + 1
        })`,
      };
    }
  }

  // columns
  for (let j = 0; j < 9; j++) {
    const blocks = getUniqueblockIndexes(
      getCellsInColumn(j, grid).filter(isCandidate),
    );
    if (blocks.length === 1) {
      newCrossed.push(
        ...getCellsInBlock(blocks[0], grid)
          .filter(isCandidate)
          .filter((cell) => cell.col !== j),
      );
      return {
        grid: applyStates(newCircled, newCrossed, grid),
        explanation: `All column (${j + 1}) cells are in the same block (${
          blocks[0] + 1
        })`,
      };
    }
  }

  return null;
}

function checkCellSeesAllCandidatesOfNumber(
  grid: CellValue[][],
): MoveResult | null {
  const newCircled: CellValue[] = [];
  const newCrossed: CellValue[] = [];

  for (let v = 0; v < 9; v++) {
    const candidates = getCellsWithValue((v + 1).toString(), grid).filter(
      isCandidate,
    );
    const candidatesSeen = candidates.map((cell) =>
      getSeenCells(cell, grid).filter(isCandidate),
    );
    if (candidatesSeen.length > 0) {
      const matches = candidatesSeen[0].filter((seen) =>
        candidatesSeen.every((seenByGroupMember) =>
          seenByGroupMember.some(
            (cell) => seen.col === cell.col && seen.row === cell.row,
          ),
        ),
      );
      if (matches.length > 0) {
        newCrossed.push(...matches);
        return {
          grid: applyStates(newCircled, newCrossed, grid),
          explanation: `Cell(s) see all candidates of value (${v + 1})`,
        };
      }
    }
  }

  return null;
}

function checkCellSeesAllCandidatesOfGroup(
  grid: CellValue[][],
): MoveResult | null {
  const newCircled: CellValue[] = [];
  const newCrossed: CellValue[] = [];

  // rows
  for (let i = 0; i < 9; i++) {
    const candidates = getCellsInRow(i, grid).filter(isCandidate);
    const candidatesSeen = candidates.map((cell) =>
      getSeenCells(cell, grid).filter(isCandidate),
    );
    if (candidatesSeen.length > 0) {
      const matches = candidatesSeen[0].filter((seen) =>
        candidatesSeen.every((seenByGroupMember) =>
          seenByGroupMember.some(
            (cell) => seen.col === cell.col && seen.row === cell.row,
          ),
        ),
      );
      if (matches.length > 0) {
        newCrossed.push(...matches);
        return {
          grid: applyStates(newCircled, newCrossed, grid),
          explanation: `Cells see all candidates of row ${i + 1}`,
        };
      }
    }
  }

  // columns
  for (let j = 0; j < 9; j++) {
    const candidates = getCellsInColumn(j, grid).filter(isCandidate);
    const candidatesSeen = candidates.map((cell) =>
      getSeenCells(cell, grid).filter(isCandidate),
    );
    if (candidatesSeen.length > 0) {
      const matches = candidatesSeen[0].filter((seen) =>
        candidatesSeen.every((seenByGroupMember) =>
          seenByGroupMember.some(
            (cell) => seen.col === cell.col && seen.row === cell.row,
          ),
        ),
      );
      if (matches.length > 0) {
        newCrossed.push(...matches);
        return {
          grid: applyStates(newCircled, newCrossed, grid),
          explanation: `Cells see all candidates of column ${j + 1}`,
        };
      }
    }
  }

  // blocks
  for (let b = 0; b < 9; b++) {
    const candidates = getCellsInBlock(b, grid).filter(isCandidate);
    const candidatesSeen = candidates.map((cell) =>
      getSeenCells(cell, grid).filter(isCandidate),
    );
    if (candidatesSeen.length > 0) {
      const matches = candidatesSeen[0].filter((seen) =>
        candidatesSeen.every((seenByGroupMember) =>
          seenByGroupMember.some(
            (cell) => seen.col === cell.col && seen.row === cell.row,
          ),
        ),
      );
      if (matches.length > 0) {
        newCrossed.push(...matches);
        return {
          grid: applyStates(newCircled, newCrossed, grid),
          explanation: `Cells see all candidates of block ${b + 1}`,
        };
      }
    }
  }

  return null;
}

function checkMatchingPairs(grid: CellValue[][]): MoveResult | null {
  const newCircled: CellValue[] = [];
  const newCrossed: CellValue[] = [];

  const groups: {
    id: string;
    cells: CellValue[];
    values: string[];
    possiblePairs: string[][];
  }[] = [];

  // rows
  for (let i = 0; i < 9; i++) {
    const cells = getCellsInRow(i, grid).filter(isNotCrossed);
    const uniqueValues = getUniqueValues(cells).sort();
    const possiblePairs = getPossiblePairs(uniqueValues);
    groups.push({
      id: `row ${i + 1}`,
      cells: cells,
      values: uniqueValues,
      possiblePairs: possiblePairs,
    });
  }

  // columns
  for (let j = 0; j < 9; j++) {
    const cells = getCellsInColumn(j, grid).filter(isNotCrossed);
    const uniqueValues = getUniqueValues(cells).sort();
    const possiblePairs = getPossiblePairs(uniqueValues);
    groups.push({
      id: `column ${j + 1}`,
      cells: cells,
      values: uniqueValues,
      possiblePairs: possiblePairs,
    });
  }

  // blocks
  for (let b = 0; b < 9; b++) {
    const cells = getCellsInBlock(b, grid).filter(isNotCrossed);
    const uniqueValues = getUniqueValues(cells).sort();
    const possiblePairs = getPossiblePairs(uniqueValues);
    groups.push({
      id: `block ${b + 1}`,
      cells: cells,
      values: uniqueValues,
      possiblePairs: possiblePairs,
    });
  }

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    for (let pp = 0; pp < group.possiblePairs.length; pp++) {
      const pair = group.possiblePairs[pp];
      const matches = groups.filter(
        (otherGroup, i) =>
          i !== g &&
          otherGroup.possiblePairs.some(
            (otherPair) =>
              pair.length === otherPair.length &&
              pair.every((v, j) => v === otherPair[j]) &&
              !group.cells.some((c) =>
                otherGroup.cells.some(
                  (oc) => oc.col === c.col && oc.row === c.row,
                ),
              ),
          ),
      );
      const allGroups = [group, ...matches];
      const reusingValue = allGroups.some((gr, i) =>
        allGroups.some(
          (ogr, j) =>
            i !== j &&
            gr.cells.some((gc) =>
              ogr.cells.some((ogc) => ogc.col === gc.col && ogc.row === gc.row),
            ),
        ),
      );

      if (!reusingValue && pair.length === matches.length + 1) {
        const valuesOutsidePairs: CellValue[] = [];
        pair.forEach((p) => {
          valuesOutsidePairs.push(
            ...getCellsWithValue(p, grid)
              .filter(isCandidate)
              .filter(
                (cell) =>
                  !allGroups.some((gr) =>
                    gr.cells.some(
                      (c) => cell.col === c.col && cell.row === c.row,
                    ),
                  ),
              ),
          );
        });
        if (valuesOutsidePairs.length > 0) {
          const pairGroups = [group.id, ...matches.map((m) => m.id)];
          newCrossed.push(...valuesOutsidePairs);
          return {
            grid: applyStates(newCircled, newCrossed, grid),
            explanation: `Matching pairs ${group.values.join(
              ", ",
            )} for groups: ${pairGroups.join(", ")}`,
          };
        }
      }
    }
  }

  return null;
}

/* HELPERS */

function applyStates(
  circled: CellValue[],
  crossed: CellValue[],
  grid: CellValue[][],
): CellValue[][] {
  const gridCopy = JSON.parse(JSON.stringify(grid));
  circled.forEach((cell) => (gridCopy[cell.row][cell.col].state = "circled"));
  crossed.forEach((cell) => (gridCopy[cell.row][cell.col].state = "crossed"));
  return gridCopy;
}

function getSeenCells(cell: CellValue, grid: CellValue[][]): CellValue[] {
  const colCells = getCellsInColumn(cell.col, grid);
  const rowCells = getCellsInRow(cell.row, grid);
  const blockCells = getCellsInBlock(getblockIndex(cell), grid);
  const valueCells = getCellsWithValue(cell.value, grid);

  return [...colCells, ...rowCells, ...blockCells, ...valueCells]
    .filter(isCandidate)
    .filter((x) => notMatch(x, cell));
}

function getblockIndex(cell: CellValue): number {
  return Math.floor(cell.row / 3) * 3 + Math.floor(cell.col / 3);
}

function getCellsInBlock(blockIndex: number, grid: CellValue[][]): CellValue[] {
  const blockCells: CellValue[] = [];
  const startRow = Math.floor(blockIndex / 3) * 3;
  const startCol = (blockIndex % 3) * 3;
  for (let i = startRow; i < startRow + 3; i++) {
    for (let j = startCol; j < startCol + 3; j++) {
      blockCells.push(grid[i][j]);
    }
  }
  return blockCells;
}

function getCellsInRow(rowIndex: number, grid: CellValue[][]): CellValue[] {
  const colCells: CellValue[] = [];
  for (let j = 0; j < 9; j++) {
    colCells.push(grid[rowIndex][j]);
  }
  return colCells;
}

function getCellsInColumn(colIndex: number, grid: CellValue[][]): CellValue[] {
  const colCells: CellValue[] = [];
  for (let i = 0; i < 9; i++) {
    colCells.push(grid[i][colIndex]);
  }
  return colCells;
}

function getCellsWithValue(value: string, grid: CellValue[][]): CellValue[] {
  const valueCells: CellValue[] = [];
  grid.forEach((row) =>
    row.forEach((cell) => {
      if (cell.value === value) {
        valueCells.push(cell);
      }
    }),
  );
  return valueCells;
}

function getUniqueValues(list: CellValue[]): string[] {
  return Array.from(new Set(list.map((cell) => cell.value)));
}

function getUniqueRowIndexes(list: CellValue[]): number[] {
  return Array.from(new Set(list.map((cell) => cell.row)));
}

function getUniqueColumnIndexes(list: CellValue[]): number[] {
  return Array.from(new Set(list.map((cell) => cell.col)));
}

function getUniqueblockIndexes(list: CellValue[]): number[] {
  return Array.from(new Set(list.map((cell) => getblockIndex(cell))));
}

function getPossiblePairs(list: string[]): string[][] {
  const possiblePairs: string[][] = [list];
  if (list.length !== 2 && list.length !== 3) {
    return possiblePairs;
  }
  for (let a = 0; a < 9; a++) {
    if (!list.includes((a + 1).toString())) {
      // create list + n
      const listA = [...list, (a + 1).toString()].sort();
      possiblePairs.push(listA);

      if (list.length === 2) {
        for (let b = 0; b < 9; b++) {
          if (!listA.includes((b + 1).toString())) {
            // create list + n + m, for length 2 lists
            const listB = [...listA, (b + 1).toString()].sort();
            possiblePairs.push(listB);
          }
        }
      }
    }
  }
  return possiblePairs;
}

function isCandidate(cell: CellValue): boolean {
  return cell.state !== "crossed" && cell.state !== "circled" && !!cell.value;
}

function isNotCrossed(cell: CellValue): boolean {
  return cell.state !== "crossed" && !!cell.value;
}

function notMatch(candidate: CellValue, cell: CellValue): boolean {
  return (
    candidate.value !== cell.value ||
    candidate.row !== cell.row ||
    candidate.col !== cell.col
  );
}

function gridChanged(gridA: CellValue[][], gridB: CellValue[][]): boolean {
  return JSON.stringify(gridA) !== JSON.stringify(gridB);
}

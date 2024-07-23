import { CellValue, MatchGroup, MatchGroupCombo, MoveResult } from "./types";

export async function solve(grid: CellValue[][]): Promise<[CellValue[][], string[]]> {
  grid.forEach((row) =>
    row.forEach((cell) => {
      cell.recent = false;
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

    const step6 = checkAllRowOrColumnCellsAreInSameBlock(grid);
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
      grid.forEach((r) => r.forEach((c) => (c.recent = false)));
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
      cell.recent = false;
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

  const step6 = checkAllRowOrColumnCellsAreInSameBlock(grid);
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

/**
 * Single candidate cell found in a group, circle the candidate
 */
function checkSingleCandidateForGroup(grid: CellValue[][]): MoveResult | null {
  // rows
  for (let i = 0; i < 9; i++) {
    const allCandidates = getCellsInRow(i, grid).filter(isCandidate);
    if (allCandidates.length === 1) {
      const cell = allCandidates[0];
      const newCircled = [cell];
      const newCrossed = [...getSeenCells(cell, grid)];
      const newRelevant = [
        ...getCellsInRow(i, grid),
        ...getAllSeenCells(cell, grid),
      ];
      return {
        grid: applyStates(newCircled, newCrossed, newRelevant, grid),
        explanation: `Single candidate in ${toCodeGroup("Row", i + 1)}`,
      };
    }
  }

  // columns
  for (let j = 0; j < 9; j++) {
    const allCandidates = getCellsInColumn(j, grid).filter(isCandidate);
    if (allCandidates.length === 1) {
      const cell = allCandidates[0];
      const newCircled = [cell];
      const newCrossed = [...getSeenCells(cell, grid)];
      const newRelevant = [
        ...getCellsInColumn(j, grid),
        ...getAllSeenCells(cell, grid),
      ];
      return {
        grid: applyStates(newCircled, newCrossed, newRelevant, grid),
        explanation: `Single candidate in ${toCodeGroup("Column", j + 1)}`,
      };
    }
  }

  // blocks
  for (let b = 0; b < 9; b++) {
    const allCandidates = getCellsInBlock(b, grid).filter(isCandidate);
    if (allCandidates.length === 1) {
      const cell = allCandidates[0];
      const newCircled = [cell];
      const newCrossed = [...getSeenCells(cell, grid)];
      const newRelevant = [
        ...getCellsInBlock(b, grid),
        ...getAllSeenCells(cell, grid),
      ];
      return {
        grid: applyStates(newCircled, newCrossed, newRelevant, grid),
        explanation: `Single candidate in ${toCodeGroup("Block", b + 1)}`,
      };
    }
  }

  return null;
}

/**
 * Single candidate for a number, circle the candidate
 */
function checkSingleCandidateForNumber(grid: CellValue[][]): MoveResult | null {
  // values
  for (let v = 0; v < 9; v++) {
    const value = (v + 1).toString();
    const allCandidates = getCellsWithValue(value, grid).filter(isCandidate);
    if (allCandidates.length === 1) {
      const cell = allCandidates[0];
      const newCircled = [cell];
      const newCrossed = [...getSeenCells(cell, grid)];
      const newRelevant = getAllSeenCells(cell, grid);
      return {
        grid: applyStates(newCircled, newCrossed, newRelevant, grid),
        explanation: `Single candidate for ${toCodeValue(
          cell.value,
        )} in the puzzle`,
      };
    }
  }

  return null;
}

/**
 * Number found in only one group, eliminate all other cells in group
 */
function checkSingleGroupForNumber(grid: CellValue[][]): MoveResult | null {
  // rows
  const rowValues: string[][] = [];
  for (let i = 0; i < 9; i++) {
    rowValues.push(getUniqueValues(getCellsInRow(i, grid).filter(isCandidate)));
  }
  for (let i = 0; i < 9; i++) {
    const unique = rowValues[i].filter(
      (v) => !rowValues.some((row, idx) => i !== idx && row.includes(v)),
    );
    for (let u = 0; u < unique.length; u++) {
      const uniqueValue = unique[u];
      const crossedCandidates = getCellsInRow(i, grid)
        .filter(isCandidate)
        .filter((cell) => cell.value !== uniqueValue);
      const uniqueCandidates = getCellsInRow(i, grid)
        .filter(isCandidate)
        .filter((cell) => cell.value === uniqueValue);
      if (crossedCandidates.length > 0) {
        const newCrossed = [...crossedCandidates];
        const newRelevant = [...uniqueCandidates, ...getCellsInRow(i, grid)];
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `Single group for ${toCodeValue(
            unique[0],
          )}, in ${toCodeGroup("Row", i + 1)}`,
        };
      }
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
      (v) => !colValues.some((col, idx) => j !== idx && col.includes(v)),
    );
    for (let u = 0; u < unique.length; u++) {
      const uniqueValue = unique[u];
      const crossedCandidates = getCellsInColumn(j, grid)
        .filter(isCandidate)
        .filter((cell) => cell.value !== uniqueValue);
      const uniqueCandidates = getCellsInColumn(j, grid)
        .filter(isCandidate)
        .filter((cell) => cell.value === uniqueValue);
      if (crossedCandidates.length > 0) {
        const newCrossed = [...crossedCandidates];
        const newRelevant = [...uniqueCandidates, ...getCellsInColumn(j, grid)];
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `Single group for ${toCodeValue(
            unique[0],
          )}, in ${toCodeGroup("Column", j + 1)}`,
        };
      }
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
      (v) => !blockValues.some((block, idx) => b !== idx && block.includes(v)),
    );
    for (let u = 0; u < unique.length; u++) {
      const uniqueValue = unique[u];
      const crossedCandidates = getCellsInBlock(b, grid)
        .filter(isCandidate)
        .filter((cell) => cell.value !== uniqueValue);
      const uniqueCandidates = getCellsInBlock(b, grid)
        .filter(isCandidate)
        .filter((cell) => cell.value === uniqueValue);
      if (crossedCandidates.length > 0) {
        const newCrossed = [...crossedCandidates];
        const newRelevant = [...uniqueCandidates, ...getCellsInBlock(b, grid)];
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `Single group for ${toCodeValue(
            unique[0],
          )}, in ${toCodeGroup("Block", b + 1)}`,
        };
      }
    }
  }

  return null;
}

/**
 * Single number in a group, eliminate all other candidates with this number
 */
function checkSingleNumberInGroup(grid: CellValue[][]): MoveResult | null {
  // rows
  for (let i = 0; i < 9; i++) {
    const unique = getUniqueValues(getCellsInRow(i, grid).filter(isCandidate));
    if (unique.length === 1) {
      const uniqueValue = unique[0];
      const crossedCandidates = getCellsWithValue(uniqueValue, grid)
        .filter(isCandidate)
        .filter((cell) => cell.row !== i);
      if (crossedCandidates.length > 0) {
        const newRelevant = getCellsInRow(i, grid);
        const newCrossed = [...crossedCandidates];
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `Only number ${toCodeValue(
            uniqueValue,
          )} in group ${toCodeGroup("Row", i + 1)}`,
        };
      }
    }
  }

  // columns
  for (let j = 0; j < 9; j++) {
    const unique = getUniqueValues(
      getCellsInColumn(j, grid).filter(isCandidate),
    );
    if (unique.length === 1) {
      const uniqueValue = unique[0];
      const crossedCandidates = getCellsWithValue(uniqueValue, grid)
        .filter(isCandidate)
        .filter((cell) => cell.col !== j);
      if (crossedCandidates.length > 0) {
        const newRelevant = getCellsInColumn(j, grid);
        const newCrossed = [...crossedCandidates];
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `Only number ${toCodeValue(
            uniqueValue,
          )} in group ${toCodeGroup("Column", j + 1)}`,
        };
      }
    }
  }

  // blocks
  for (let b = 0; b < 9; b++) {
    const unique = getUniqueValues(
      getCellsInBlock(b, grid).filter(isCandidate),
    );
    if (unique.length === 1) {
      const uniqueValue = unique[0];
      const crossedCandidates = getCellsWithValue(uniqueValue, grid)
        .filter(isCandidate)
        .filter((cell) => getBlockIndex(cell) !== b);
      if (crossedCandidates.length > 0) {
        const newRelevant = getCellsInBlock(b, grid);
        const newCrossed = [...crossedCandidates];
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `Only number ${toCodeValue(
            uniqueValue,
          )} in group ${toCodeGroup("Block", b + 1)}`,
        };
      }
    }
  }

  return null;
}

/**
 * All candidates in a block are in the same row or column, eliminate all other candidates
 * in that row or column
 */
function checkAllBlockCellsAreInSameRowOrColumn(
  grid: CellValue[][],
): MoveResult | null {
  for (let b = 0; b < 9; b++) {
    const cells = getCellsInBlock(b, grid).filter(isCandidate);

    const rows = getUniqueRowIndexes(cells);
    if (rows.length === 1) {
      const newCrossed = [
        ...getCellsInRow(rows[0], grid)
          .filter(isCandidate)
          .filter((cell) => getBlockIndex(cell) !== b),
      ];
      if (newCrossed.length !== 0) {
        const newRelevant = [
          ...getCellsInBlock(b, grid),
          ...getCellsInRow(rows[0], grid),
        ];
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `All cells in ${toCodeGroup(
            "Block",
            b + 1,
          )} are in ${toCodeGroup("Row", rows[0] + 1)}`,
        };
      }
    }

    const cols = getUniqueColumnIndexes(cells);
    if (cols.length === 1) {
      const newCrossed = [
        ...getCellsInColumn(cols[0], grid)
          .filter(isCandidate)
          .filter((cell) => getBlockIndex(cell) !== b),
      ];
      if (newCrossed.length !== 0) {
        const newRelevant = [
          ...getCellsInBlock(b, grid),
          ...getCellsInColumn(cols[0], grid),
        ];
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `All cells in ${toCodeGroup(
            "Block",
            b + 1,
          )} are in ${toCodeGroup("Column", cols[0] + 1)}`,
        };
      }
    }
  }

  return null;
}

/**
 * All candidates in a row or column are in the same block, eliminate all other candidates
 * in that block
 */
function checkAllRowOrColumnCellsAreInSameBlock(
  grid: CellValue[][],
): MoveResult | null {
  // rows
  for (let i = 0; i < 9; i++) {
    const blocks = getUniqueBlockIndexes(
      getCellsInRow(i, grid).filter(isCandidate),
    );
    if (blocks.length === 1) {
      const newCrossed = [
        ...getCellsInBlock(blocks[0], grid)
          .filter(isCandidate)
          .filter((cell) => cell.row !== i),
      ];
      const newRelevant = getCellsInRow(i, grid);
      return {
        grid: applyStates([], newCrossed, newRelevant, grid),
        explanation: `All candidates of ${toCodeGroup(
          "Row",
          i + 1,
        )} are in the ${toCodeGroup("Block", blocks[0] + 1)}`,
      };
    }
  }

  // columns
  for (let j = 0; j < 9; j++) {
    const blocks = getUniqueBlockIndexes(
      getCellsInColumn(j, grid).filter(isCandidate),
    );
    if (blocks.length === 1) {
      const newCrossed = [
        ...getCellsInBlock(blocks[0], grid)
          .filter(isCandidate)
          .filter((cell) => cell.col !== j),
      ];
      const newRelevant = getCellsInColumn(j, grid);
      return {
        grid: applyStates([], newCrossed, newRelevant, grid),
        explanation: `All candidates of ${toCodeGroup(
          "Column",
          j + 1,
        )} are in the ${toCodeGroup("Block", blocks[0] + 1)}`,
      };
    }
  }

  return null;
}

/**
 * Candidate seen by all candidates of a number, eliminate the candidate
 */
function checkCellSeesAllCandidatesOfNumber(
  grid: CellValue[][],
): MoveResult | null {
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
      const uniqueMatches = getUniqueCells(matches);
      if (uniqueMatches.length > 0) {
        const newCrossed = [...uniqueMatches];
        const newRelevant = [...candidates];
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `Candidate${
            uniqueMatches.length > 1 ? "s" : ""
          } seen by all candidates of ${toCodeValue(v + 1)}`,
        };
      }
    }
  }

  return null;
}

/**
 * Candidate seen by all candidates of a group, eliminate the candidate
 */
function checkCellSeesAllCandidatesOfGroup(
  grid: CellValue[][],
): MoveResult | null {
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
      const uniqueMatches = getUniqueCells(matches);
      if (uniqueMatches.length > 0) {
        const newCrossed = [...uniqueMatches];
        const newRelevant = getCellsInRow(i, grid);
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `Candidate${
            uniqueMatches.length > 1 ? "s" : ""
          } seen by all candidates of ${toCodeGroup("Row", i + 1)}`,
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
      const uniqueMatches = getUniqueCells(matches);
      if (uniqueMatches.length > 0) {
        const newCrossed = [...uniqueMatches];
        const newRelevant = getCellsInColumn(j, grid);
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `Candidate${
            uniqueMatches.length > 1 ? "s" : ""
          } seen by all candidates of ${toCodeGroup("Column", j + 1)}`,
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
      const uniqueMatches = getUniqueCells(matches);
      if (uniqueMatches.length > 0) {
        const newCrossed = [...uniqueMatches];
        const newRelevant = getCellsInBlock(b, grid);
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `Candidate${
            uniqueMatches.length > 1 ? "s" : ""
          } seen by all candidates of ${toCodeGroup("Block", b + 1)}`,
        };
      }
    }
  }

  return null;
}

/**
 * N groups contain the same N values without any overlap, eliminate all candidates
 * with these values outside the groups
 */
function checkMatchingPairs(grid: CellValue[][]): MoveResult | null {
  const groups: MatchGroup[] = [];

  // rows
  for (let i = 0; i < 9; i++) {
    const groupCells = getCellsInRow(i, grid);
    const candidates = groupCells.filter(isNotCrossed);
    const uniqueValues = getUniqueValues(candidates).sort();
    const possiblePairs = getPossiblePairs(uniqueValues);
    groups.push({
      id: toCodeGroup("Row", i + 1),
      cells: candidates,
      values: uniqueValues,
      possiblePairs: possiblePairs,
      groupCells: groupCells,
    });
  }

  // columns
  for (let j = 0; j < 9; j++) {
    const groupCells = getCellsInColumn(j, grid);
    const candidates = groupCells.filter(isNotCrossed);
    const uniqueValues = getUniqueValues(candidates).sort();
    const possiblePairs = getPossiblePairs(uniqueValues);
    groups.push({
      id: toCodeGroup("Column", j + 1),
      cells: candidates,
      values: uniqueValues,
      possiblePairs: possiblePairs,
      groupCells: groupCells,
    });
  }

  // blocks
  for (let b = 0; b < 9; b++) {
    const groupCells = getCellsInBlock(b, grid);
    const candidates = groupCells.filter(isNotCrossed);
    const uniqueValues = getUniqueValues(candidates).sort();
    const possiblePairs = getPossiblePairs(uniqueValues);
    groups.push({
      id: toCodeGroup("Block", b + 1),
      cells: candidates,
      values: uniqueValues,
      possiblePairs: possiblePairs,
      groupCells: groupCells,
    });
  }

  const combos: MatchGroupCombo[] = []

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

      const groupCombos = getCombinations([group, ...matches], pair.length)
      combos.push({ pair: pair, groups: groupCombos});
    }
  }

  combos.sort((a, b) => a.pair.length - b.pair.length)

  for (let c = 0; c < combos.length; c++) {
    const combo = combos[c];
    for (let cg = 0; cg < combo.groups.length; cg++) {
      const comboGroup = combo.groups[cg]
      if (isReusingValue(comboGroup) || combo.pair.length !== comboGroup.length) {
        continue;
      }

      const valuesOutsidePairs: CellValue[] = [];
      combo.pair.forEach((p) => {
        valuesOutsidePairs.push(
          ...getCellsWithValue(p, grid)
            .filter(isCandidate)
            .filter(
              (cell) =>
                !comboGroup.some((gr) =>
                  gr.cells.some(
                    (c) => cell.col === c.col && cell.row === c.row,
                  ),
                ),
            ),
        );
      });

      if (valuesOutsidePairs.length > 0) {
        const newCrossed = [...valuesOutsidePairs];
        const newRelevant = comboGroup.map((g) => g.groupCells).flat();
        const ids = comboGroup.map((g) => g.id).sort();
        return {
          grid: applyStates([], newCrossed, newRelevant, grid),
          explanation: `Matching pairs found ${toCodeValues(combo.pair)} in ${
            combo.pair.length
          } groups:<br/>${ids.join(", ")}`,
        };
      }
    }
  }

  return null;
}

/* HELPERS */

function applyStates(
  circled: CellValue[],
  crossed: CellValue[],
  relevant: CellValue[],
  grid: CellValue[][],
): CellValue[][] {
  const gridCopy: CellValue[][] = JSON.parse(JSON.stringify(grid));
  relevant.forEach((cell) => {
    if (gridCopy[cell.row][cell.col].state === "none") {
      gridCopy[cell.row][cell.col].recent = true;
    }
  });
  circled.forEach((cell) => {
    gridCopy[cell.row][cell.col].state = "circled";
    gridCopy[cell.row][cell.col].recent = true;
  });
  crossed.forEach((cell) => {
    gridCopy[cell.row][cell.col].state = "crossed";
    gridCopy[cell.row][cell.col].recent = true;
  });
  return gridCopy;
}

function getAllSeenCells(cell: CellValue, grid: CellValue[][]): CellValue[] {
  const colCells = getCellsInColumn(cell.col, grid);
  const rowCells = getCellsInRow(cell.row, grid);
  const blockCells = getCellsInBlock(getBlockIndex(cell), grid);
  const valueCells = getCellsWithValue(cell.value, grid);

  return [...colCells, ...rowCells, ...blockCells, ...valueCells].filter((x) =>
    notMatch(x, cell),
  );
}

function getSeenCells(cell: CellValue, grid: CellValue[][]): CellValue[] {
  return getAllSeenCells(cell, grid).filter(isCandidate);
}

function getBlockIndex(cell: CellValue): number {
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

function getUniqueBlockIndexes(list: CellValue[]): number[] {
  return Array.from(new Set(list.map((cell) => getBlockIndex(cell))));
}

function getUniqueCells(list: CellValue[]): CellValue[] {
  const unique = new Map();
  list.forEach((c) => unique.set(`${c.row}x${c.col}`, c));
  return Array.from(unique.values());
}

function getPossiblePairs(list: string[], maxLength = 5): string[][] {
  const set = new Set<string>();

  function permute(pair: number[]): void {
    if (!set.has(pair.join(""))) {
      set.add(pair.join(""));
    }
    if (pair.length < maxLength) {
      for (let x = 0; x < 9; x++) {
        if (!pair.includes(x + 1)) {
          const newPair = [...pair, x + 1].sort();
          permute(newPair);
        }
      }
    }
  }

  permute(list.map((c) => Number.parseInt(c)));
  return [...set].sort().map((p) => p.split(""));
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
  const gridAStripped = gridA.map((r) =>
    r.map((c) => ({ ...c, recent: false })),
  );
  const gridBStripped = gridB.map((r) =>
    r.map((c) => ({ ...c, recent: false })),
  );
  return JSON.stringify(gridAStripped) !== JSON.stringify(gridBStripped);
}

function toCodeValue(val: string | number): string {
  return `<code>#${val}</code>`;
}

function toCodeValues(vals: string[] | number[]): string {
  return vals.map((v) => toCodeValue(v)).join(", ");
}

function toCodeGroup(str: string, index: number): string {
  return `<code>${str} ${index}</code>`;
}

function getCombinations(arr: MatchGroup[], k: number) {
  let result: MatchGroup[][] = [];
  function combine(start: number, combo: MatchGroup[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  combine(0, []);
  return result;
}

function isReusingValue(combo: MatchGroup[]): boolean {
  return combo.some((gr, i) =>
    combo.some(
      (ogr, j) =>
        i !== j &&
        gr.cells.some((gc) =>
          ogr.cells.some((ogc) => ogc.col === gc.col && ogc.row === gc.row),
        ),
    ),
  );
}

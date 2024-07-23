export type Difficulty = "Intro" | "Standard" | "Advanced" | "Expert";

export type CellState = "circled" | "crossed" | "none";

export type CellValue = {
  value: string;
  state: CellState;
  row: number;
  col: number;
  recent: boolean;
};

export type MoveResult = {
  grid: CellValue[][];
  explanation: string;
};

export type TodaysPuzzle = {
  grid: CellValue[][];
  difficulty: Difficulty;
};

export type MatchGroup = {
  id: string;
  cells: CellValue[];
  values: string[];
  possiblePairs: string[][];
  groupCells: CellValue[];
};

export type MatchGroupCombo = {
  pair: string[];
  groups: MatchGroup[][];
};

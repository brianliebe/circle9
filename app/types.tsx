export type Difficulty = "Easy" | "Medium" | "Hard" | "Very Hard";

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

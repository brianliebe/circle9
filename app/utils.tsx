import { Exo_2 } from "next/font/google";
import { CellState, CellValue } from "./types";

export const exo = Exo_2({ subsets: ["latin"] });

export const buildGrid = (str: string | null): CellValue[][] => {
  const grid: CellValue[][] = [];
  if (str === null) {
    // build empty grid
    for (let i = 0; i < 9; i++) {
      const row: CellValue[] = [];
      for (let j = 0; j < 9; j++) {
        row.push({
          row: i,
          col: j,
          value: "",
          recent: false,
          state: "none",
        });
      }
      grid.push(row);
    }
    return grid;
  }

  // parse the string and build the grid
  for (let i = 0; i < 9; i++) {
    let row = str.slice(i * 9, (i + 1) * 9).split("");
    grid.push(
      row.map((c, j) => ({
        row: i,
        col: j,
        value: c.replaceAll(".", ""),
        recent: false,
        state: "none",
      })),
    );
  }
  return grid;
};

export const switchState = (state: CellState): CellState => {
  switch (state) {
    case "circled":
      return "none";
    case "crossed":
      return "circled";
    case "none":
      return "crossed";
  }
};

// For functions below:
// Copyright 2023 James Dewar. All rights reserved.
// https://circle9puzzle.com/

export const cyrb53 = function (str: string, seed: number = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export const hashAndSelectPuzzle = (
  dateString: string,
  category: string,
  puzzleIndex: number,
  puzzleList: string[],
): string => {
  const s = `${dateString} ${category} ${puzzleIndex}`;
  const h = cyrb53(s);
  const i = h % puzzleList.length;
  const p = puzzleList[i];
  return p;
};

export const getDateString = (date: Date): string => {
  return `${date.getDate()} ${date.getMonth() + 1} ${date.getFullYear()}`;
};

export const getDatePickerString = (date: Date): string => {
  const year = date.toLocaleString(undefined, { year: "numeric" });
  const month = date.toLocaleString(undefined, { month: "2-digit" });
  const day = date.toLocaleString(undefined, { day: "2-digit" });
  return `${year}-${month}-${day}`;
};

export const fromDatePickerString = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
};

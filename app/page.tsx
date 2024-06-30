"use client";
import { useEffect, useRef, useState } from "react";
import { CellState, CellValue, hint, solve } from "./solve";
import { Exo_2 } from "next/font/google";

const exo = Exo_2({ subsets: ["latin"] });

const buildGrid = (grid: (number | null)[][]): CellValue[][] => {
  return grid.map((row, rowIndex) =>
    row.map((value: number | null, colIndex: number) => {
      return {
        value: value ? value.toString() : "",
        state: "none",
        row: rowIndex,
        col: colIndex,
        hint: false,
      } as CellValue;
    }),
  );
};

const easyGrid = [
  [6, 5, null, null, 6, null, null, null, 9],
  [null, null, null, 6, 2, null, null, null, 5],
  [null, null, 7, null, null, null, 7, null, null],
  [null, null, null, 6, null, 2, null, 9, null],
  [3, 1, null, null, null, null, null, 6, 2],
  [null, 6, null, 7, null, 8, null, null, null],
  [null, null, 4, null, null, null, 4, null, null],
  [6, null, null, null, 2, 6, null, null, null],
  [6, null, null, null, 6, null, null, 3, 1],
];

const mediumGrid = [
  [null, null, 1, 1, null, 7, 8, null, null],
  [null, 6, 3, null, null, null, 7, 4, null],
  [3, null, null, null, 2, null, null, null, 1],
  [6, 7, null, null, null, null, null, 4, 4],
  [null, null, null, 6, null, 6, null, null, null],
  [4, 7, null, null, null, null, null, 9, 9],
  [8, null, null, null, 1, null, null, null, 2],
  [null, 5, 6, null, null, null, 5, 8, null],
  [null, null, 3, 3, null, 6, 9, null, null],
];

const hardGrid = [
  [8, null, null, 4, null, 5, null, null, 2],
  [1, 3, null, null, null, null, null, 6, 3],
  [null, 5, null, 9, null, 2, null, 7, null],
  [null, null, 4, null, null, null, 5, null, null],
  [null, null, null, null, 1, null, null, null, null],
  [null, null, 2, null, null, null, 5, null, null],
  [null, 7, null, 3, null, 5, null, 7, null],
  [5, 2, null, null, null, null, null, 3, 7],
  [6, null, null, 5, null, 6, null, null, 9],
];

const veryHardGrid = [
  [null, 9, null, 7, 7, null, null, null, null],
  [null, 8, 6, null, null, null, null, 6, 9],
  [null, null, 1, null, null, 3, 9, 6, null],
  [null, null, 9, 4, null, 3, null, null, 4],
  [2, null, null, null, null, null, null, null, 8],
  [8, null, null, 4, null, 8, 6, null, null],
  [null, 8, 1, 1, null, null, 1, null, null],
  [4, 5, null, null, null, null, 6, 5, null],
  [null, null, null, null, 7, 8, null, 3, null],
];

const defaultGrid = veryHardGrid;

export default function HomePage() {
  const [grid, setGrid] = useState(buildGrid(defaultGrid));
  const [done, setDone] = useState(false);
  const explanations = useRef<string[]>([]);

  const switchState = (state: CellState): CellState => {
    switch (state) {
      case "circled":
        return "crossed";
      case "crossed":
        return "none";
      case "none":
        return "circled";
    }
  };

  const handleChange = (rowIndex: number, colIndex: number, value: string) => {
    const newGrid = grid.map((row, i) =>
      row.map((cell: CellValue, j: number) =>
        i === rowIndex && j === colIndex ? { ...cell, value } : cell,
      ),
    );
    setGrid(newGrid);
  };

  const handleKeyDown = (
    rowIndex: number,
    colIndex: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    console.log(`"${e.key}"`);
    if (e.key === " ") {
      setGrid(
        grid.map((row, i) =>
          row.map((cell: CellValue, j: number) =>
            i === rowIndex && j === colIndex
              ? { ...cell, state: switchState(cell.state) }
              : cell,
          ),
        ),
      );
      e.preventDefault();
    } else if (/[1-9]/.test(e.key)) {
      setGrid(
        grid.map((row, i) =>
          row.map((cell: CellValue, j: number) =>
            i === rowIndex && j === colIndex ? { ...cell, value: e.key } : cell,
          ),
        ),
      );
    } else if (e.key !== "Backspace") {
      e.preventDefault();
    }
  };

  const handleSolvePressed = () => {
    const [newGrid, reasons] = solve(grid);
    setGrid([...newGrid]);
    explanations.current.push(...reasons);
    if (reasons[reasons.length - 1] === "Done") {
      setDone(true);
    }
  };

  const handleHintPressed = () => {
    const [newGrid, reason] = hint(grid);
    setGrid([...newGrid]);
    explanations.current.push(reason);
    if (reason === "Done") {
      setDone(true);
    }
  };

  const handleResetPressed = () => {
    setGrid(buildGrid(defaultGrid));
    setDone(false);
    explanations.current = [];
  };

  return (
    <main className="main">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)" }}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <input
              id={`${rowIndex}-${colIndex}`}
              key={`${rowIndex}-${colIndex}`}
              type="text"
              value={cell.value}
              maxLength={1}
              onChange={(e) => handleChange(rowIndex, colIndex, e.target.value)}
              onKeyDown={(e) => handleKeyDown(rowIndex, colIndex, e)}
              style={{
                width: "50px",
                height: "50px",
                textAlign: "center",
                fontSize: "20px",
                border: "1px solid black",
                color: cell.hint
                  ? "green"
                  : cell.state === "crossed"
                    ? "gray"
                    : "black",
                backgroundColor:
                  cell.state === "crossed"
                    ? "pink"
                    : cell.state === "circled"
                      ? "lightblue"
                      : "white",
                borderRightWidth: [2, 5].includes(colIndex) ? "3px" : "1px",
                borderBottomWidth: [2, 5].includes(rowIndex) ? "3px" : "1px",
                boxSizing: "border-box",
              }}
            />
          )),
        )}
      </div>
      <div style={{ marginTop: "15px" }}>
        <button
          style={{
            border: "1px solid black",
            borderRadius: "6px",
            width: "100px",
            textAlign: "center",
            backgroundColor: "white",
            color: "black",
            fontSize: "1.2rem",
            marginRight: "10px",
          }}
          onClick={handleSolvePressed}
          disabled={done}
        >
          <span
            className={exo.className}
            style={{
              color: "black",
              backgroundColor: "white",
            }}
          >
            Solve
          </span>
        </button>
        <button
          style={{
            border: "1px solid black",
            borderRadius: "6px",
            width: "100px",
            textAlign: "center",
            backgroundColor: "white",
            color: "black",
            fontSize: "1.2rem",
            marginRight: "10px",
          }}
          onClick={handleHintPressed}
          disabled={done}
        >
          <span
            className={exo.className}
            style={{
              color: "black",
              backgroundColor: "white",
            }}
          >
            Hint
          </span>
        </button>
        <button
          style={{
            border: "1px solid black",
            borderRadius: "6px",
            width: "100px",
            textAlign: "center",
            backgroundColor: "white",
            color: "black",
            fontSize: "1.2rem",
          }}
          onClick={handleResetPressed}
        >
          <span
            className={exo.className}
            style={{
              color: "black",
              backgroundColor: "white",
            }}
          >
            Reset
          </span>
        </button>
      </div>
      <div
        style={{
          marginTop: "10px",
          color: "white",
          textAlign: "center",
        }}
      >
        {explanations.current.map((str, i) => (
          <p key={i}>
            {i + 1}. {str}
          </p>
        ))}
      </div>
    </main>
  );
}

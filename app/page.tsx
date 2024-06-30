"use client";
import { useEffect, useRef, useState } from "react";
import { CellState, CellValue, hint, solve } from "./solve";
import { Exo_2 } from "next/font/google";
import { puzzles } from "./puzzles"

const exo = Exo_2({ subsets: ["latin"] });

type Difficulty = "Easy" | "Medium" | "Hard" | "Very Hard"

const buildGrid = (str: string | null): CellValue[][] => {
  const grid: CellValue[][] = [];
  if (str === null) {
    for (let i = 0; i < 9; i++) {
      const row: CellValue[] = []
      for (let j = 0; j < 9; j++) {
        row.push({
          row: i,
          col: j,
          value: "",
          hint: false,
          state: "none"
        })
      }
      grid.push(row)
    }
    return grid
  }

  for (let i = 0; i < 9; i++) {
    let row = str.slice(i * 9, (i + 1) * 9).split('');
    grid.push(row.map((c, j) => ({
      row: i,
      col: j,
      value: c.replaceAll(".", ""),
      hint: false,
      state: "none"
    })));
  }
  return grid
};

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

const cyrb53 = function(str: string, seed: number = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for(let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const hashAndSelectPuzzle = (dateString: string, category: string, puzzleIndex: number, puzzleList: string[]) => {
  const s = `${dateString} ${category} ${puzzleIndex}`;
  const h = cyrb53(s);
  const i = h % puzzleList.length;
  const p = puzzleList[i];
  return p;
};

const dateToString = (date: Date) => {
  const monthStrings = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${monthStrings[date.getMonth()]}-${date.getDate().toString().padStart(2, "0")}-${date.getFullYear()}`;
};


export default function HomePage() {
  const [grid, setGrid] = useState<CellValue[][]>(buildGrid(null));
  const [done, setDone] = useState(false);
  const [todaysPuzzles, setTodaysPuzzles] = useState<{ grid: CellValue[][], difficulty: Difficulty }[]>([])
  const explanations = useRef<string[]>([]);

  useEffect(() => {
    const todaysDate = dateToString(new Date())
    const difficulties: Difficulty[] = ["Easy", "Medium", "Hard", "Very Hard"]
    setTodaysPuzzles(difficulties.map((diff) => {
      return {
        grid: buildGrid(hashAndSelectPuzzle(todaysDate, diff, 0, puzzles[diff])),
        difficulty: diff,
      }
    }))
  }, [])

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
    setGrid(buildGrid(null));
    setDone(false);
    explanations.current = [];
  };

  const loadTodaysPuzzle = (difficulty: Difficulty) => {
    handleResetPressed();
    setGrid(todaysPuzzles.find((p) => p.difficulty === difficulty)?.grid ?? buildGrid(null))
  }

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
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <p>
          Load a puzzle from today:
        </p>
        <button
          style={{
            border: "1px solid black",
            borderRadius: "6px",
            width: "120px",
            textAlign: "center",
            backgroundColor: "white",
            color: "black",
            fontSize: "1.2rem",
            marginBottom: "5px",
          }}
          onClick={() => loadTodaysPuzzle("Easy")}
        >
          <span
            className={exo.className}
            style={{
              color: "black",
              backgroundColor: "white",
            }}
          >
            Easy
          </span>
        </button>
        <br/>
        <button
          style={{
            border: "1px solid black",
            borderRadius: "6px",
            width: "120px",
            textAlign: "center",
            backgroundColor: "white",
            color: "black",
            fontSize: "1.2rem",
            marginBottom: "5px",
          }}
          onClick={() => loadTodaysPuzzle("Medium")}
        >
          <span
            className={exo.className}
            style={{
              color: "black",
              backgroundColor: "white",
            }}
          >
            Medium
          </span>
        </button>
        <br/>
        <button
          style={{
            border: "1px solid black",
            borderRadius: "6px",
            width: "120px",
            textAlign: "center",
            backgroundColor: "white",
            color: "black",
            fontSize: "1.2rem",
            marginBottom: "5px",
          }}
          onClick={() => loadTodaysPuzzle("Hard")}
        >
          <span
            className={exo.className}
            style={{
              color: "black",
              backgroundColor: "white",
            }}
          >
            Hard
          </span>
        </button>
        <br/>
        <button
          style={{
            border: "1px solid black",
            borderRadius: "6px",
            width: "120px",
            textAlign: "center",
            backgroundColor: "white",
            color: "black",
            fontSize: "1.2rem",
          }}
          onClick={() => loadTodaysPuzzle("Very Hard")}
        >
          <span
            className={exo.className}
            style={{
              color: "black",
              backgroundColor: "white",
            }}
          >
            Very Hard
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

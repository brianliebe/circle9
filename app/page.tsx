"use client";
import { useEffect, useRef, useState } from "react";
import { hint, solve } from "./solve";
import { puzzles } from "./puzzles";
import { CellValue, Difficulty, TodaysPuzzle } from "./types";
import { buildGrid, exo, hashAndSelectPuzzle, switchState } from "./utils";

export default function HomePage() {
  const [grid, setGrid] = useState<CellValue[][]>(buildGrid(null));
  const [isDone, setIsDone] = useState(false);
  const [todaysPuzzles, setTodaysPuzzles] = useState<TodaysPuzzle[]>([]);
  const [category, setCategory] = useState("Daily");

  const explanations = useRef<string[]>([]);

  useEffect(() => {
    const date = new Date();
    const todaysDate = `${date.getDate()} ${
      date.getMonth() + 1
    } ${date.getFullYear()}`;
    const difficulties: Difficulty[] = [
      "Intro",
      "Standard",
      "Advanced",
      "Expert",
    ];
    setTodaysPuzzles(
      difficulties.map((diff) => {
        return {
          grid: buildGrid(
            hashAndSelectPuzzle(
              todaysDate,
              `${diff} ${category}`,
              0,
              puzzles[diff],
            ),
          ),
          difficulty: diff,
        };
      }),
    );
  }, [category]);

  const handleKeyDown = (
    rowIndex: number,
    colIndex: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === " " || e.key === "0") {
      const cell = grid[rowIndex][colIndex];
      if (cell.value !== "") {
        cell.state = switchState(cell.state);
        setGrid([...grid]);
      }
      e.preventDefault();
    } else if (/[1-9]/.test(e.key)) {
      const cell = grid[rowIndex][colIndex];
      cell.value = e.key;
      setGrid([...grid]);
    } else if (e.key === "Backspace") {
      const cell = grid[rowIndex][colIndex];
      cell.value = "";
      cell.state = "none";
      setGrid([...grid]);
    } else {
      e.preventDefault();
    }
  };

  const checkEmpty = () => {
    const nonEmpty = grid
      .map((r) => r)
      .flat()
      .filter((c) => c.value !== "");
    return nonEmpty.length === 0;
  };

  const handleSolvePressed = () => {
    if (checkEmpty()) {
      return;
    }
    const [newGrid, reasons] = solve(grid);
    setGrid([...newGrid]);
    explanations.current.push(...reasons);
    if (reasons[reasons.length - 1] === "Done") {
      setIsDone(true);
    }
  };

  const handleHintPressed = () => {
    if (checkEmpty()) {
      return;
    }
    const [newGrid, reason] = hint(grid);
    setGrid([...newGrid]);
    explanations.current.push(reason);
    if (reason === "Done") {
      setIsDone(true);
    }
  };

  const handleResetPressed = () => {
    setGrid(buildGrid(null));
    setIsDone(false);
    explanations.current = [];
    setCategory("Daily");
  };

  const loadTodaysPuzzle = (difficulty: Difficulty) => {
    setGrid(buildGrid(null));
    setIsDone(false);
    explanations.current = [];
    const newPuzzle =
      todaysPuzzles.find((p) => p.difficulty === difficulty)?.grid ??
      buildGrid(null);
    setGrid(JSON.parse(JSON.stringify(newPuzzle)));
  };

  return (
    <main className="main">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)" }}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <input
              id={`${rowIndex}-${colIndex}`}
              key={`${rowIndex}-${colIndex}`}
              className="no-scrollbar"
              type="text"
              pattern="[1-9]*"
              inputMode="numeric"
              value={cell.value}
              onChange={() => null}
              onKeyDown={(e) => handleKeyDown(rowIndex, colIndex, e)}
              style={{
                width: "40px",
                height: "40px",
                textAlign: "center",
                fontSize: "20px",
                border: "1px solid black",
                color: cell.recent
                  ? cell.state === "crossed"
                    ? "red"
                    : "green"
                  : cell.state === "crossed"
                    ? "gray"
                    : "black",
                backgroundColor:
                  cell.state === "crossed"
                    ? "pink"
                    : cell.state === "circled"
                      ? "lightblue"
                      : cell.recent
                        ? "lightyellow"
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
          className="action-button"
          onClick={handleSolvePressed}
          disabled={isDone}
        >
          <span className={`${exo.className} button-text`}>Solve</span>
        </button>
        <button
          className="action-button"
          onClick={handleHintPressed}
          disabled={isDone}
        >
          <span className={`${exo.className} button-text`}>Hint</span>
        </button>
        <button className="action-button" onClick={handleResetPressed}>
          <span className={`${exo.className} button-text`}>Reset</span>
        </button>
      </div>
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <p>Load today's puzzles:</p>
        <div style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="radio"
              value="Daily"
              checked={category === "Daily"}
              onChange={() => setCategory("Daily")}
            />
            Daily
          </label>
          &nbsp; &nbsp;
          <label>
            <input
              type="radio"
              value="Plus"
              checked={category === "Plus"}
              onChange={() => setCategory("Plus")}
            />
            Plus
          </label>
        </div>
        <button
          className="difficulty-button"
          onClick={() => loadTodaysPuzzle("Intro")}
        >
          <span className={`${exo.className} button-text`}>Intro</span>
        </button>
        <br />
        <button
          className="difficulty-button"
          onClick={() => loadTodaysPuzzle("Standard")}
        >
          <span className={`${exo.className} button-text`}>Standard</span>
        </button>
        <br />
        <button
          className="difficulty-button"
          onClick={() => loadTodaysPuzzle("Advanced")}
        >
          <span className={`${exo.className} button-text`}>Advanced</span>
        </button>
        <br />
        <button
          className="difficulty-button"
          onClick={() => loadTodaysPuzzle("Expert")}
        >
          <span className={`${exo.className} button-text`}>Expert</span>
        </button>
      </div>
      <div
        style={{
          marginTop: "10px",
          color: "white",
          textAlign: "center",
        }}
      >
        {explanations.current
          .map((str, i) => (
            <div
              key={i}
              style={{ paddingBottom: "8px" }}
              dangerouslySetInnerHTML={{ __html: `${i + 1}. ${str}` }}
            />
          ))
          .reverse()}
      </div>
    </main>
  );
}

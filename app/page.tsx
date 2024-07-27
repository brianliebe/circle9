"use client";
import { useEffect, useRef, useState } from "react";
import { hint, solve } from "./solve";
import { puzzles } from "./puzzles";
import { CellValue, Difficulty, Circle9Puzzle } from "./types";
import {
  buildGrid,
  exo,
  fromDatePickerString,
  getDatePickerString,
  getDateString,
  hashAndSelectPuzzle,
  switchState,
} from "./utils";
import { Locked, Unlocked } from "@carbon/icons-react";

export default function HomePage() {
  const [grid, setGrid] = useState<CellValue[][]>(buildGrid(null));
  const [isDone, setIsDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [dailyPuzzles, setDailyPuzzles] = useState<Circle9Puzzle[]>([]);
  const [category, setCategory] = useState("Daily");
  const [puzzleDateType, setPuzzleDateType] = useState("Today");
  const [puzzleDate, setPuzzleDate] = useState(getDatePickerString(new Date()));

  const explanations = useRef<string[]>([]);

  useEffect(() => {
    let puzzleDateStr: string;
    if (puzzleDateType === "Today") {
      puzzleDateStr = getDateString(new Date());
    } else {
      puzzleDateStr = getDateString(new Date(fromDatePickerString(puzzleDate)));
    }
    const difficulties: Difficulty[] = [
      "Intro",
      "Standard",
      "Advanced",
      "Expert",
    ];
    setDailyPuzzles(
      difficulties.map((diff) => {
        return {
          grid: buildGrid(
            hashAndSelectPuzzle(
              puzzleDateStr,
              `${diff} ${category}`,
              0,
              puzzles[diff],
            ),
          ),
          difficulty: diff,
        };
      }),
    );
  }, [category, puzzleDateType, puzzleDate]);

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

  const handleCellClick = (
    rowIndex: number,
    colIndex: number,
    e: React.MouseEvent<HTMLInputElement>,
  ) => {
    if (isLocked) {
      const cell = grid[rowIndex][colIndex];
      if (cell.value !== "") {
        cell.state = switchState(cell.state);
        setGrid([...grid]);
      }
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

  const handleSolvePressed = async () => {
    if (checkEmpty()) {
      return;
    }

    // force loading icon
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    const [newGrid, reasons] = await solve(grid);
    setGrid([...newGrid]);
    explanations.current.push(...reasons);
    if (reasons[reasons.length - 1] === "Done") {
      setIsDone(true);
    }
    setIsLoading(false);
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
    setIsLocked(false);
  };

  const loadTodaysPuzzle = (difficulty: Difficulty) => {
    setIsLocked(true);
    setGrid(buildGrid(null));
    setIsDone(false);
    explanations.current = [];
    const newPuzzle =
      dailyPuzzles.find((p) => p.difficulty === difficulty)?.grid ??
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
              onMouseDown={(e) => handleCellClick(rowIndex, colIndex, e)}
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
        <button
          className="action-button"
          style={{ width: "30px" }}
          onClick={() => setIsLocked((prev) => !prev)}
        >
          {isLocked ? (
            <Locked style={{ fill: "black", backgroundColor: "white" }} />
          ) : (
            <Unlocked style={{ fill: "black", backgroundColor: "white" }} />
          )}
        </button>
      </div>
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <div>
          <label>
            <input
              type="radio"
              value="Today"
              checked={puzzleDateType === "Today"}
              onChange={() => setPuzzleDateType("Today")}
            />
            Today
          </label>
          &nbsp; &nbsp;
          <label>
            <input
              type="radio"
              value="Other"
              checked={puzzleDateType === "Other"}
              onChange={() => setPuzzleDateType("Other")}
            />
            Other
          </label>
          {puzzleDateType === "Other" && (
            <>
              <br />
              <input
                type="date"
                value={puzzleDate}
                onChange={(x) => setPuzzleDate(x.target.value)}
                style={{
                  marginTop: "5px",
                  borderRadius: "5px",
                  padding: "5px",
                }}
              />
            </>
          )}
        </div>
        <div style={{ marginTop: "10px", marginBottom: "10px" }}>
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
      {isLoading && (
        <div className="loader" style={{ marginTop: "10px" }}></div>
      )}
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

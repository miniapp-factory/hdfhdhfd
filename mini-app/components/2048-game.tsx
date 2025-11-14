"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function randomTileValue(): number {
  return Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
}

function emptyPositions(board: number[][]): [number, number][] {
  const positions: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) positions.push([r, c]);
    }
  }
  return positions;
}

function addRandomTile(board: number[][]): number[][] {
  const empties = emptyPositions(board);
  if (empties.length === 0) return board;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = randomTileValue();
  return newBoard;
}

function transpose(board: number[][]): number[][] {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverseRows(board: number[][]): number[][] {
  return board.map(row => [...row].reverse());
}

function slideAndMerge(row: number[]): { newRow: number[]; scoreDelta: number } {
  const nonZero = row.filter(v => v !== 0);
  const merged: number[] = [];
  let scoreDelta = 0;
  for (let i = 0; i < nonZero.length; i++) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const mergedVal = nonZero[i] * 2;
      merged.push(mergedVal);
      scoreDelta += mergedVal;
      i++; // skip next
    } else {
      merged.push(nonZero[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return { newRow: merged, scoreDelta };
}

function move(board: number[][], dir: "up" | "down" | "left" | "right"): { board: number[][]; scoreDelta: number } {
  let temp = board;
  if (dir === "up") temp = transpose(temp);
  if (dir === "down") temp = reverseRows(transpose(temp));
  if (dir === "right") temp = reverseRows(temp);

  let scoreDelta = 0;
  const newBoard: number[][] = [];
  for (const row of temp) {
    const { newRow, scoreDelta: delta } = slideAndMerge(row);
    scoreDelta += delta;
    newBoard.push(newRow);
  }

  if (dir === "up") newBoard = transpose(newBoard);
  if (dir === "down") newBoard = transpose(reverseRows(newBoard));
  if (dir === "right") newBoard = reverseRows(newBoard);

  return { board: newBoard, scoreDelta };
}

export function HomePage() {
  const [board, setBoard] = useState<number[][]>(Array.from({ length: SIZE }, () => Array(SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    let b = addRandomTile(board);
    b = addRandomTile(b);
    setBoard(b);
  }, []);

  const handleMove = (dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const { board: newBoard, scoreDelta } = move(board, dir);
    if (JSON.stringify(newBoard) === JSON.stringify(board)) return; // no change
    setBoard(newBoard);
    setScore(prev => prev + scoreDelta);
    const hasEmpty = emptyPositions(newBoard).length > 0;
    const canMerge = (() => {
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const val = newBoard[r][c];
          if (val === 0) continue;
          if (c + 1 < SIZE && newBoard[r][c + 1] === val) return true;
          if (r + 1 < SIZE && newBoard[r + 1][c] === val) return true;
        }
      }
      return false;
    })();
    if (!hasEmpty && !canMerge) setGameOver(true);
    else setBoard(addRandomTile(newBoard));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-1">
        {board.flat().map((val, idx) => (
          <div
            key={idx}
            className={`w-12 h-12 flex items-center justify-center rounded-md text-xl font-bold ${
              val === 0
                ? "bg-gray-200"
                : val <= 4
                ? "bg-yellow-200"
                : val <= 8
                ? "bg-yellow-300"
                : val <= 16
                ? "bg-yellow-400"
                : val <= 32
                ? "bg-yellow-500"
                : val <= 64
                ? "bg-yellow-600"
                : "bg-yellow-700"
            }`}
          >
            {val !== 0 ? val : null}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          <Button onClick={() => handleMove("up")}>↑</Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleMove("left")}>←</Button>
          <Button onClick={() => handleMove("down")}>↓</Button>
          <Button onClick={() => handleMove("right")}>→</Button>
        </div>
      </div>
      <div className="text-xl font-semibold">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg font-bold">Game Over!</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}

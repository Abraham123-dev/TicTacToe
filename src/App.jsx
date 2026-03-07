import { useState, useCallback } from 'react';
import GameHeader from './components/GameHeader';
import TurnIndicator from './components/TurnIndicator';
import Board from './components/Board';
import GameStatus from './components/GameStatus';
import ScoreBoard from './components/ScoreBoard';
import IntroScreen from './components/IntroScreen';
import { checkWinner, placeMarkWithVanish } from './utils/gameUtils';

const INITIAL_STATE = {
  board: Array(9).fill(null),
  xMoves: [],
  oMoves: [],
  currentPlayer: 'X',
  winner: null,
  winningLine: null,
  isDraw: false,
};

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [game, setGame] = useState(INITIAL_STATE);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [startPlayer, setStartPlayer] = useState('X');

  const handleCellClick = useCallback((index) => {
    setGame(prev => {
      if (prev.board[index] !== null || prev.winner || prev.isDraw) return prev;

      const { nextBoard, nextXMoves, nextOMoves } = placeMarkWithVanish(
        prev.board,
        prev.xMoves,
        prev.oMoves,
        index,
        prev.currentPlayer,
      );

      const result = checkWinner(nextBoard);
      const isBoardFull = nextBoard.every(cell => cell !== null);
      const isDraw = !result && isBoardFull;

      if (result) {
        setScores(s => ({ ...s, [result.winner]: s[result.winner] + 1 }));
        return {
          ...prev,
          board: nextBoard,
          xMoves: nextXMoves,
          oMoves: nextOMoves,
          winner: result.winner,
          winningLine: result.line,
          isDraw: false,
        };
      }

      return {
        ...prev,
        board: nextBoard,
        xMoves: nextXMoves,
        oMoves: nextOMoves,
        currentPlayer: prev.currentPlayer === 'X' ? 'O' : 'X',
        isDraw,
        winner: null,
        winningLine: null,
      };
    });
  }, []);

  const handlePlayAgain = useCallback(() => {
    const nextStart = startPlayer === 'X' ? 'O' : 'X';
    setStartPlayer(nextStart);
    setGame({ ...INITIAL_STATE, board: Array(9).fill(null), currentPlayer: nextStart });
  }, [startPlayer]);

  const handleResetScores = useCallback(() => {
    setScores({ X: 0, O: 0 });
  }, []);

  const gameOver = !!(game.winner || game.isDraw);

  if (showIntro) {
    return <IntroScreen onDone={() => setShowIntro(false)} />;
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 gap-7"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <GameHeader />

      <TurnIndicator
        currentPlayer={game.currentPlayer}
        xMoves={game.xMoves}
        oMoves={game.oMoves}
        gameOver={gameOver}
      />

      <Board
        board={game.board}
        xMoves={game.xMoves}
        oMoves={game.oMoves}
        currentPlayer={game.currentPlayer}
        winningLine={game.winningLine}
        gameOver={gameOver}
        onCellClick={handleCellClick}
      />

      {gameOver && (
        <GameStatus
          winner={game.winner}
          isDraw={game.isDraw}
          onPlayAgain={handlePlayAgain}
        />
      )}

      <div style={{ width: 1, height: 20 }} />

      <ScoreBoard scores={scores} onReset={handleResetScores} />
    </main>
  );
}

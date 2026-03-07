import { useState, useCallback, useEffect } from 'react';
import GameHeader from './components/GameHeader';
import TurnIndicator from './components/TurnIndicator';
import Board from './components/Board';
import GameStatus from './components/GameStatus';
import ScoreBoard from './components/ScoreBoard';
import IntroScreen from './components/IntroScreen';
import ThemeToggle from './components/ThemeToggle';
import { checkWinner, placeMarkWithVanish } from './utils/gameUtils';
import { getAIMove } from './utils/aiUtils';

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
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'human'
  const [game, setGame] = useState(INITIAL_STATE);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [startPlayer, setStartPlayer] = useState('X');
  const [isAIThinking, setIsAIThinking] = useState(false);

  const handleCellClick = useCallback((index) => {
    setGame(prev => {
      if (prev.board[index] !== null || prev.winner || prev.isDraw) return prev;

      const { nextBoard, nextXMoves, nextOMoves } = placeMarkWithVanish(
        prev.board, prev.xMoves, prev.oMoves, index, prev.currentPlayer,
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

  // AI move trigger
  useEffect(() => {
    if (gameMode !== 'ai') return;
    if (game.currentPlayer !== 'O') return;
    if (game.winner || game.isDraw) return;

    setIsAIThinking(true);
    const timer = setTimeout(() => {
      const move = getAIMove(game.board, game.xMoves, game.oMoves);
      if (move !== null) handleCellClick(move);
      setIsAIThinking(false);
    }, 550);

    return () => { clearTimeout(timer); setIsAIThinking(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentPlayer, game.winner, game.isDraw, gameMode]);

  const handlePlayAgain = useCallback(() => {
    const nextStart = startPlayer === 'X' ? 'O' : 'X';
    setStartPlayer(nextStart);
    setGame({ ...INITIAL_STATE, board: Array(9).fill(null), currentPlayer: nextStart });
    setIsAIThinking(false);
  }, [startPlayer]);

  const handleResetScores = useCallback(() => {
    setScores({ X: 0, O: 0 });
  }, []);

  const gameOver = !!(game.winner || game.isDraw);
  // Block human clicks when it's AI's turn
  const boardDisabled = gameOver || (gameMode === 'ai' && game.currentPlayer === 'O');

  if (showIntro) {
    return (
      <>
        <ThemeToggle />
        <IntroScreen onDone={(mode) => { setGameMode(mode); setShowIntro(false); }} />
      </>
    );
  }

  return (
    <>
      <ThemeToggle />
      <main
        className="min-h-screen flex flex-col items-center justify-center px-4 py-10 gap-7"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <GameHeader gameMode={gameMode} />

        <TurnIndicator
          currentPlayer={game.currentPlayer}
          xMoves={game.xMoves}
          oMoves={game.oMoves}
          gameOver={gameOver}
          gameMode={gameMode}
          isAIThinking={isAIThinking}
        />

        <Board
          board={game.board}
          xMoves={game.xMoves}
          oMoves={game.oMoves}
          currentPlayer={game.currentPlayer}
          winningLine={game.winningLine}
          gameOver={boardDisabled}
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

        <ScoreBoard scores={scores} onReset={handleResetScores} gameMode={gameMode} />
      </main>
    </>
  );
}

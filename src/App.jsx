import { useState, useCallback, useEffect } from 'react';
import GameHeader from './components/GameHeader';
import TurnIndicator from './components/TurnIndicator';
import Board from './components/Board';
import GameStatus from './components/GameStatus';
import ScoreBoard from './components/ScoreBoard';
import IntroScreen from './components/IntroScreen';
import ThemeToggle from './components/ThemeToggle';
import ToastContainer, { showToast } from './components/Toast';
import HintAssistant from './components/HintAssistant';
import { checkWinner, placeMarkWithVanish } from './utils/gameUtils';
import { getAIMove, getHintForPlayer } from './utils/aiUtils';

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
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [game, setGame] = useState(INITIAL_STATE);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [startPlayer, setStartPlayer] = useState('X');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [hint, setHint] = useState(null);
  const [isHintThinking, setIsHintThinking] = useState(false);

  const AI_DEPTH = { easy: 1, medium: 3, hard: 5 };

  const handleCellClick = useCallback((index) => {
    setHint(null); // clear hint on any move
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
      const move = getAIMove(game.board, game.xMoves, game.oMoves, AI_DEPTH[difficulty] || 3, difficulty);
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

  const handleNewGame = useCallback(() => {
    setStartPlayer('X');
    setGame({ ...INITIAL_STATE });
    setIsAIThinking(false);
    setHint(null);
    showToast('New game started', 'info');
  }, []);

  const handleModeChange = useCallback((newMode) => {
    if (newMode === gameMode) return;
    setGameMode(newMode);
    setStartPlayer('X');
    setGame({ ...INITIAL_STATE });
    setIsAIThinking(false);
    setHint(null);
    showToast(
      newMode === 'ai' ? 'Switched to vs AI' : 'Switched to vs Friend',
      'info',
    );
  }, [gameMode]);

  const handleDifficultyChange = useCallback((newDiff) => {
    if (newDiff === difficulty) return;
    setDifficulty(newDiff);
    setStartPlayer('X');
    setGame({ ...INITIAL_STATE });
    setIsAIThinking(false);
    setHint(null);
    const labels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
    showToast(`Difficulty → ${labels[newDiff]}`, 'info');
  }, [difficulty]);

  const handleBackToIntro = useCallback(() => {
    setShowIntro(true);
    setGame({ ...INITIAL_STATE });
    setScores({ X: 0, O: 0 });
    setStartPlayer('X');
    setIsAIThinking(false);
    setHint(null);
  }, []);

  const handleResetScores = useCallback(() => {
    setScores({ X: 0, O: 0 });
    showToast('Scores reset', 'info');
  }, []);

  const handleRequestHint = useCallback(() => {
    if (game.winner || game.isDraw) return;
    if (game.currentPlayer !== 'X') return;
    setIsHintThinking(true);
    // Delay so the "Deep analysis" state is visible (depth 9 takes a moment)
    setTimeout(() => {
      const result = getHintForPlayer(game.board, game.xMoves, game.oMoves);
      setHint(result);
      setIsHintThinking(false);
    }, 600);
  }, [game]);

  const handleDismissHint = useCallback(() => {
    setHint(null);
  }, []);

  const gameOver = !!(game.winner || game.isDraw);
  // Block human clicks when it's AI's turn
  const boardDisabled = gameOver || (gameMode === 'ai' && game.currentPlayer === 'O');

  if (showIntro) {
    return (
      <>
        <ThemeToggle />
        <ToastContainer />
        <IntroScreen onDone={(mode, diff) => { setGameMode(mode); setDifficulty(diff || 'medium'); setShowIntro(false); }} />
      </>
    );
  }

  return (
    <>
      <ThemeToggle />
      <ToastContainer />
      <main
        className="min-h-screen flex flex-col items-center justify-center px-4 py-10 gap-7"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <GameHeader
          gameMode={gameMode}
          difficulty={difficulty}
          onModeChange={handleModeChange}
          onDifficultyChange={handleDifficultyChange}
          onNewGame={handleNewGame}
          onBackToIntro={handleBackToIntro}
        />

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
          hintCell={hint ? hint.move : null}
        />

        {/* AI Coach — show when vs AI, it's player's turn, and game is not over */}
        {gameMode === 'ai' && game.currentPlayer === 'X' && !gameOver && (
          <HintAssistant
            hint={hint}
            onRequestHint={handleRequestHint}
            onDismiss={handleDismissHint}
            disabled={false}
            isThinking={isHintThinking}
          />
        )}

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

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
import { socket, connectSocket } from './utils/socket';

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
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'human' | 'multiplayer'
  const [difficulty, setDifficulty] = useState('medium');
  const [game, setGame] = useState(INITIAL_STATE);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [startPlayer, setStartPlayer] = useState('X');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [hint, setHint] = useState(null);
  const [isHintThinking, setIsHintThinking] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const AI_DEPTH = { easy: 1, medium: 3, hard: 5 };

  // Socket synchronization
  useEffect(() => {
    if (gameMode !== 'multiplayer') return;

    connectSocket();

    socket.on('connect', () => {
      if (sessionId) {
        socket.emit('join_room', { sessionId });
      }
    });

    socket.on('game_update', (data) => {
      setGame(prev => ({
        ...prev,
        board: data.board.map(c => c === '' ? null : c),
        currentPlayer: data.current_turn,
        xMoves: data.x_moves || [],
        oMoves: data.o_moves || [],
        winner: null,
        isDraw: false,
      }));
    });

    socket.on('game_over', (data) => {
      setGame(prev => ({
        ...prev,
        board: data.board.map(c => c === '' ? null : c),
        winner: data.winner === 'draw' ? null : data.winner,
        isDraw: data.winner === 'draw',
        xMoves: data.x_moves || [],
        oMoves: data.o_moves || [],
      }));
      if (data.winner && data.winner !== 'draw') {
        setScores(s => ({ ...s, [data.winner]: s[data.winner] + 1 }));
      }
    });

    socket.on('invalid_move', ({ reason }) => {
      showToast(reason, 'error');
    });

    return () => {
      socket.off('game_update');
      socket.off('game_over');
      socket.off('invalid_move');
      socket.off('connect');
    };
  }, [gameMode, sessionId]);

  const handleCellClick = useCallback((index) => {
    setHint(null);

    // Multiplayer Mode: Hand off to server
    if (gameMode === 'multiplayer') {
      if (!sessionId) return;
      socket.emit('player_move', {
        sessionId,
        cellIndex: index,
      });
      return;
    }

    // Local Logic (AI or Human)
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
  }, [gameMode, sessionId]);

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
  }, [game.currentPlayer, game.winner, game.isDraw, gameMode, difficulty, handleCellClick]);

  const handlePlayAgain = useCallback(() => {
    if (gameMode === 'multiplayer') {
      showToast('New game must be started via session reset', 'info');
      return;
    }
    const nextStart = startPlayer === 'X' ? 'O' : 'X';
    setStartPlayer(nextStart);
    setGame({ ...INITIAL_STATE, board: Array(9).fill(null), currentPlayer: nextStart });
    setIsAIThinking(false);
  }, [startPlayer, gameMode]);

  const handleNewGame = useCallback(() => {
    if (gameMode === 'multiplayer') {
       showToast('Session logic required for reset', 'info');
       return;
    }
    setStartPlayer('X');
    setGame({ ...INITIAL_STATE });
    setIsAIThinking(false);
    setHint(null);
    showToast('New game started', 'info');
  }, [gameMode]);

  const handleModeChange = useCallback((newMode) => {
    if (newMode === gameMode) return;
    setGameMode(newMode);
    setStartPlayer('X');
    setGame({ ...INITIAL_STATE });
    setIsAIThinking(false);
    setHint(null);
    showToast(
      newMode === 'ai' ? 'Switched to vs AI' : 'Switched to Friend',
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleCreateSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('google_id_token');
      console.log('Creating session with token:', token?.substring(0, 10) + '...');
      const res = await fetch(`${API_URL}/api/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log('Create session response:', data);
      if (res.ok) {
        setSessionId(data._id);
        setGameMode('multiplayer');
        setShowIntro(false);
        showToast('Room created!', 'success');
      } else {
        showToast(data.error || 'Failed to create room', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  }, [API_URL]);

  const handleJoinSession = useCallback(async (id) => {
    if (!id) return showToast('Please enter a room ID', 'warn');
    try {
      const res = await fetch(`${API_URL}/api/session/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('google_id_token')}`,
        },
        body: JSON.stringify({ sessionId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data._id);
        setGameMode('multiplayer');
        setShowIntro(false);
        showToast('Joined room!', 'success');
      } else {
        showToast(data.error || 'Failed to join room', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  }, [API_URL]);

  const handleBackToIntro = useCallback(() => {
    setShowIntro(true);
    setGame({ ...INITIAL_STATE });
    setScores({ X: 0, O: 0 });
    setStartPlayer('X');
    setIsAIThinking(false);
    setHint(null);
    setSessionId(null);
  }, []);

  const handleResetScores = useCallback(() => {
    setScores({ X: 0, O: 0 });
    showToast('Scores reset', 'info');
  }, []);

  const handleRequestHint = useCallback(() => {
    if (game.winner || game.isDraw) return;
    if (game.currentPlayer !== 'X') return;
    setIsHintThinking(true);
    setTimeout(() => {
      const result = getHintForPlayer(game.board, game.xMoves, game.oMoves);
      setHint(result);
      setIsHintThinking(false);
    }, 400);
  }, [game]);

  const handleDismissHint = useCallback(() => {
    setHint(null);
  }, []);

  const gameOver = !!(game.winner || game.isDraw);
  const boardDisabled = gameOver || (gameMode === 'ai' && game.currentPlayer === 'O');

  if (showIntro) {
    return (
      <>
        <ThemeToggle />
        <ToastContainer />
        <IntroScreen 
          onDone={(mode, diff, sid) => { 
            setGameMode(mode); 
            setDifficulty(diff || 'medium'); 
            if (sid) setSessionId(sid);
            setShowIntro(false); 
          }} 
          onCreateSession={handleCreateSession}
          onJoinSession={handleJoinSession}
        />
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
        
        {sessionId && gameMode === 'multiplayer' && (
          <div 
            className="flex flex-col items-center gap-2 mt-6 px-4 py-3 rounded-xl border animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ 
              backgroundColor: 'var(--color-surface)', 
              borderColor: 'var(--color-border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Room ID
            </span>
            <div className="flex items-center gap-3">
              <span 
                className="font-mono font-bold" 
                style={{ fontSize: '1.4rem', color: 'var(--color-text)', letterSpacing: '0.05em' }}
              >
                {sessionId}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sessionId);
                  showToast('Room ID copied!', 'success');
                }}
                className="p-2 rounded-md transition-colors"
                style={{ 
                  backgroundColor: 'var(--color-bg)', 
                  border: '1px solid var(--color-border-strong)',
                  cursor: 'pointer'
                }}
                title="Copy Room ID"
              >
                <span style={{ fontSize: 14 }}>📋</span>
              </button>
            </div>
            <p className="text-[10px] opacity-40 italic">Share this code with your friend to play together</p>
          </div>
        )}
      </main>
    </>
  );
}

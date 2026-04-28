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
  host: null,
  guest: null,
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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleCreateSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('google_id_token');
      const res = await fetch(`${API_URL}/api/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data._id);
        setGameMode('multiplayer');
        setShowIntro(false);
        showToast('Room created!', 'success');
        window.history.replaceState(null, '', `?room=${data._id}`);
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
        window.history.replaceState(null, '', `?room=${data._id}`);
      } else {
        showToast(data.error || 'Failed to join room', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  }, [API_URL]);

  // Handle Auto-Join from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    const token = localStorage.getItem('google_id_token');

    if (roomFromUrl && !sessionId && token) {
      console.log('Auto-joining room from URL:', roomFromUrl);
      handleJoinSession(roomFromUrl);
    }
  }, [sessionId, handleJoinSession]);

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
      setGame((prev) => ({
        ...prev,
        board: data.board,
        currentPlayer: data.current_turn,
        status: data.status,
        xMoves: data.x_moves || [],
        oMoves: data.o_moves || [],
        host: data.host,
        guest: data.guest,
      }));
    });

    socket.on('game_over', (data) => {
      setGame((prev) => ({
        ...prev,
        winner: data.winner,
        board: data.board,
        isDraw: data.winner === 'draw',
        host: data.host,
        guest: data.guest,
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


  const handleShowFullIntro = useCallback(() => {
    localStorage.removeItem('hasSeenIntro');
    setShowIntro(true);
    setGame({ ...INITIAL_STATE });
    setScores({ X: 0, O: 0 });
    setStartPlayer('X');
    setIsAIThinking(false);
    setHint(null);
    setSessionId(null);
  }, []);

  const handleBackToIntro = useCallback(() => {
    setShowIntro(true);
    setGame({ ...INITIAL_STATE });
    setScores({ X: 0, O: 0 });
    setStartPlayer('X');
    setIsAIThinking(false);
    setHint(null);
    setSessionId(null);
    // Clear URL
    window.history.replaceState(null, '', window.location.pathname);
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

        {gameMode === 'multiplayer' && (
          <div className="flex justify-between w-full max-w-sm mb-2 px-2 animate-in fade-in zoom-in-95 duration-500">
            {/* Host (X) */}
            <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${game.currentPlayer === 'X' ? 'scale-105 shadow-sm ring-1 ring-white/10' : 'opacity-40 grayscale-[0.5]'}`}
                 style={{ backgroundColor: 'var(--color-surface)', borderColor: game.currentPlayer === 'X' ? 'var(--color-x)' : 'var(--color-border)' }}>
              <img 
                src={game.host?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${game.host?._id || 'host'}`} 
                className="w-8 h-8 rounded-full border border-white/10" 
                alt="X" 
              />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-bold uppercase opacity-50">Player X</span>
                <span className="text-xs font-bold truncate max-w-[80px]">{game.host?.name || 'Waiting...'}</span>
              </div>
            </div>

            <div className="flex items-center text-xl font-black opacity-10 italic">VS</div>

            {/* Guest (O) */}
            <div className={`flex flex-row-reverse items-center gap-2 p-2 rounded-lg border transition-all ${game.currentPlayer === 'O' ? 'scale-105 shadow-sm ring-1 ring-white/10' : 'opacity-40 grayscale-[0.5]'}`}
                 style={{ backgroundColor: 'var(--color-surface)', borderColor: game.currentPlayer === 'O' ? 'var(--color-o)' : 'var(--color-border)' }}>
              <img 
                src={game.guest?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${game.guest?._id || 'guest'}`} 
                className="w-8 h-8 rounded-full border border-white/10" 
                alt="O" 
              />
              <div className="flex flex-col items-end leading-tight">
                <span className="text-[10px] font-bold uppercase opacity-50">Player O</span>
                <span className="text-xs font-bold truncate max-w-[80px]">{game.guest?.name || 'Waiting...'}</span>
              </div>
            </div>
          </div>
        )}

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
          <div className="flex flex-col w-full max-w-sm mt-6 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Room Code Badge */}
            <div 
              className="flex items-center justify-between px-4 py-3 rounded-xl border"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Room Code</span>
                <span className="font-mono font-bold text-lg" style={{ color: 'var(--color-text)' }}>{sessionId}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const fullUrl = `${window.location.origin}${window.location.pathname}?room=${sessionId}`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'Play Tic-Tac-Toe with me!',
                        text: `Join my room ${sessionId} and let's play!`,
                        url: fullUrl,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(fullUrl);
                      showToast('Invite link copied!', 'success');
                    }
                  }}
                  className="p-2 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', cursor: 'pointer' }}
                  title="Share Invite Link"
                >
                  <span style={{ fontSize: 14 }}>🔗</span>
                  <span className="text-[10px] font-bold uppercase">Share Link</span>
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sessionId);
                    showToast('Code copied!', 'success');
                  }}
                  className="p-2 rounded-lg transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border-strong)', cursor: 'pointer' }}
                  title="Copy Room ID"
                >
                  <span style={{ fontSize: 16 }}>📋</span>
                </button>
              </div>
            </div>

            {/* Live Activity Log */}
            <div 
              className="flex flex-col p-4 rounded-xl border"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <span className="text-[10px] font-bold uppercase opacity-50 mb-3 tracking-widest">Live Activity</span>
              <div className="flex flex-col gap-2 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="opacity-70"><b>{game.host?.name || 'Host'}</b> is online</span>
                </div>
                {game.guest ? (
                  <div className="flex items-center gap-2 text-xs animate-in slide-in-from-left duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="opacity-70"><b>{game.guest?.name}</b> joined the match</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs opacity-40 italic">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    <span>Waiting for guest...</span>
                  </div>
                )}
                {game.winner && (
                  <div className="flex items-center gap-2 text-xs font-bold text-yellow-500 mt-1 animate-bounce">
                    <span>🏆 Game Over: {game.winner === 'draw' ? 'It is a draw!' : `${game.winner === 'X' ? game.host?.name : game.guest?.name} won!`}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

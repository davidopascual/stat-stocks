import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TradingProvider, useTradingContext } from './context/TradingContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MarketViewPro from './components/MarketViewPro';
import PlayerDetailAdvanced from './components/PlayerDetailAdvanced';
import PortfolioViewPro from './components/PortfolioViewPro';
import LeagueManagement from './components/LeagueManagement';
import PriceTicker from './components/PriceTicker';
import { Player } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { LogOut, User as UserIcon } from 'lucide-react';
import './App.css';
import './AdvancedFeatures.css';
import './styles/theme.css';

type View = 'market' | 'portfolio' | 'leagues';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('market');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { balance, getTotalValue } = useTradingContext();
  const { players } = useWebSocket();
  const { user, logout, isAuthenticated } = useAuth();

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handleSelectPlayerById = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      setSelectedPlayer(player);
      setCurrentView('market');
    }
  };

  // Update selected player when prices change
  React.useEffect(() => {
    if (selectedPlayer && players.length > 0) {
      const updatedPlayer = players.find(p => p.id === selectedPlayer.id);
      if (updatedPlayer) {
        setSelectedPlayer(updatedPlayer);
      }
    }
  }, [players, selectedPlayer]);

  const handleBack = () => {
    setSelectedPlayer(null);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <span>🏀</span>
              <span>StatStocks</span>
            </div>
            <nav className="nav">
              <button
                className={`nav-btn ${currentView === 'market' && !selectedPlayer ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('market');
                  setSelectedPlayer(null);
                }}
              >
                Market
              </button>
              <button
                className={`nav-btn ${currentView === 'portfolio' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('portfolio');
                  setSelectedPlayer(null);
                }}
              >
                Portfolio
              </button>
              <button
                className={`nav-btn ${currentView === 'leagues' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('leagues');
                  setSelectedPlayer(null);
                }}
              >
                Leagues
              </button>
            </nav>
          </div>
          <div className="user-info">
            <div className="balance-display">
              <div className="balance-label">Cash Balance</div>
              <div className="balance-amount">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="portfolio-value">
                Total: ${getTotalValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            {isAuthenticated && user && (
              <div className="user-profile">
                <div className="user-info-display">
                  <UserIcon size={18} />
                  <span className="username">{user.displayName}</span>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Logout">
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Price Ticker */}
      {!selectedPlayer && <PriceTicker players={players} />}

      <main className="main-content">
        {selectedPlayer ? (
          <PlayerDetailAdvanced player={selectedPlayer} onBack={handleBack} />
        ) : currentView === 'market' ? (
          <MarketViewPro onSelectPlayer={handleSelectPlayer} players={players} />
        ) : currentView === 'portfolio' ? (
          <PortfolioViewPro onSelectPlayer={handleSelectPlayerById} players={players} />
        ) : (
          <LeagueManagement userId={user?.id || 'demo-user'} />
        )}
      </main>
    </div>
  );
};

const AuthWrapper: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login
        onLogin={login}
        onSwitchToRegister={() => setAuthMode('register')}
      />
    ) : (
      <Register
        onRegister={login}
        onSwitchToLogin={() => setAuthMode('login')}
      />
    );
  }

  return (
    <TradingProvider>
      <AppContent />
    </TradingProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
};

export default App;

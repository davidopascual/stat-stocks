import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TradingProvider, useTradingContext } from './context/TradingContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MarketView from './components/MarketView';
import PlayerDetailAdvanced from './components/PlayerDetailAdvanced';
import PortfolioView from './components/PortfolioView';
import LeagueManagement from './components/LeagueManagement';
import { Player } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';
import './AdvancedFeatures.css';

type View = 'market' | 'portfolio' | 'leagues';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('market');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { balance, getTotalValue } = useTradingContext();
  const { players } = useWebSocket();
  const { user, logout } = useAuth();

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
  }, [players]);

  const handleBack = () => {
    setSelectedPlayer(null);
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
            <div className="user-profile">
              <div className="user-avatar">
                {user?.displayName?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="user-details">
                <div className="user-name">{user?.displayName || 'Guest'}</div>
                <button className="logout-btn" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>
            <div className="balance-display">
              <div className="balance-label">Cash Balance</div>
              <div className="balance-amount">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="portfolio-value">
                Total: ${getTotalValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {selectedPlayer ? (
          <PlayerDetailAdvanced player={selectedPlayer} onBack={handleBack} />
        ) : currentView === 'market' ? (
          <MarketView onSelectPlayer={handleSelectPlayer} players={players} />
        ) : currentView === 'portfolio' ? (
          <PortfolioView onSelectPlayer={handleSelectPlayerById} players={players} />
        ) : (
          <LeagueManagement />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);
  
  return (
    <AuthProvider>
      <AuthWrapper 
        showRegister={showRegister} 
        setShowRegister={setShowRegister} 
      />
    </AuthProvider>
  );
};

const AuthWrapper: React.FC<{ 
  showRegister: boolean; 
  setShowRegister: (show: boolean) => void; 
}> = ({ showRegister, setShowRegister }) => {
  const { user, login } = useAuth();

  if (!user) {
    return showRegister ? (
      <Register
        onRegister={login}
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <Login
        onLogin={login}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <TradingProvider>
      <AppContent />
    </TradingProvider>
  );
};

export default App;

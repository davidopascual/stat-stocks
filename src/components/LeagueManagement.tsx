import React, { useState, useEffect, useCallback } from 'react';
import './LeagueManagement.css';

interface League {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  memberIds: string[];
  startDate: string;
  endDate?: string;
  startingBalance: number;
  isActive: boolean;
  isPrivate: boolean;
  inviteCode: string;
  settings: {
    allowShortSelling: boolean;
    allowOptions: boolean;
    allowMargin: boolean;
    maxLeverage: number;
    tradingFees: boolean;
    feePercentage: number;
  };
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: number;
  totalValue: number;
  percentageReturn: number;
  dayReturn: number;
  weekReturn: number;
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

interface LeagueManagementProps {
  userId: string;
}

const LeagueManagement: React.FC<LeagueManagementProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'my-leagues' | 'create' | 'join' | 'public'>('my-leagues');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [publicLeagues, setPublicLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [leagueStats, setLeagueStats] = useState<{
    totalTrades: number;
    totalVolume: number;
    avgReturn: number;
    topGainer: string;
    topLoser: string;
    mostActiveTrade: string;
  } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Create League Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    startingBalance: 100000,
    isPrivate: true,
    allowShortSelling: true,
    allowOptions: true,
    allowMargin: false,
    maxLeverage: 1,
    tradingFees: false,
    feePercentage: 0.1
  });

  // Join League Form State
  const [joinForm, setJoinForm] = useState({
    inviteCode: ''
  });

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'LEAGUE_UPDATE' && selectedLeague?.id === message.leagueId) {
          if (message.event === 'LEADERBOARD_UPDATE') {
            setLeaderboard(message.data.leaderboard);
            setLeagueStats(message.data.stats);
            setLastUpdate(new Date(message.data.timestamp));
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [selectedLeague?.id]);

  const fetchLeagueStats = async (leagueId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/leagues/${leagueId}/stats`);
      const data = await response.json();
      setLeagueStats(data);
    } catch (error) {
      console.error('Error fetching league stats:', error);
    }
  };

  const fetchEnhancedLeaderboard = async (leagueId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/leagues/${leagueId}/leaderboard/enhanced`);
      const data = await response.json();
      setLeaderboard(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching enhanced leaderboard:', error);
    }
  };

  const refreshLeaderboard = async (leagueId: string) => {
    try {
      setLoading(true);
      await fetch(`http://localhost:3001/api/leagues/${leagueId}/leaderboard/refresh`, {
        method: 'POST'
      });
      await fetchEnhancedLeaderboard(leagueId);
      await fetchLeagueStats(leagueId);
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLeagues = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/leagues/user/${userId}`);
      const data = await response.json();
      setLeagues(data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserLeagues();
  }, [userId, fetchUserLeagues]);

  const fetchPublicLeagues = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/leagues/public`);
      if (response.ok) {
        const data = await response.json();
        setPublicLeagues(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch public leagues:', response.status);
        setPublicLeagues([]);
      }
    } catch (error) {
      console.error('Error fetching public leagues:', error);
      setPublicLeagues([]);
    }
  };

  const createLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/leagues/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: userId,
          name: createForm.name,
          description: createForm.description,
          startingBalance: createForm.startingBalance,
          isPrivate: createForm.isPrivate,
          settings: {
            allowShortSelling: createForm.allowShortSelling,
            allowOptions: createForm.allowOptions,
            allowMargin: createForm.allowMargin,
            maxLeverage: createForm.maxLeverage,
            tradingFees: createForm.tradingFees,
            feePercentage: createForm.feePercentage
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        const message = `🎉 League "${result.league.name}" created successfully!\n\n🔑 Invite Code: ${result.inviteCode}\n\n📋 Share this code with friends to invite them!`;
        alert(message);
        fetchUserLeagues();
        setActiveTab('my-leagues');
        setCreateForm({
          name: '',
          description: '',
          startingBalance: 100000,
          isPrivate: true,
          allowShortSelling: true,
          allowOptions: true,
          allowMargin: false,
          maxLeverage: 1,
          tradingFees: false,
          feePercentage: 0.1
        });
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating league:', error);
      alert('❌ Error creating league. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          inviteCode: joinForm.inviteCode.trim().toUpperCase()
        })
      });

      const result = await response.json();
      if (result.success) {
        const message = `🎉 Successfully joined "${result.league.name}"!\n\n💰 Starting Balance: $${result.league.startingBalance.toLocaleString()}\n📊 Members: ${result.league.memberIds.length}\n\n🚀 Start trading and climb the leaderboard!`;
        alert(message);
        fetchUserLeagues();
        setActiveTab('my-leagues');
        setJoinForm({ inviteCode: '' });
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error joining league:', error);
      alert('❌ Error joining league. Please check the invite code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectLeague = (league: League) => {
    setSelectedLeague(league);
    fetchEnhancedLeaderboard(league.id);
    fetchLeagueStats(league.id);
  };

  return (
    <div className="league-management">
      <div className="league-header">
        <h2>⚔️ Trading Leagues</h2>
        <div className="tab-buttons">
          <button
            className={activeTab === 'my-leagues' ? 'active' : ''}
            onClick={() => setActiveTab('my-leagues')}
          >
            My Leagues ({leagues.length})
          </button>
          <button
            className={activeTab === 'public' ? 'active' : ''}
            onClick={() => {
              setActiveTab('public');
              fetchPublicLeagues();
            }}
          >
            Public Leagues
          </button>
          <button
            className={activeTab === 'create' ? 'active' : ''}
            onClick={() => setActiveTab('create')}
          >
            Create League
          </button>
          <button
            className={activeTab === 'join' ? 'active' : ''}
            onClick={() => setActiveTab('join')}
          >
            Join League
          </button>
        </div>
      </div>

      {activeTab === 'my-leagues' && (
        <div className="my-leagues-tab">
          {!selectedLeague ? (
            <div className="leagues-list">
              {leagues.length === 0 ? (
                <div className="empty-state">
                  <p>🏆 No leagues yet!</p>
                  <p>Create or join a league to compete with others</p>
                </div>
              ) : (
                leagues.map(league => (
                  <div key={league.id} className="league-card" onClick={() => selectLeague(league)}>
                    <div className="league-info">
                      <h3>{league.name}</h3>
                      <p>{league.description}</p>
                      <div className="league-stats">
                        <span>👥 {league.memberIds.length} members</span>
                        <span>💰 ${league.startingBalance.toLocaleString()} start</span>
                        <span>{league.isPrivate ? '🔒 Private' : '🌐 Public'}</span>
                      </div>
                    </div>
                    <div className="league-features">
                      {league.settings.allowOptions && <span className="feature">📊 Options</span>}
                      {league.settings.allowShortSelling && <span className="feature">📉 Shorts</span>}
                      {league.settings.allowMargin && <span className="feature">💳 Margin</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="league-detail">
              <div className="league-detail-header">
                <button onClick={() => setSelectedLeague(null)} className="back-btn">← Back</button>
                <div className="league-title">
                  <h3>{selectedLeague.name}</h3>
                  <p>{selectedLeague.description}</p>
                </div>
                <div className="invite-code">
                  <span>Invite Code: <strong>{selectedLeague.inviteCode}</strong></span>
                </div>
              </div>

              <div className="leaderboard">
                <div className="leaderboard-header">
                  <h4>🏆 Leaderboard</h4>
                  <button 
                    className="refresh-btn"
                    onClick={() => selectedLeague && refreshLeaderboard(selectedLeague.id)}
                    disabled={loading}
                  >
                    {loading ? '🔄 Updating...' : '🔄 Refresh'}
                  </button>
                </div>
                <div className="leaderboard-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Portfolio Value</th>
                        <th>Return %</th>
                        <th>Day Return</th>
                        <th>Total Trades</th>
                        <th>Win Rate</th>
                        <th>Sharpe Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map(entry => (
                        <tr key={entry.userId} className={entry.userId === userId ? 'current-user' : ''}>
                          <td className="rank">
                            {entry.rank === 1 && '🥇'}
                            {entry.rank === 2 && '🥈'}
                            {entry.rank === 3 && '🥉'}
                            {entry.rank > 3 && entry.rank}
                          </td>
                          <td className="username">{entry.username}</td>
                          <td className="portfolio-value">${entry.totalValue.toLocaleString()}</td>
                          <td className={`return ${entry.percentageReturn >= 0 ? 'positive' : 'negative'}`}>
                            {entry.percentageReturn >= 0 ? '+' : ''}{entry.percentageReturn.toFixed(2)}%
                          </td>
                          <td className={`day-return ${entry.dayReturn >= 0 ? 'positive' : 'negative'}`}>
                            {entry.dayReturn >= 0 ? '+' : ''}{entry.dayReturn.toFixed(2)}%
                          </td>
                          <td className="trades">{entry.totalTrades}</td>
                          <td className="win-rate">{(entry.winRate * 100).toFixed(1)}%</td>
                          <td className="sharpe">{entry.sharpeRatio.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {leagueStats && (
                <div className="league-stats">
                  <h4>📊 League Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Total Trades:</span>
                      <span className="stat-value">{leagueStats.totalTrades}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Volume:</span>
                      <span className="stat-value">${leagueStats.totalVolume.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Average Return:</span>
                      <span className="stat-value">{leagueStats.avgReturn.toFixed(2)}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Top Gainer:</span>
                      <span className="stat-value">{leagueStats.topGainer}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Top Loser:</span>
                      <span className="stat-value">{leagueStats.topLoser}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Most Active Trade:</span>
                      <span className="stat-value">{leagueStats.mostActiveTrade}</span>
                    </div>
                  </div>
                  <div className="last-updated">
                    <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="create-league-tab">
          <form onSubmit={createLeague} className="create-form">
            <h3>🏗️ Create New League</h3>
            
            <div className="form-group">
              <label>League Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                required
                placeholder="e.g., Office NBA Trading League"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                placeholder="Describe your league rules and goals..."
              />
            </div>

            <div className="form-group">
              <label>Starting Balance</label>
              <input
                type="number"
                value={createForm.startingBalance}
                onChange={(e) => setCreateForm({...createForm, startingBalance: parseInt(e.target.value)})}
                min={10000}
                max={1000000}
                step={10000}
              />
            </div>

            <div className="settings-group">
              <h4>League Settings</h4>
              
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={createForm.isPrivate}
                    onChange={(e) => setCreateForm({...createForm, isPrivate: e.target.checked})}
                  />
                  Private League (invite only)
                </label>
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={createForm.allowShortSelling}
                    onChange={(e) => setCreateForm({...createForm, allowShortSelling: e.target.checked})}
                  />
                  Allow Short Selling
                </label>
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={createForm.allowOptions}
                    onChange={(e) => setCreateForm({...createForm, allowOptions: e.target.checked})}
                  />
                  Allow Options Trading
                </label>
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={createForm.allowMargin}
                    onChange={(e) => setCreateForm({...createForm, allowMargin: e.target.checked})}
                  />
                  Allow Margin Trading
                </label>
              </div>

              {createForm.allowMargin && (
                <div className="form-group">
                  <label>Max Leverage</label>
                  <select
                    value={createForm.maxLeverage}
                    onChange={(e) => setCreateForm({...createForm, maxLeverage: parseFloat(e.target.value)})}
                  >
                    <option value={1}>1x (No Leverage)</option>
                    <option value={2}>2x</option>
                    <option value={3}>3x</option>
                    <option value={5}>5x</option>
                  </select>
                </div>
              )}

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={createForm.tradingFees}
                    onChange={(e) => setCreateForm({...createForm, tradingFees: e.target.checked})}
                  />
                  Enable Trading Fees
                </label>
              </div>

              {createForm.tradingFees && (
                <div className="form-group">
                  <label>Fee Percentage</label>
                  <input
                    type="number"
                    value={createForm.feePercentage}
                    onChange={(e) => setCreateForm({...createForm, feePercentage: parseFloat(e.target.value)})}
                    min={0}
                    max={5}
                    step={0.1}
                  />
                  <small>Percentage of trade value</small>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="create-btn">
              {loading ? 'Creating...' : 'Create League'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'join' && (
        <div className="join-league-tab">
          <form onSubmit={joinLeague} className="join-form">
            <h3>🎯 Join League</h3>
            
            <div className="form-group">
              <label>Invite Code</label>
              <input
                type="text"
                value={joinForm.inviteCode}
                onChange={(e) => setJoinForm({...joinForm, inviteCode: e.target.value})}
                required
                placeholder="Enter the league invite code"
              />
            </div>

            <button type="submit" disabled={loading} className="join-btn">
              {loading ? 'Joining...' : 'Join League'}
            </button>
          </form>

          <div className="join-help">
            <h4>How to join a league:</h4>
            <ol>
              <li>Get an invite code from a league creator</li>
              <li>Enter the code above and click "Join League"</li>
              <li>Your portfolio will be reset to the league's starting balance</li>
              <li>Start trading and climb the leaderboard! 🚀</li>
            </ol>
          </div>
        </div>
      )}

      {activeTab === 'public' && (
        <div className="public-leagues-tab">
          <div className="public-leagues-header">
            <h3>🌐 Public Leagues</h3>
            <p>Join any of these public leagues and start competing!</p>
          </div>

          <div className="leagues-list">
            {!Array.isArray(publicLeagues) || publicLeagues.length === 0 ? (
              <div className="empty-state">
                <p>🏟️ No public leagues available</p>
                <p>Create the first public league for everyone to join!</p>
              </div>
            ) : (
              publicLeagues.map(league => (
                <div key={league.id} className="league-card public-league">
                  <div className="league-info">
                    <h3>{league.name}</h3>
                    <p>{league.description}</p>
                    <div className="league-stats">
                      <span>👥 {league.memberIds.length} members</span>
                      <span>💰 ${league.startingBalance.toLocaleString()} start</span>
                      <span>📅 {new Date(league.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="league-features">
                    {league.settings.allowOptions && <span className="feature">📊 Options</span>}
                    {league.settings.allowShortSelling && <span className="feature">📉 Shorts</span>}
                    {league.settings.allowMargin && <span className="feature">💳 Margin</span>}
                    {league.settings.tradingFees && <span className="feature">💸 Fees: {league.settings.feePercentage}%</span>}
                  </div>
                  <div className="league-actions">
                    {league.memberIds.includes(userId) ? (
                      <button 
                        className="view-btn"
                        onClick={() => selectLeague(league)}
                      >
                        View League
                      </button>
                    ) : (
                      <button 
                        className="join-btn"
                        onClick={() => {
                          setJoinForm({ inviteCode: league.inviteCode });
                          setActiveTab('join');
                        }}
                      >
                        Join with Code: {league.inviteCode}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueManagement;

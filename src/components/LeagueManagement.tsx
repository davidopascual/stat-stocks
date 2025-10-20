import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'my-leagues' | 'create' | 'join'>('my-leagues');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchUserLeagues();
  }, [userId]);

  const fetchUserLeagues = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/leagues/user/${userId}`);
      const data = await response.json();
      setLeagues(data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const fetchLeaderboard = async (leagueId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/leagues/${leagueId}/leaderboard`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
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
          userId,
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
        alert(`League created! Invite code: ${result.inviteCode}`);
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
        alert(result.message);
      }
    } catch (error) {
      alert('Error creating league');
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
          inviteCode: joinForm.inviteCode
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Successfully joined ${result.league.name}!`);
        fetchUserLeagues();
        setActiveTab('my-leagues');
        setJoinForm({ inviteCode: '' });
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Error joining league');
    } finally {
      setLoading(false);
    }
  };

  const selectLeague = (league: League) => {
    setSelectedLeague(league);
    fetchLeaderboard(league.id);
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
                <h4>🏆 Leaderboard</h4>
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
    </div>
  );
};

export default LeagueManagement;

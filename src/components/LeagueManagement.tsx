import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface League {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  memberIds: string[];
  startingBalance: number;
  createdAt: string;
  inviteCode?: string;
  settings: {
    allowShortSelling: boolean;
    allowOptions: boolean;
    tradingHours?: {
      start: string;
      end: string;
    };
  };
}

const LeagueManagement: React.FC = () => {
  const { user, token } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newLeague, setNewLeague] = useState({
    name: '',
    description: '',
    startingBalance: 10000,
    allowShortSelling: false,
    allowOptions: false
  });

  useEffect(() => {
    fetchLeagues();
  }, [user]);

  const fetchLeagues = async () => {
    if (!user || !token) return;

    setLoading(true);
    try {
      // Fetch public leagues first
      const publicResponse = await fetch('http://localhost:3001/api/leagues/public');
      const publicLeagues = publicResponse.ok ? await publicResponse.json() : [];

      // Fetch user's leagues
      const userResponse = await fetch(`http://localhost:3001/api/leagues/user/${user.id}`);
      const userLeagues = userResponse.ok ? await userResponse.json() : [];

      // Combine and dedupe (user leagues take priority)
      const userLeagueIds = new Set(userLeagues.map((l: League) => l.id));
      const allLeagues = [
        ...userLeagues,
        ...publicLeagues.filter((l: League) => !userLeagueIds.has(l.id))
      ];

      setLeagues(allLeagues);
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎯 Create league clicked!');
    console.log('User:', user);
    
    if (!user) {
      console.error('❌ No user found!');
      alert('You must be logged in to create a league');
      return;
    }

    console.log('📝 League data:', newLeague);

    try {
      const payload = {
        creatorId: user.id,
        name: newLeague.name,
        description: newLeague.description,
        startingBalance: newLeague.startingBalance,
        settings: {
          allowShortSelling: newLeague.allowShortSelling,
          allowOptions: newLeague.allowOptions
        },
        isPrivate: false
      };

      console.log('📤 Sending request:', payload);

      const response = await fetch('http://localhost:3001/api/leagues/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ League created successfully!');
        // Add the new league to the list
        setLeagues([data.league, ...leagues]);
        setShowCreateForm(false);
        setNewLeague({
          name: '',
          description: '',
          startingBalance: 10000,
          allowShortSelling: false,
          allowOptions: false
        });
        alert(`League created! Invite code: ${data.inviteCode || data.league.inviteCode}`);
      } else {
        console.error('❌ Failed:', data.message);
        alert(data.message || 'Failed to create league');
      }
    } catch (error) {
      console.error('❌ Error creating league:', error);
      alert('Error creating league. Please try again.');
    }
  };

  const handleJoinLeague = async (inviteCode: string) => {
    if (!user) return;

    try {
      const response = await fetch('http://localhost:3001/api/leagues/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          inviteCode
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Successfully joined league!');
        fetchLeagues();
      } else {
        alert(data.message || 'Failed to join league');
      }
    } catch (error) {
      console.error('Failed to join league:', error);
      alert('Error joining league. Please try again.');
    }
  };

  return (
    <div className="league-management">
      <div className="league-header">
        <h1>🏆 Leagues</h1>
        <div className="header-actions">
          <button 
            className="join-league-btn"
            onClick={() => setShowJoinForm(!showJoinForm)}
          >
            {showJoinForm ? 'Cancel' : '🔗 Join League'}
          </button>
          <button 
            className="create-league-btn"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              if (showJoinForm) setShowJoinForm(false);
            }}
          >
            {showCreateForm ? 'Cancel' : '+ Create League'}
          </button>
        </div>
      </div>

      {showJoinForm && (
        <div className="join-league-form">
          <h2>Join a League</h2>
          <p>Enter the invite code shared by the league creator</p>
          <div className="invite-code-input">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code (e.g., ABC123)"
              maxLength={6}
            />
            <button 
              onClick={() => {
                if (inviteCode.trim()) {
                  handleJoinLeague(inviteCode);
                  setInviteCode('');
                  setShowJoinForm(false);
                }
              }}
              disabled={!inviteCode.trim()}
            >
              Join
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="create-league-form">
          <h2>Create New League</h2>
          <form onSubmit={handleCreateLeague}>
            <div className="form-group">
              <label htmlFor="league-name">League Name</label>
              <input
                id="league-name"
                type="text"
                value={newLeague.name}
                onChange={(e) => setNewLeague({ ...newLeague, name: e.target.value })}
                placeholder="My Awesome League"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="league-description">Description</label>
              <textarea
                id="league-description"
                value={newLeague.description}
                onChange={(e) => setNewLeague({ ...newLeague, description: e.target.value })}
                placeholder="Describe your league..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="starting-balance">Starting Balance</label>
              <input
                id="starting-balance"
                type="number"
                value={newLeague.startingBalance}
                onChange={(e) => setNewLeague({ ...newLeague, startingBalance: Number(e.target.value) })}
                min={1000}
                step={1000}
              />
            </div>

            <div className="form-group-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={newLeague.allowShortSelling}
                  onChange={(e) => setNewLeague({ ...newLeague, allowShortSelling: e.target.checked })}
                />
                Allow Short Selling
              </label>
            </div>

            <div className="form-group-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={newLeague.allowOptions}
                  onChange={(e) => setNewLeague({ ...newLeague, allowOptions: e.target.checked })}
                />
                Allow Options Trading
              </label>
            </div>

            <button type="submit" className="submit-btn">
              Create League
            </button>
          </form>
        </div>
      )}

      <div className="leagues-list">
        {loading ? (
          <div className="loading">Loading leagues...</div>
        ) : leagues.length === 0 ? (
          <div className="empty-state">
            <h3>No leagues yet</h3>
            <p>Create a league or join an existing one to get started!</p>
          </div>
        ) : (
          <div className="leagues-grid">
            {leagues.map((league) => (
              <div key={league.id} className="league-card">
                <div className="league-card-header">
                  <h3>{league.name}</h3>
                  <span className="member-count">{league.memberIds.length} members</span>
                </div>
                <p className="league-description">{league.description}</p>
                <div className="league-info">
                  <div className="info-item">
                    <span className="info-label">Starting Balance:</span>
                    <span className="info-value">${league.startingBalance.toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Features:</span>
                    <span className="info-value">
                      {league.settings.allowShortSelling && '📉 Shorts '}
                      {league.settings.allowOptions && '📊 Options'}
                      {!league.settings.allowShortSelling && !league.settings.allowOptions && 'Basic Trading'}
                    </span>
                  </div>
                  {league.creatorId === user?.id && (
                    <div className="info-item invite-code-item">
                      <span className="info-label">Invite Code:</span>
                      <span className="info-value invite-code">
                        {league.inviteCode || league.id.substring(0, 6).toUpperCase()}
                        <button 
                          className="copy-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(league.inviteCode || league.id.substring(0, 6).toUpperCase());
                            alert('Invite code copied to clipboard!');
                          }}
                          title="Copy invite code"
                        >
                          📋
                        </button>
                      </span>
                    </div>
                  )}
                </div>
                <div className="league-actions">
                  {league.memberIds.includes(user?.id || '') ? (
                    <>
                      <button className="view-btn">View Leaderboard</button>
                      {league.creatorId === user?.id && (
                        <span className="creator-badge">👑 Creator</span>
                      )}
                    </>
                  ) : (
                    <button 
                      className="join-btn"
                      onClick={() => {
                        const code = league.inviteCode || league.id.substring(0, 6).toUpperCase();
                        setInviteCode(code);
                        handleJoinLeague(code);
                      }}
                    >
                      Join League
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .league-management {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .league-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .league-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #e7e9ea;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .join-league-btn {
          background: rgba(29, 155, 240, 0.1);
          color: #1d9bf0;
          border: 1px solid rgba(29, 155, 240, 0.3);
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .join-league-btn:hover {
          background: rgba(29, 155, 240, 0.2);
          transform: translateY(-2px);
        }

        .create-league-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .create-league-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .create-league-form {
          background: rgba(30, 33, 38, 0.6);
          border: 1px solid rgba(71, 85, 105, 0.3);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .join-league-form {
          background: rgba(30, 33, 38, 0.6);
          border: 1px solid rgba(29, 155, 240, 0.3);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .join-league-form h2 {
          font-size: 20px;
          font-weight: 600;
          color: #e7e9ea;
          margin-bottom: 8px;
        }

        .join-league-form p {
          color: #71767b;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .invite-code-input {
          display: flex;
          gap: 12px;
        }

        .invite-code-input input {
          flex: 1;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 8px;
          padding: 12px;
          color: #e7e9ea;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 2px;
          text-align: center;
          text-transform: uppercase;
        }

        .invite-code-input button {
          background: linear-gradient(135deg, #1d9bf0 0%, #0c7abf 100%);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .invite-code-input button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .invite-code-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .create-league-form h2 {
          font-size: 20px;
          font-weight: 600;
          color: #e7e9ea;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #a0aec0;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 8px;
          padding: 12px;
          color: #e7e9ea;
          font-size: 15px;
        }

        .form-group textarea {
          resize: vertical;
          font-family: inherit;
        }

        .form-group-checkbox {
          margin-bottom: 12px;
        }

        .form-group-checkbox label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #e7e9ea;
          font-size: 14px;
          cursor: pointer;
        }

        .form-group-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .submit-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
          margin-top: 8px;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
        }

        .leagues-list {
          margin-top: 32px;
        }

        .loading,
        .empty-state {
          text-align: center;
          padding: 64px 32px;
          color: #71767b;
        }

        .empty-state h3 {
          font-size: 24px;
          color: #e7e9ea;
          margin-bottom: 12px;
        }

        .leagues-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }

        .league-card {
          background: rgba(30, 33, 38, 0.6);
          border: 1px solid rgba(71, 85, 105, 0.3);
          border-radius: 16px;
          padding: 24px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .league-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .league-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .league-card-header h3 {
          font-size: 20px;
          font-weight: 600;
          color: #e7e9ea;
        }

        .member-count {
          background: rgba(29, 155, 240, 0.1);
          color: #1d9bf0;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }

        .league-description {
          color: #a0aec0;
          font-size: 14px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .league-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(15, 23, 42, 0.4);
          border-radius: 8px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          font-size: 13px;
          color: #71767b;
        }

        .info-value {
          font-size: 13px;
          font-weight: 600;
          color: #e7e9ea;
        }

        .invite-code-item {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(71, 85, 105, 0.3);
        }

        .invite-code {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(29, 155, 240, 0.1);
          padding: 6px 12px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          letter-spacing: 2px;
          color: #1d9bf0;
        }

        .copy-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          transition: transform 0.2s;
        }

        .copy-btn:hover {
          transform: scale(1.2);
        }

        .league-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .creator-badge {
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
          color: #1a1a2e;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .view-btn,
        .join-btn {
          flex: 1;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-btn {
          background: rgba(29, 155, 240, 0.1);
          color: #1d9bf0;
          border: 1px solid rgba(29, 155, 240, 0.3);
        }

        .view-btn:hover {
          background: rgba(29, 155, 240, 0.2);
        }

        .join-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .join-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
      `}</style>
    </div>
  );
};

export default LeagueManagement;

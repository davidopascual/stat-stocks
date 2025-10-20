import React, { useState, useEffect } from 'react';
import { Option, OptionPosition, Player } from '../types';
import toast from 'react-hot-toast';
import OptionsConfirmationModal from './OptionsConfirmationModal';
import ExerciseOptionsModal from './ExerciseOptionsModal';

interface OptionsTab {
  player: Player;
  userId: string;
}

const OptionsTrading: React.FC<OptionsTab> = ({ player, userId }) => {
  const [optionsChain, setOptionsChain] = useState<Option[]>([]);
  const [positions, setPositions] = useState<OptionPosition[]>([]);
  const [selectedExpiration, setSelectedExpiration] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'CALL' | 'PUT'>('ALL');
  const [activeTab, setActiveTab] = useState<'chain' | 'positions'>('chain');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<OptionPosition | null>(null);

  useEffect(() => {
    fetchOptionsChain();
    fetchPositions();
  }, [player.id]);

  const fetchOptionsChain = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/options/chain/${player.id}`);
      const data = await res.json();
      setOptionsChain(data);

      if (data.length > 0 && !selectedExpiration) {
        setSelectedExpiration(data[0].expirationDate);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/options/positions/${userId}`);
      const data = await res.json();
      setPositions(data.filter((p: OptionPosition) => {
        const option = optionsChain.find(o => o.id === p.optionId);
        return option?.playerId === player.id;
      }));
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const handleBuyClick = (option: Option) => {
    setSelectedOption(option);
    setShowBuyModal(true);
  };

  const handleConfirmBuy = async (contracts: number) => {
    if (!selectedOption || contracts <= 0) return;

    const cost = selectedOption.premium * contracts * 100;

    console.log('🎯 Attempting to buy option:', { userId, optionId: selectedOption.id, contracts, cost });

    try {
      const res = await fetch('http://localhost:3001/api/options/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, optionId: selectedOption.id, contracts })
      });

      console.log('📊 Response status:', res.status);
      const result = await res.json();
      console.log('📊 Response data:', result);

      if (result.success) {
        toast.success(
          `Successfully bought ${contracts} ${selectedOption.type} contract${contracts > 1 ? 's' : ''} for $${cost.toFixed(2)}`,
          {
            style: {
              background: '#1a1a2e',
              color: '#e7e9ea',
              border: `1px solid ${selectedOption.type === 'CALL' ? '#00ba7c' : '#f4212e'}`
            },
            duration: 4000
          }
        );
        fetchPositions();
        setShowBuyModal(false);
      } else {
        toast.error(result.message, {
          style: { background: '#1a1a2e', color: '#e7e9ea', border: '1px solid #f4212e' }
        });
      }
    } catch (error) {
      toast.error('Error buying option', {
        style: { background: '#1a1a2e', color: '#e7e9ea', border: '1px solid #f4212e' }
      });
    }
  };

  const handleExerciseClick = (position: OptionPosition) => {
    setSelectedPosition(position);
    setShowExerciseModal(true);
  };

  const handleConfirmExercise = async () => {
    if (!selectedPosition) return;

    try {
      const res = await fetch('http://localhost:3001/api/options/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, positionId: selectedPosition.id })
      });

      const result = await res.json();
      if (result.success) {
        const option = optionsChain.find(o => o.id === selectedPosition.optionId);
        toast.success(
          `Successfully exercised ${option?.type} option. ${result.message}`,
          {
            style: { background: '#1a1a2e', color: '#e7e9ea', border: '1px solid #00ba7c' },
            duration: 5000
          }
        );
        fetchPositions();
        setShowExerciseModal(false);
      } else {
        toast.error(result.message, {
          style: { background: '#1a1a2e', color: '#e7e9ea', border: '1px solid #f4212e' }
        });
      }
    } catch (error) {
      toast.error('Error exercising option', {
        style: { background: '#1a1a2e', color: '#e7e9ea', border: '1px solid #f4212e' }
      });
    }
  };

  const expirations = [...new Set(optionsChain.map(o => o.expirationDate))];

  const filteredOptions = optionsChain.filter(o => {
    const matchesExp = !selectedExpiration || o.expirationDate === selectedExpiration;
    const matchesType = filterType === 'ALL' || o.type === filterType;
    return matchesExp && matchesType;
  });

  const callOptions = filteredOptions.filter(o => o.type === 'CALL').sort((a, b) => a.strikePrice - b.strikePrice);
  const putOptions = filteredOptions.filter(o => o.type === 'PUT').sort((a, b) => a.strikePrice - b.strikePrice);

  return (
    <div className="options-trading">
      <div className="options-header">
        <h3>Options Trading</h3>
        <div className="tab-buttons">
          <button
            className={activeTab === 'chain' ? 'active' : ''}
            onClick={() => setActiveTab('chain')}
          >
            Options Chain
          </button>
          <button
            className={activeTab === 'positions' ? 'active' : ''}
            onClick={() => setActiveTab('positions')}
          >
            My Positions ({positions.length})
          </button>
        </div>
      </div>

      {activeTab === 'chain' && (
        <>
          <div className="options-controls">
            <select
              value={selectedExpiration}
              onChange={(e) => setSelectedExpiration(e.target.value)}
            >
              {expirations.map(exp => (
                <option key={exp} value={exp}>
                  Expires: {new Date(exp).toLocaleDateString()}
                </option>
              ))}
            </select>

            <div className="filter-buttons">
              <button
                className={filterType === 'ALL' ? 'active' : ''}
                onClick={() => setFilterType('ALL')}
              >
                All
              </button>
              <button
                className={filterType === 'CALL' ? 'active' : ''}
                onClick={() => setFilterType('CALL')}
              >
                Calls
              </button>
              <button
                className={filterType === 'PUT' ? 'active' : ''}
                onClick={() => setFilterType('PUT')}
              >
                Puts
              </button>
            </div>
          </div>

          <div className="options-chain-grid">
            {/* Calls Table */}
            {(filterType === 'ALL' || filterType === 'CALL') && (
              <div className="options-table">
                <h4>Call Options</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Strike</th>
                      <th>Premium</th>
                      <th>ITM</th>
                      <th>Intrinsic</th>
                      <th>Time Value</th>
                      <th>IV</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callOptions.map(option => (
                      <tr
                        key={option.id}
                        className={option.inTheMoney ? 'in-the-money' : 'out-of-money'}
                      >
                        <td className="strike-price">${option.strikePrice}</td>
                        <td className="premium">${option.premium.toFixed(2)}</td>
                        <td>{option.inTheMoney ? '✓ Yes' : '✗ No'}</td>
                        <td>${option.intrinsicValue.toFixed(2)}</td>
                        <td>${option.timeValue.toFixed(2)}</td>
                        <td>{(option.impliedVolatility * 100).toFixed(1)}%</td>
                        <td>
                          <button
                            className="buy-btn"
                            onClick={() => handleBuyClick(option)}
                          >
                            Review Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Puts Table */}
            {(filterType === 'ALL' || filterType === 'PUT') && (
              <div className="options-table">
                <h4>Put Options</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Strike</th>
                      <th>Premium</th>
                      <th>ITM</th>
                      <th>Intrinsic</th>
                      <th>Time Value</th>
                      <th>IV</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {putOptions.map(option => (
                      <tr
                        key={option.id}
                        className={option.inTheMoney ? 'in-the-money' : 'out-of-money'}
                      >
                        <td className="strike-price">${option.strikePrice}</td>
                        <td className="premium">${option.premium.toFixed(2)}</td>
                        <td>{option.inTheMoney ? '✓ Yes' : '✗ No'}</td>
                        <td>${option.intrinsicValue.toFixed(2)}</td>
                        <td>${option.timeValue.toFixed(2)}</td>
                        <td>{(option.impliedVolatility * 100).toFixed(1)}%</td>
                        <td>
                          <button
                            className="buy-btn"
                            onClick={() => handleBuyClick(option)}
                          >
                            Review Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="options-info">
            <p><strong>How Options Work:</strong></p>
            <p>• <strong>Call:</strong> Right to BUY at strike price (profit when price goes UP)</p>
            <p>• <strong>Put:</strong> Right to SELL at strike price (profit when price goes DOWN)</p>
            <p>• <strong>ITM:</strong> In-the-money = option has intrinsic value</p>
            <p>• <strong>1 Contract:</strong> Controls 100 shares</p>
          </div>
        </>
      )}

      {activeTab === 'positions' && (
        <div className="options-positions">
          {positions.length === 0 ? (
            <div className="empty-state">
              <p>No option positions yet</p>
              <p>Switch to "Options Chain" tab to buy options</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Strike</th>
                  <th>Contracts</th>
                  <th>Purchase Price</th>
                  <th>Current Price</th>
                  <th>P&L</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(position => {
                  const option = optionsChain.find(o => o.id === position.optionId);
                  if (!option) return null;

                  const pnl = (option.currentPrice - position.purchasePrice) * position.contracts * 100;

                  return (
                    <tr key={position.id}>
                      <td className={option.type === 'CALL' ? 'call-type' : 'put-type'}>
                        {option.type}
                      </td>
                      <td>${option.strikePrice}</td>
                      <td>{position.contracts}</td>
                      <td>${position.purchasePrice.toFixed(2)}</td>
                      <td>${option.currentPrice.toFixed(2)}</td>
                      <td className={pnl >= 0 ? 'positive' : 'negative'}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </td>
                      <td>
                        {option.inTheMoney && (
                          <button
                            className="exercise-btn"
                            onClick={() => handleExerciseClick(position)}
                          >
                            Exercise
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Options Buy Modal */}
      {selectedOption && (
        <OptionsConfirmationModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          onConfirm={handleConfirmBuy}
          optionDetails={{
            type: selectedOption.type,
            playerName: selectedOption.playerName,
            strikePrice: selectedOption.strikePrice,
            premium: selectedOption.premium,
            expirationDate: selectedOption.expirationDate,
            inTheMoney: selectedOption.inTheMoney
          }}
        />
      )}

      {/* Exercise Options Modal */}
      {selectedPosition && (() => {
        const option = optionsChain.find(o => o.id === selectedPosition.optionId);
        if (!option) return null;

        const profitPerShare = option.type === 'CALL'
          ? option.currentPrice - option.strikePrice
          : option.strikePrice - option.currentPrice;

        return (
          <ExerciseOptionsModal
            isOpen={showExerciseModal}
            onClose={() => setShowExerciseModal(false)}
            onConfirm={handleConfirmExercise}
            exerciseDetails={{
              type: option.type,
              playerName: option.playerName,
              strikePrice: option.strikePrice,
              currentPrice: option.currentPrice,
              contracts: selectedPosition.contracts,
              profitPerShare
            }}
          />
        );
      })()}
    </div>
  );
};

export default OptionsTrading;

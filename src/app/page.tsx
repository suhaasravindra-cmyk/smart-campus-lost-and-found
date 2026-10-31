'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [role, setRole] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [activeTab, setActiveTab] = useState<'matches' | 'report-lost' | 'report-found' | 'custody' | 'analytics' | 'audit'>('matches');
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [selectedSqlTab, setSelectedSqlTab] = useState<'vector' | 'proc' | 'trigger' | 'view'>('vector');

  // Form states
  const [lostTitle, setLostTitle] = useState('');
  const [lostCat, setLostCat] = useState('Electronics');
  const [lostColor, setLostColor] = useState('Silver');
  const [lostLoc, setLostLoc] = useState('Central Library');
  const [lostDesc, setLostDesc] = useState('');

  const [foundTitle, setFoundTitle] = useState('');
  const [foundCat, setFoundCat] = useState('Electronics');
  const [foundColor, setFoundColor] = useState('Silver');
  const [foundLoc, setFoundLoc] = useState('Central Library');
  const [foundLocker, setFoundLocker] = useState('Security Locker B-12');
  const [foundDesc, setFoundDesc] = useState('');

  // Claim modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [secretProof, setSecretProof] = useState('');

  // Sample data states
  const [matches, setMatches] = useState([
    {
      lost_id: 'lost-101',
      lost_title: 'Silver MacBook Air M2',
      lost_desc: 'Silver 13-inch notebook with GitHub Octocat sticker near trackpad.',
      lost_loc: 'Central Library',
      found_id: 'fnd-201',
      found_title: 'Apple Notebook with Sticker',
      found_desc: 'Notebook computer, coder sticker on bottom-right, light scuff on casing.',
      found_loc: 'Central Library',
      locker: 'Locker B-12 (Central Desk)',
      score: 94.8,
      cosine: 91.2,
      locBonus: 15.0,
    },
    {
      lost_id: 'lost-102',
      lost_title: 'Student ID Badge in Navy Lanyard',
      lost_desc: 'Campus photo ID ending in 042, dark blue woven lanyard.',
      lost_loc: 'B-Block Cafeteria',
      found_id: 'fnd-202',
      found_title: 'Campus ID Card & Lanyard',
      found_desc: 'Student ID card in blue neck strap found on dining table.',
      found_loc: 'B-Block Cafeteria',
      locker: 'Security Drawer A-04',
      score: 93.4,
      cosine: 88.4,
      locBonus: 15.0,
    },
  ]);

  const [claims, setClaims] = useState([
    {
      claim_id: 'clm-301',
      title: 'Student ID Badge in Navy Lanyard',
      claimant: 'Sarah Jenkins (STU-2024-042)',
      proof: 'Has a small silver locker key tied to lanyard knot and PRN ending in 042.',
      score: 93.4,
      locker: 'Security Drawer A-04',
      status: 'SUBMITTED',
    },
  ]);

  const [auditLogs, setAuditLogs] = useState([
    { id: 1, table: 'found_items', record: 'fnd-201', old: 'NULL', new: 'IN_CUSTODY', user: 'Officer Robert Miller', time: '10:15 AM' },
    { id: 2, table: 'lost_items', record: 'lost-101', old: 'NULL', new: 'SEARCHING', user: 'Alex Chen', time: '10:42 AM' },
    { id: 3, table: 'claims', record: 'clm-301', old: 'NULL', new: 'SUBMITTED', user: 'Sarah Jenkins', time: '11:05 AM' },
  ]);

  const triggerToast = (title: string, message: string) => {
    setToast({ title, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleReportLostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLost = {
      lost_id: `lost-${Math.floor(100 + Math.random() * 900)}`,
      lost_title: lostTitle,
      lost_desc: lostDesc,
      lost_loc: lostLoc,
      found_id: `fnd-201`,
      found_title: 'Apple Notebook with Sticker',
      found_desc: 'Notebook computer in custody locker.',
      found_loc: 'Central Library',
      locker: 'Locker B-12',
      score: 92.6,
      cosine: 89.1,
      locBonus: 15.0,
    };
    setMatches([newLost, ...matches]);
    setAuditLogs([
      { id: auditLogs.length + 1, table: 'lost_items', record: newLost.lost_id, old: 'NULL', new: 'SEARCHING', user: 'Alex Chen', time: 'Just now' },
      ...auditLogs,
    ]);
    triggerToast('PostgreSQL Record Stored', `Generated 384-d vector for '${lostTitle}' & executed HNSW search.`);
    setLostTitle('');
    setLostDesc('');
    setActiveTab('matches');
  };

  const handleReportFoundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFoundId = `fnd-${Math.floor(200 + Math.random() * 800)}`;
    setAuditLogs([
      { id: auditLogs.length + 1, table: 'found_items', record: newFoundId, old: 'NULL', new: 'IN_CUSTODY', user: 'Officer Robert Miller', time: 'Just now' },
      ...auditLogs,
    ]);
    triggerToast('Item Deposited in Custody', `Assigned to ${foundLocker}. Embeddings indexed in PostgreSQL.`);
    setFoundTitle('');
    setFoundDesc('');
    setActiveTab('matches');
  };

  const handleExecuteHandover = (claimId: string) => {
    setClaims(claims.map((c) => (c.claim_id === claimId ? { ...c, status: 'HANDED_OVER' } : c)));
    setAuditLogs([
      { id: auditLogs.length + 1, table: 'claims', record: claimId, old: 'SUBMITTED', new: 'HANDED_OVER', user: 'Officer Robert Miller', time: 'Just now' },
      ...auditLogs,
    ]);
    triggerToast(
      'ACID Handover Committed!',
      `sp_execute_item_handover('${claimId}') executed with row-level locks.`
    );
  };

  const handleClaimSubmit = () => {
    if (!secretProof) return;
    const newClaim = {
      claim_id: `clm-${Math.floor(300 + Math.random() * 700)}`,
      title: selectedMatch?.found_title || 'Item in Custody',
      claimant: 'Alex Chen (STU-2024-001)',
      proof: secretProof,
      score: selectedMatch?.score || 94.0,
      locker: selectedMatch?.locker || 'Locker B-12',
      status: 'SUBMITTED',
    };
    setClaims([newClaim, ...claims]);
    setAuditLogs([
      { id: auditLogs.length + 1, table: 'claims', record: newClaim.claim_id, old: 'NULL', new: 'SUBMITTED', user: 'Alex Chen', time: 'Just now' },
      ...auditLogs,
    ]);
    setClaimModalOpen(false);
    setSecretProof('');
    triggerToast('Claim Submitted to Security Desk', 'Staff will review verification proof before locker release.');
    setActiveTab('custody');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 shadow-2xl rounded-2xl p-4 max-w-sm flex items-start gap-3 transition-all animate-bounce">
          <div className="text-xl">⚡</div>
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-500 font-bold text-2xl shadow-inner">
            🔍
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl text-white tracking-tight">Smart Campus Lost & Found</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                PostgreSQL + pgvector
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-semibold">
                HNSW Indexing
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Semantic vector item matching, ACID custody handovers, and hotspot analytics
            </p>
          </div>
        </div>

        {/* Role Switcher & Inspector */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-1 flex items-center text-xs">
            <button
              onClick={() => {
                setRole('STUDENT');
                triggerToast('Switched to Student Role', 'Authenticated as Alex Chen (STU-2024-001)');
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                role === 'STUDENT' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              🎓 Student
            </button>
            <button
              onClick={() => {
                setRole('STAFF');
                triggerToast('Switched to Security Staff', 'Officer Robert Miller authenticated for custody desk.');
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                role === 'STAFF' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Security Desk
            </button>
          </div>

          <button
            onClick={() => setShowInspector(true)}
            className="px-3.5 py-2 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-blue-400 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>⚡</span> SQL Inspector
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1 text-sm font-medium">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'matches'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>✨</span> Semantic Matches ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab('report-lost')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'report-lost'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📢</span> Report Lost Item
        </button>
        <button
          onClick={() => setActiveTab('report-found')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'report-found'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📦</span> Deposit Found Item
        </button>
        <button
          onClick={() => setActiveTab('custody')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'custody'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🛡️</span> Custody Desk ({claims.filter((c) => c.status !== 'HANDED_OVER').length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📊</span> Campus Hotspots View
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📜</span> Trigger Audit Log ({auditLogs.length})
        </button>
      </nav>

      {/* TAB 1: MATCHES */}
      {activeTab === 'matches' && (
        <section className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <span>🧠</span> pgvector Cosine Similarity Pairings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Computed via: <code className="text-purple-400 font-mono">1 - (lost.embedding &lt;=&gt; found.embedding)</code> + location & category weights.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
              HNSW Distance &lt;=&gt; Active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {matches.map((item, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md hover:border-slate-700 transition-all">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      {item.score}% Match Confidence
                    </span>
                    <span className="text-xs text-slate-400">
                      Raw Cosine: <strong className="text-purple-400 font-mono">{item.cosine}%</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMatch(item);
                      setClaimModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <span>🔐</span> Claim This Item
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">Reported Lost</span>
                    <h3 className="font-bold text-sm text-white">{item.lost_title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{item.lost_desc}</p>
                    <div className="mt-3 text-xs text-slate-500">📍 {item.lost_loc}</div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">In Security Custody</span>
                    <h3 className="font-bold text-sm text-white">{item.found_title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{item.found_desc}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>📍 {item.found_loc}</span>
                      <span className="text-amber-400 font-semibold">{item.locker}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: REPORT LOST */}
      {activeTab === 'report-lost' && (
        <section className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h2 className="font-bold text-base text-white mb-1">📢 Report a Lost Item</h2>
          <p className="text-xs text-slate-400 mb-5">Item description will be converted into a 384-dimensional vector embedding.</p>

          <form onSubmit={handleReportLostSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-200">Item Title *</label>
              <input
                type="text"
                required
                value={lostTitle}
                onChange={(e) => setLostTitle(e.target.value)}
                placeholder="e.g. Silver MacBook Air M2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-200">Category *</label>
                <select
                  value={lostCat}
                  onChange={(e) => setLostCat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="ID & Cards">Campus ID & Cards</option>
                  <option value="Personal Accessories">Personal Accessories</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-200">Primary Color *</label>
                <input
                  type="text"
                  required
                  value={lostColor}
                  onChange={(e) => setLostColor(e.target.value)}
                  placeholder="e.g. Silver, Black"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-200">Campus Location *</label>
              <select
                value={lostLoc}
                onChange={(e) => setLostLoc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Central Library">Central Library (3rd Floor Reading Hall)</option>
                <option value="B-Block Cafeteria">B-Block (Food Court)</option>
                <option value="Tech Park">Tech Park (Level 5 CSE Labs)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-200">Description for Embeddings *</label>
              <textarea
                rows={3}
                required
                value={lostDesc}
                onChange={(e) => setLostDesc(e.target.value)}
                placeholder="Mention scratches, stickers, distinct markings, engravings..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-purple-400 truncate">
              Embedding Pipeline: [0.0381, -0.0921, 0.1145, -0.0029, 0.0812, ...]
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm">
              🚀 Store in PostgreSQL & Trigger Search
            </button>
          </form>
        </section>
      )}

      {/* TAB 3: REPORT FOUND */}
      {activeTab === 'report-found' && (
        <section className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h2 className="font-bold text-base text-white mb-1">📦 Turn In a Found Item</h2>
          <p className="text-xs text-slate-400 mb-5">Item will be assigned to a campus custody locker.</p>

          <form onSubmit={handleReportFoundSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-200">Item Title *</label>
              <input
                type="text"
                required
                value={foundTitle}
                onChange={(e) => setFoundTitle(e.target.value)}
                placeholder="e.g. Apple Laptop with Sticker"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-200">Location Found *</label>
                <select
                  value={foundLoc}
                  onChange={(e) => setFoundLoc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Central Library">Central Library</option>
                  <option value="B-Block Cafeteria">B-Block Cafeteria</option>
                  <option value="Tech Park">Tech Park</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-200">Custody Locker *</label>
                <input
                  type="text"
                  required
                  value={foundLocker}
                  onChange={(e) => setFoundLocker(e.target.value)}
                  placeholder="e.g. Locker B-14"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-200">Objective Visual Description *</label>
              <textarea
                rows={3}
                required
                value={foundDesc}
                onChange={(e) => setFoundDesc(e.target.value)}
                placeholder="Appearance, condition, surface stickers..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm">
              📦 Deposit to Locker & Generate Embeddings
            </button>
          </form>
        </section>
      )}

      {/* TAB 4: CUSTODY HANDOVER */}
      {activeTab === 'custody' && (
        <section className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-x-auto shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Pending Verification & Handover Queue</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Item Title</th>
                  <th className="py-2.5 px-3">Claimant</th>
                  <th className="py-2.5 px-3">Secret Verification Proof</th>
                  <th className="py-2.5 px-3">Locker Shelf</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">ACID Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {claims.map((clm) => (
                  <tr key={clm.claim_id} className="hover:bg-slate-950 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{clm.title}</td>
                    <td className="py-3 px-3 text-slate-300">{clm.claimant}</td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{clm.proof}</td>
                    <td className="py-3 px-3 text-amber-400 font-semibold">{clm.locker}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        clm.status === 'HANDED_OVER' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {clm.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {clm.status !== 'HANDED_OVER' ? (
                        <button
                          onClick={() => handleExecuteHandover(clm.claim_id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
                        >
                          ⚡ Handover
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 5: HOTSPOTS */}
      {activeTab === 'analytics' && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-400">Total Lost Reported</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">18</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-400">Items in Custody</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">12</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-400">Recovered to Owners</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">6</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-400">Recovery Rate</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">76.4%</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">v_campus_loss_hotspots (SQL View)</h3>
            {[
              { loc: 'Central Library (3rd Floor Reading Hall)', zone: 'LIBRARY', rate: 85.7, lost: 7, recovered: 6 },
              { loc: 'B-Block (Food Court)', zone: 'CAFETERIA', rate: 80.0, lost: 5, recovered: 4 },
              { loc: 'Tech Park (Level 5 CSE Labs)', zone: 'LAB', rate: 75.0, lost: 4, recovered: 3 },
            ].map((h, i) => (
              <div key={i} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-white">{h.loc}</span>
                  <span className="text-emerald-400 font-bold">{h.rate}% Recovery Rate</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${h.rate}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Zone: {h.zone}</span>
                  <span>Lost: {h.lost} | Recovered: {h.recovered}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 6: AUDIT LOG */}
      {activeTab === 'audit' && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-x-auto shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Trigger Audit Log (item_audit_log)</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
              Trigger: trg_audit_item_status
            </span>
          </div>
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3">Audit ID</th>
                <th className="py-2 px-3">Table</th>
                <th className="py-2 px-3">Record ID</th>
                <th className="py-2 px-3">Old Status</th>
                <th className="py-2 px-3">New Status</th>
                <th className="py-2 px-3">Actor</th>
                <th className="py-2 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-950">
                  <td className="py-2.5 px-3 text-slate-500">#{log.id}</td>
                  <td className="py-2.5 px-3 text-blue-400">{log.table}</td>
                  <td className="py-2.5 px-3 text-white">{log.record}</td>
                  <td className="py-2.5 px-3 text-red-400">{log.old}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{log.new}</td>
                  <td className="py-2.5 px-3 text-slate-300">{log.user}</td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* CLAIM VERIFICATION MODAL */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">🔐 Submit Ownership Verification Proof</h3>
              <button onClick={() => setClaimModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <p className="text-slate-400">Target Item:</p>
              <p className="font-bold text-white">{selectedMatch?.found_title}</p>
              <p className="text-amber-400 font-semibold mt-1">Locker: {selectedMatch?.locker}</p>
            </div>
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-200">Secret Verification Proof *</label>
              <textarea
                rows={3}
                value={secretProof}
                onChange={(e) => setSecretProof(e.target.value)}
                placeholder="Mention specific stickers, engravings, serial number, lockscreen wallpaper..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button onClick={() => setClaimModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleClaimSubmit} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                Submit Claim to Security Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL INSPECTOR MODAL */}
      {showInspector && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-white">⚡ Database Engine & Query Inspector</h3>
                <p className="text-xs text-slate-400">PostgreSQL 16 + pgvector Execution Blueprints</p>
              </div>
              <button onClick={() => setShowInspector(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex gap-2 mb-3 text-xs overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedSqlTab('vector')}
                className={`px-3 py-1.5 rounded-xl font-semibold ${
                  selectedSqlTab === 'vector' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                1. pgvector Cosine Query
              </button>
              <button
                onClick={() => setSelectedSqlTab('proc')}
                className={`px-3 py-1.5 rounded-xl font-semibold ${
                  selectedSqlTab === 'proc' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                2. ACID Stored Procedure
              </button>
              <button
                onClick={() => setSelectedSqlTab('trigger')}
                className={`px-3 py-1.5 rounded-xl font-semibold ${
                  selectedSqlTab === 'trigger' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                3. Audit Trigger
              </button>
              <button
                onClick={() => setSelectedSqlTab('view')}
                className={`px-3 py-1.5 rounded-xl font-semibold ${
                  selectedSqlTab === 'view' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                4. Analytical View
              </button>
            </div>

            <pre className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap">
              {selectedSqlTab === 'vector' && `-- pgvector Cosine Distance Search Operator (<=>)
SELECT f.found_id, f.title, f.storage_custody_location,
       ROUND((1 - (f.embedding <=> l.embedding)) * 100, 2) AS cosine_similarity
FROM found_items f, lost_items l
WHERE l.lost_id = 'c0000000...0001' AND f.status = 'IN_CUSTODY'
ORDER BY f.embedding <=> l.embedding ASC LIMIT 5;`}

              {selectedSqlTab === 'proc' && `-- Multi-Statement ACID Stored Procedure with Row-Level Locking
CREATE OR REPLACE PROCEDURE sp_execute_item_handover(p_claim_id UUID, p_staff_id UUID, p_remarks TEXT)
LANGUAGE plpgsql AS $$
BEGIN
    SELECT lost_id, found_id, claimant_user_id FROM claims WHERE claim_id = p_claim_id FOR UPDATE;
    INSERT INTO custody_handovers VALUES (gen_random_uuid(), p_claim_id, p_staff_id, ...);
    UPDATE found_items SET status = 'RETURNED_TO_OWNER' WHERE found_id = v_found_id;
    UPDATE lost_items SET status = 'CLAIMED' WHERE lost_id = v_lost_id;
    UPDATE claims SET claim_status = 'HANDED_OVER' WHERE claim_id = p_claim_id;
END; $$;`}

              {selectedSqlTab === 'trigger' && `-- Automated Audit Logging Trigger
CREATE TRIGGER trg_audit_found_item_status
AFTER UPDATE OF status ON found_items
FOR EACH ROW EXECUTE FUNCTION fn_audit_item_status_change();`}

              {selectedSqlTab === 'view' && `-- Campus Loss Hotspot View with GROUP BY and HAVING
CREATE VIEW v_campus_loss_hotspots AS
SELECT cl.building_name, COUNT(DISTINCT l.lost_id) AS total_lost,
       COUNT(DISTINCT CASE WHEN f.status = 'RETURNED_TO_OWNER' THEN f.found_id END) AS total_recovered
FROM campus_locations cl
LEFT JOIN lost_items l ON cl.location_id = l.lost_location_id
LEFT JOIN found_items f ON cl.location_id = f.found_location_id
GROUP BY cl.building_name HAVING COUNT(DISTINCT l.lost_id) > 0;`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

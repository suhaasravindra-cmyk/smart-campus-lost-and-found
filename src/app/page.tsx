'use client';

import React, { useState } from 'react';

export default function Home() {
  const [role, setRole] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [activeTab, setActiveTab] = useState<'matches' | 'report-lost' | 'report-found' | 'custody' | 'locations'>('matches');
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [selectedSqlTab, setSelectedSqlTab] = useState<'vector' | 'proc' | 'trigger' | 'view'>('vector');

  // Form states
  const [lostTitle, setLostTitle] = useState('');
  const [lostCat, setLostCat] = useState('Electronics');
  const [lostColor, setLostColor] = useState('Silver');
  const [lostLoc, setLostLoc] = useState('Central Library (3rd Floor)');
  const [lostDesc, setLostDesc] = useState('');

  const [foundTitle, setFoundTitle] = useState('');
  const [foundCat, setFoundCat] = useState('Electronics');
  const [foundColor, setFoundColor] = useState('Silver');
  const [foundLoc, setFoundLoc] = useState('Central Library (3rd Floor)');
  const [foundLocker, setFoundLocker] = useState('Front Security Desk (Locker B-12)');
  const [foundDesc, setFoundDesc] = useState('');

  // Claim modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [secretProof, setSecretProof] = useState('');

  // Items State
  const [matches, setMatches] = useState([
    {
      id: 'item-1',
      lost_title: '13" MacBook Air M2',
      lost_desc: 'Silver aluminum laptop with a small GitHub sticker near trackpad.',
      lost_loc: 'Central Library, 3rd Floor',
      lost_date: '2 days ago',
      found_title: 'Silver Apple Laptop',
      found_desc: 'Turned in with small developer sticker and protective sleeve.',
      found_loc: 'Central Library, 3rd Floor',
      custody_desk: 'Central Security Desk (Locker B-12)',
      found_date: 'Yesterday',
      confidence: 95,
      category: 'Electronics',
    },
    {
      id: 'item-2',
      lost_title: 'Campus ID Card & Navy Lanyard',
      lost_desc: 'Student photo ID ending in 042 with room key attached.',
      lost_loc: 'Main Cafeteria, B-Block',
      lost_date: 'Yesterday',
      found_title: 'Student ID Badge on Blue Strap',
      found_desc: 'Found on table 14 near the coffee counter.',
      found_loc: 'Main Cafeteria, B-Block',
      custody_desk: 'B-Block Security Desk (Drawer A-4)',
      found_date: 'Today',
      confidence: 93,
      category: 'ID & Cards',
    },
    {
      id: 'item-3',
      lost_title: 'Black Chronograph Wristwatch',
      lost_desc: 'Black metal link strap with red second hand.',
      lost_loc: 'Sports Complex (Court 2)',
      lost_date: '3 days ago',
      found_title: 'Black Analog Watch',
      found_desc: 'Found on bench in badminton arena.',
      found_loc: 'Sports Complex (Court 2)',
      custody_desk: 'Sports Desk Custody (Locker C-1)',
      found_date: '3 days ago',
      confidence: 89,
      category: 'Accessories',
    },
  ]);

  const [claims, setClaims] = useState([
    {
      claim_id: 'clm-101',
      item_title: 'Campus ID Card & Navy Lanyard',
      claimant: 'Sarah Jenkins',
      proof: 'Small brass room key tied to the lanyard knot; student ID ends in 042.',
      custody_desk: 'B-Block Security Desk (Drawer A-4)',
      submitted_time: '15 mins ago',
      status: 'Awaiting Staff Review',
    },
  ]);

  const triggerToast = (title: string, message: string) => {
    setToast({ title, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleReportLostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMatch = {
      id: `item-${Date.now()}`,
      lost_title: lostTitle,
      lost_desc: lostDesc,
      lost_loc: lostLoc,
      lost_date: 'Just now',
      found_title: 'Matching Item in Custody',
      found_desc: 'An item matching your description is currently held at the security desk.',
      found_loc: lostLoc,
      custody_desk: 'Central Security Desk',
      found_date: 'Recently',
      confidence: 91,
      category: lostCat,
    };
    setMatches([newMatch, ...matches]);
    triggerToast('Report Submitted!', 'Our smart matching engine is actively scanning custody inventory.');
    setLostTitle('');
    setLostDesc('');
    setActiveTab('matches');
  };

  const handleReportFoundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Item Logged in Custody', `Stored securely at ${foundLocker}. Thank you for helping!`);
    setFoundTitle('');
    setFoundDesc('');
    setActiveTab('matches');
  };

  const handleApproveClaim = (claimId: string) => {
    setClaims(
      claims.map((c) => (c.claim_id === claimId ? { ...c, status: 'Claim Verified & Handed Over' } : c))
    );
    triggerToast('Handover Completed', 'Ownership verified and custody record closed.');
  };

  const handleClaimSubmit = () => {
    if (!secretProof) return;
    const newClaim = {
      claim_id: `clm-${Date.now()}`,
      item_title: selectedMatch?.found_title || 'Item in Custody',
      claimant: 'Alex Chen',
      proof: secretProof,
      custody_desk: selectedMatch?.custody_desk || 'Central Security Desk',
      submitted_time: 'Just now',
      status: 'Awaiting Staff Review',
    };
    setClaims([newClaim, ...claims]);
    setClaimModalOpen(false);
    setSecretProof('');
    triggerToast('Claim Sent to Security Staff', 'Staff will review your identifying proof before release.');
    if (role === 'STAFF') setActiveTab('custody');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 shadow-2xl rounded-2xl p-4 max-w-sm flex items-start gap-3 transition-all">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0">
            ✓
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              🔍
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">Campus Lost & Found</span>
              <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 border-l border-slate-700 pl-2">
                Fast recovery across campus
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center text-xs">
              <button
                onClick={() => {
                  setRole('STUDENT');
                  triggerToast('Switched View', 'Browsing as student');
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  role === 'STUDENT' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Student View
              </button>
              <button
                onClick={() => {
                  setRole('STAFF');
                  triggerToast('Staff Portal', 'Logged in as Campus Security Staff');
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  role === 'STAFF' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Staff Portal
              </button>
            </div>

            {/* Developer Specs Button */}
            <button
              onClick={() => setShowInspector(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors hidden md:flex items-center gap-1.5"
              title="Inspect SQL queries, stored procedures, and vector engine"
            >
              <span>⚙️</span> Database Specs
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        
        {/* Simple Summary Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-xs text-slate-400 block">Active Search Reports</span>
            <span className="text-2xl font-bold text-white mt-1 block">18 items</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-xs text-slate-400 block">Safely in Custody</span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">12 items</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-xs text-slate-400 block">Returned to Owners</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">6 reunited</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-xs text-slate-400 block">Recovery Success Rate</span>
            <span className="text-2xl font-bold text-blue-400 mt-1 block">76%</span>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto text-sm font-medium pb-1">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'matches'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>✨</span> Likely Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('report-lost')}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'report-lost'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📢</span> I Lost Something
          </button>
          <button
            onClick={() => setActiveTab('report-found')}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'report-found'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📦</span> I Found Something
          </button>

          {role === 'STAFF' && (
            <button
              onClick={() => setActiveTab('custody')}
              className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'custody'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🛡️</span> Security Handover Desk ({claims.filter((c) => !c.status.includes('Handed Over')).length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('locations')}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'locations'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📍</span> Campus Hotspots
          </button>
        </div>

        {/* TAB 1: MATCH FEED (Simple, Human-Friendly Cards) */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Suggested Matches</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Items reported lost that strongly resemble inventory currently stored in campus custody.
                </p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl font-medium hidden sm:inline-block">
                Auto-Matching Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {matches.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {item.confidence}% Match Likelihood
                      </span>
                      <span className="text-xs text-slate-400">Category: {item.category}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedMatch(item);
                        setClaimModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      Claim This Item
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: What was lost */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/70">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="text-red-400 font-semibold uppercase tracking-wider text-[11px]">Reported Lost</span>
                        <span>{item.lost_date}</span>
                      </div>
                      <h3 className="font-bold text-sm text-white">{item.lost_title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{item.lost_desc}</p>
                      <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                        <span>📍 Last seen: {item.lost_loc}</span>
                      </div>
                    </div>

                    {/* Right: What was found */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/70">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">Found & In Safe Custody</span>
                        <span>{item.found_date}</span>
                      </div>
                      <h3 className="font-bold text-sm text-white">{item.found_title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{item.found_desc}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>📍 Found at: {item.found_loc}</span>
                        <span className="text-amber-400 font-medium">🔒 {item.custody_desk}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: REPORT LOST */}
        {activeTab === 'report-lost' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="font-bold text-base text-white mb-1">Report a Lost Item</h2>
            <p className="text-xs text-slate-400 mb-5">
              Fill in what you lost. If a matching item is already in custody or turned in later, you will be notified.
            </p>

            <form onSubmit={handleReportLostSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">What did you lose? *</label>
                <input
                  type="text"
                  required
                  value={lostTitle}
                  onChange={(e) => setLostTitle(e.target.value)}
                  placeholder="e.g. Blue Hydro Flask, Silver MacBook, Car Keys..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Category *</label>
                  <select
                    value={lostCat}
                    onChange={(e) => setLostCat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Electronics">Electronics & Laptops</option>
                    <option value="ID & Cards">Campus ID / Wallet / Cards</option>
                    <option value="Keys">Keys & Fobs</option>
                    <option value="Accessories">Accessories, Watches & Bags</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Color *</label>
                  <input
                    type="text"
                    required
                    value={lostColor}
                    onChange={(e) => setLostColor(e.target.value)}
                    placeholder="e.g. Navy Blue, Silver, Black"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Where did you lose it? *</label>
                <select
                  value={lostLoc}
                  onChange={(e) => setLostLoc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Central Library (3rd Floor)">Central Library (3rd Floor Reading Hall)</option>
                  <option value="Main Cafeteria, B-Block">Main Cafeteria, B-Block</option>
                  <option value="Tech Park (Level 5 Labs)">Tech Park (Level 5 CSE Labs)</option>
                  <option value="Sports Complex">Sports Complex & Courts</option>
                  <option value="Auditorium Foyer">Auditorium Foyer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Description & identifying features *</label>
                <textarea
                  rows={3}
                  required
                  value={lostDesc}
                  onChange={(e) => setLostDesc(e.target.value)}
                  placeholder="Mention unique scratches, stickers, brand name, keychains, or protective cases..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
              >
                Submit Lost Report
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: REPORT FOUND */}
        {activeTab === 'report-found' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="font-bold text-base text-white mb-1">Turn In a Found Item</h2>
            <p className="text-xs text-slate-400 mb-5">
              Found an unattended item on campus? Help us return it safely to its owner.
            </p>

            <form onSubmit={handleReportFoundSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Item Name *</label>
                <input
                  type="text"
                  required
                  value={foundTitle}
                  onChange={(e) => setFoundTitle(e.target.value)}
                  placeholder="e.g. Black Sony Headphones, Casio Watch..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Location Found *</label>
                  <select
                    value={foundLoc}
                    onChange={(e) => setFoundLoc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Central Library (3rd Floor)">Central Library</option>
                    <option value="Main Cafeteria, B-Block">Main Cafeteria, B-Block</option>
                    <option value="Tech Park (Level 5 Labs)">Tech Park</option>
                    <option value="Sports Complex">Sports Complex</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Dropped Off At Desk *</label>
                  <input
                    type="text"
                    required
                    value={foundLocker}
                    onChange={(e) => setFoundLocker(e.target.value)}
                    placeholder="e.g. Front Security Desk"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Visual Appearance *</label>
                <textarea
                  rows={3}
                  required
                  value={foundDesc}
                  onChange={(e) => setFoundDesc(e.target.value)}
                  placeholder="Describe general condition, color, and location where it was picked up..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
              >
                Log Found Item into Custody
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: SECURITY DESK (STAFF ONLY) */}
        {activeTab === 'custody' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Pending Ownership Claims Queue</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify the claimant's secret proof before releasing physical items from custody.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Claimant Name</th>
                    <th className="py-3 px-4">Secret Verification Proof</th>
                    <th className="py-3 px-4">Custody Locker</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {claims.map((clm) => (
                    <tr key={clm.claim_id} className="hover:bg-slate-950/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">{clm.item_title}</td>
                      <td className="py-3.5 px-4 text-slate-300">{clm.claimant}</td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs">{clm.proof}</td>
                      <td className="py-3.5 px-4 text-amber-400 font-medium">{clm.custody_desk}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            clm.status.includes('Handed Over')
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {clm.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!clm.status.includes('Handed Over') ? (
                          <button
                            onClick={() => handleApproveClaim(clm.claim_id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
                          >
                            Approve & Release
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CAMPUS HOTSPOTS */}
        {activeTab === 'locations' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-1">Campus Loss Hotspots</h3>
              <p className="text-xs text-slate-400 mb-4">
                High-traffic campus zones where items are most frequently lost and recovered.
              </p>

              <div className="space-y-3">
                {[
                  { name: 'Central Library (3rd Floor Reading Hall)', zone: 'Study Area', rate: 86, lost: 7, recovered: 6 },
                  { name: 'Main Student Cafeteria (B-Block)', zone: 'Dining', rate: 80, lost: 5, recovered: 4 },
                  { name: 'Tech Park (Level 5 Computer Labs)', zone: 'Academic Labs', rate: 75, lost: 4, recovered: 3 },
                  { name: 'Campus Sports Arena & Courts', zone: 'Athletics', rate: 50, lost: 2, recovered: 1 },
                ].map((loc, i) => (
                  <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-white">{loc.name}</span>
                      <span className="text-emerald-400 font-bold">{loc.rate}% Recovery Rate</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${loc.rate}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Zone: {loc.zone}</span>
                      <span>Total Reported: {loc.lost} | Successfully Reclaimed: {loc.recovered}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CLAIM VERIFICATION MODAL */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Claim Ownership of This Item</h3>
              <button onClick={() => setClaimModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block">Item in custody:</span>
              <p className="font-bold text-white text-sm">{selectedMatch?.found_title}</p>
              <p className="text-amber-400 font-medium">Location: {selectedMatch?.custody_desk}</p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-200">
                Secret Identifying Detail (Proof of Ownership) *
              </label>
              <p className="text-slate-400 text-[11px] mb-1">
                Describe something not shown publicly (e.g., sticker location, serial number, lockscreen wallpaper, or contents inside).
              </p>
              <textarea
                rows={3}
                required
                value={secretProof}
                onChange={(e) => setSecretProof(e.target.value)}
                placeholder="e.g. Has a small cat sticker on the lower left corner and a small scratch near the charger port..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button
                onClick={() => setClaimModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleClaimSubmit}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Submit Ownership Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEVELOPER / DATABASE SPECS MODAL (Only when requested) */}
      {showInspector && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-white">Database Engine & Query Specifications</h3>
                <p className="text-xs text-slate-400">PostgreSQL 16 + pgvector Architecture Blueprints</p>
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
                1. pgvector Search Query
              </button>
              <button
                onClick={() => setSelectedSqlTab('proc')}
                className={`px-3 py-1.5 rounded-xl font-semibold ${
                  selectedSqlTab === 'proc' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                2. ACID Handover Procedure
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
              {selectedSqlTab === 'vector' && `-- 1. pgvector Cosine Distance Search Operator (<=>)
SELECT f.found_id, f.title, f.storage_custody_location,
       ROUND((1 - (f.embedding <=> l.embedding)) * 100, 2) AS cosine_similarity
FROM found_items f, lost_items l
WHERE l.lost_id = 'c0000000...0001' AND f.status = 'IN_CUSTODY'
ORDER BY f.embedding <=> l.embedding ASC LIMIT 5;`}

              {selectedSqlTab === 'proc' && `-- 2. Multi-Statement ACID Handover Procedure with Row-Level Locking
CREATE OR REPLACE PROCEDURE sp_execute_item_handover(p_claim_id UUID, p_staff_id UUID, p_remarks TEXT)
LANGUAGE plpgsql AS $$
BEGIN
    SELECT lost_id, found_id, claimant_user_id FROM claims WHERE claim_id = p_claim_id FOR UPDATE;
    INSERT INTO custody_handovers VALUES (gen_random_uuid(), p_claim_id, p_staff_id, ...);
    UPDATE found_items SET status = 'RETURNED_TO_OWNER' WHERE found_id = v_found_id;
    UPDATE lost_items SET status = 'CLAIMED' WHERE lost_id = v_lost_id;
    UPDATE claims SET claim_status = 'HANDED_OVER' WHERE claim_id = p_claim_id;
END; $$;`}

              {selectedSqlTab === 'trigger' && `-- 3. Automated State Audit Trigger
CREATE TRIGGER trg_audit_found_item_status
AFTER UPDATE OF status ON found_items
FOR EACH ROW EXECUTE FUNCTION fn_audit_item_status_change();`}

              {selectedSqlTab === 'view' && `-- 4. Campus Loss Hotspot View with GROUP BY and HAVING
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

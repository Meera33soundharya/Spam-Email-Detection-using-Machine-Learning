
import React, { useState } from 'react';
import { Shield, Mail, AlertTriangle, CheckCircle, Trash2, Inbox, Loader, Settings, Zap } from 'lucide-react';

export default function SpamDetector() {
    const [email, setEmail] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [apiKey, setApiKey] = useState('');
    const [useAI, setUseAI] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Simple keyword-based analysis for demo purposes (client-side)
    const analyzeLocally = (text) => {
        const textLower = text.toLowerCase();
        const spamTriggers = ['won', 'lottery', 'prize', 'urgent', 'bank account', 'click here', 'password', 'social security', 'verify your account', 'inheritance', 'million dollars', 'congratulations'];
        const foundTriggers = spamTriggers.filter(t => textLower.includes(t));

        const isSpam = foundTriggers.length > 0;

        return {
            classification: isSpam ? 'spam' : 'ham',
            confidence: isSpam ? 0.8 + (Math.min(foundTriggers.length, 4) * 0.05) : 0.9,
            reasons: isSpam
                ? foundTriggers.map(t => `Contains suspicious phrase: "${t}"`)
                : ['No suspicious keywords found', 'Tone appears natural', 'No urgent tracking links identified'],
            risk_level: isSpam ? (foundTriggers.length > 2 ? 'high' : 'medium') : 'low'
        };
    };

    const detectSpam = async () => {
        if (!email.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            if (useAI && apiKey) {
                // Real API Call
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'dangerously-allow-browser': 'true'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-sonnet-20240229',
                        max_tokens: 1000,
                        messages: [{
                            role: 'user',
                            content: `Analyze this email and determine if it's spam or legitimate (ham). 
                Email: "${email}"
                Respond ONLY with a JSON object in this exact format: { "classification": "spam"|"ham", "confidence": number, "reasons": string[], "risk_level": "low"|"medium"|"high" }`
                        }]
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error?.message || `API Error: ${response.status}`);
                }

                const data = await response.json();
                const text = data.content.find(c => c.type === 'text')?.text || '';
                const cleaned = text.replace(/```json|```/g, '').trim();
                const analysis = JSON.parse(cleaned);

                const newResult = {
                    ...analysis,
                    email: email,
                    timestamp: new Date().toLocaleString(),
                    method: 'AI Analysis'
                };
                setResult(newResult);
                setHistory(prev => [newResult, ...prev].slice(0, 10));

            } else {
                // Local Simulation (Demo Mode)
                await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay for effect
                const analysis = analyzeLocally(email);

                const newResult = {
                    ...analysis,
                    email: email,
                    timestamp: new Date().toLocaleString(),
                    method: 'Local Pattern Match'
                };

                setResult(newResult);
                setHistory(prev => [newResult, ...prev].slice(0, 10));
            }

        } catch (error) {
            console.error('Detection error:', error);
            setResult({
                classification: 'error',
                confidence: 0,
                reasons: [`Error: ${error.message}. Try disabling AI mode or checking your API Key.`],
                risk_level: 'medium',
                method: 'Error'
            });
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = () => {
        setHistory([]);
        setResult(null);
        setEmail('');
    };

    const loadExample = (type) => {
        const examples = {
            spam: "CONGRATULATIONS!!! You've WON $1,000,000 in our lottery! Click here NOW to claim your prize before it expires! Send your bank account details to process the payment immediately!",
            ham: "Hi Sarah, I hope this email finds you well. I wanted to follow up on our meeting last week about the Q2 project timeline. Could you send me the updated schedule when you have a moment? Thanks!"
        };
        setEmail(examples[type]);
        setResult(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 relative">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="absolute right-0 top-0 p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Shield className="w-12 h-12 text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Email Spam Detector</h1>
                    </div>
                    <p className="text-gray-600">AI-powered spam detection to keep your inbox safe</p>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100 animate-fade-in">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5" /> Configuration
                        </h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <label className="text-gray-700 font-medium">Use Real AI (Anthropic Claude)</label>
                                <button
                                    onClick={() => setUseAI(!useAI)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${useAI ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${useAI ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                            {useAI && (
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Anthropic API Key</label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="sk-ant-..."
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Key is stored only in browser memory.</p>
                                </div>
                            )}

                            {!useAI && (
                                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Running in <strong>Simulation Mode</strong>. No API key required.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-white/50 backdrop-blur-sm">
                    {/* Input Area */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Enter Email Content
                        </label>
                        <textarea
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Paste the email content here..."
                            className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-gray-700 transition-all"
                        />
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => loadExample('spam')}
                                className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                            >
                                Load Spam Example
                            </button>
                            <button
                                onClick={() => loadExample('ham')}
                                className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                            >
                                Load Safe Example
                            </button>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={detectSpam}
                        disabled={loading || !email.trim()}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5" />
                                Detect Spam {useAI ? '(AI)' : '(Simulated)'}
                            </>
                        )}
                    </button>

                    {/* Result Display */}
                    {result && result.classification !== 'error' && (
                        <div className={`mt-6 p-6 rounded-xl border-2 animate-fade-in ${result.classification === 'spam'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-green-50 border-green-200'
                            }`}>
                            <div className="flex items-center gap-3 mb-4">
                                {result.classification === 'spam' ? (
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                ) : (
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                )}
                                <div>
                                    <h3 className={`text-2xl font-bold ${result.classification === 'spam' ? 'text-red-800' : 'text-green-800'
                                        }`}>
                                        {result.classification === 'spam' ? 'SPAM DETECTED' : 'SAFE EMAIL'}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="font-medium">Confidence: {(result.confidence * 100).toFixed(0)}%</span>
                                        <span>•</span>
                                        <span className="font-medium">Risk: {result.risk_level.toUpperCase()}</span>
                                        <span>•</span>
                                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{result.method}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/60 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-700 mb-2">Analysis:</h4>
                                <ul className="space-y-2">
                                    {result.reasons.map((reason, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${result.classification === 'spam' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                            <span className="text-gray-700">{reason}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {result && result.classification === 'error' && (
                        <div className="mt-6 p-6 rounded-xl border-2 bg-yellow-50 border-yellow-300 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                <p className="text-yellow-800 font-medium">{result.reasons[0]}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* History Section */}
                {history.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Inbox className="w-6 h-6" />
                                Recent Analyses
                            </h3>
                            <button
                                onClick={clearHistory}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear History
                            </button>
                        </div>

                        <div className="space-y-3">
                            {history.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${item.classification === 'spam'
                                            ? 'bg-red-50 border-red-500'
                                            : 'bg-green-50 border-green-500'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${item.classification === 'spam' ? 'text-red-700' : 'text-green-700'
                                                }`}>
                                                {item.classification === 'spam' ? 'SPAM' : 'SAFE'}
                                            </span>
                                            <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-500">{item.method}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{item.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{item.email}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-gray-400 pb-8">
                    <p>© 2024 SpamDetector AI | Privacy: Emails are processed locally in demo mode</p>
                </div>
            </div>
        </div>
    );
}

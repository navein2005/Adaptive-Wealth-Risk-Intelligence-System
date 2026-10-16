import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRScanner from './QRScanner';
import { 
  LayoutDashboard, 
  Wallet, 
  Receipt, 
  LineChart as LineChartIcon, 
  Bot, 
  TrendingUp, 
  User, 
  LogOut, 
  Send, 
  CreditCard, 
  CheckCircle, 
  ShieldCheck, 
  X, 
  RefreshCw, 
  QrCode, 
  AlertTriangle, 
  Calculator, 
  FileDown, 
  Filter, 
  Radio, 
  ArrowUpRight, 
  Sparkles, 
  PlusCircle, 
  MessageSquare,
  Activity,
  Sliders,
  Coins
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar
} from 'recharts';

const PHP_API = "http://localhost/awris_api";
const PYTHON_API = "http://127.0.0.1:8000";
const GOOGLE_CLIENT_ID = "1006148515897-e3n2h0tiktehkj5iup47vobutkjvc0t0.apps.googleusercontent.com";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const BANK_CONFIG = {
  'Maybank': { lengths: [12], max: 12, placeholder: '12-digit account (e.g. 114012345678)' },
  'CIMB Bank': { lengths: [10, 14], max: 14, placeholder: '10 or 14-digit account' },
  'Public Bank': { lengths: [10], max: 10, placeholder: '10-digit account (e.g. 3123456789)' },
  'RHB Bank': { lengths: [10, 14], max: 14, placeholder: '10 or 14-digit account' },
  'Hong Leong Bank': { lengths: [11], max: 11, placeholder: '11-digit account (e.g. 01234567890)' },
  'AmBank': { lengths: [13], max: 13, placeholder: '13-digit account' },
  'Bank Islam': { lengths: [14], max: 14, placeholder: '14-digit account' },
  'Ryt Bank': { lengths: [10], max: 10, placeholder: '10-digit account (e.g. 9901234567)' }
};

const FPX_BANKS = [
  { id: 'Maybank2u', name: 'Maybank2u', fee: 'RM 0.00' },
  { id: 'CIMB Clicks', name: 'CIMB Clicks', fee: 'RM 0.00' },
  { id: 'Public Bank PBe', name: 'Public Bank PBe', fee: 'RM 0.00' },
  { id: 'RHB Now', name: 'RHB Now', fee: 'RM 0.00' },
  { id: 'Hong Leong Connect', name: 'Hong Leong Connect', fee: 'RM 0.00' },
  { id: 'AmOnline', name: 'AmBank AmOnline', fee: 'RM 0.00' }
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const formatMYR = (val) => {
  const num = parseFloat(val || 0);
  return `RM ${num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authIncome, setAuthIncome] = useState('4200.00');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem('awris_user');
    } catch (error) {
      console.warn('Unable to clear the saved AWRIS session on startup.', error);
    }
  }, []);

  const [googlePendingProfile, setGooglePendingProfile] = useState(null);
  const [googleIncomeInput, setGoogleIncomeInput] = useState('4200.00');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [wallet, setWallet] = useState({ total_balance: 0.00, total_income: 0.00, total_expense: 0.00, total_invested: 0.00 });
  const [transactions, setTransactions] = useState([]);
  const [transactionsRefreshFailed, setTransactionsRefreshFailed] = useState(false);
  const [budgetsRefreshFailed, setBudgetsRefreshFailed] = useState(false);

  const currentSystemMonth = String(new Date().getMonth() + 1);
  const currentSystemYear = String(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentSystemMonth);
  const [selectedYear, setSelectedYear] = useState(currentSystemYear);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  const [budgetList, setBudgetList] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);

  const [txCategory, setTxCategory] = useState('Food & Dining');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState('EXPENSE');
  const [txDesc, setTxDesc] = useState('');

  const [analytics, setAnalytics] = useState(null);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Monte Carlo & What-If States
  const [mcMonthly, setMcMonthly] = useState(500);
  const [mcReturn, setMcReturn] = useState(8.0);
  const [mcYears, setMcYears] = useState(10);
  const [mcScenario, setMcScenario] = useState('BASE');
  const [mcTargetGoal, setMcTargetGoal] = useState(100000);
  const [whatIfExtraSavings, setWhatIfExtraSavings] = useState(200);
  const [mcResults, setMcResults] = useState(null);

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [selectedFpxBank, setSelectedFpxBank] = useState('Maybank2u');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferStep, setTransferStep] = useState(1);
  const [transferBank, setTransferBank] = useState('Maybank');
  const [transferAcc, setTransferAcc] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [transferAmt, setTransferAmt] = useState('');
  const [transferRef, setTransferRef] = useState('Funds Transfer');
  const [transferReceipt, setTransferReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTab, setQrTab] = useState('receive');
  const [scanView, setScanView] = useState('scanner');
  const [qrMerchant, setQrMerchant] = useState("Touch 'n Go Merchant");
  const [qrPayAmount, setQrPayAmount] = useState('');
  const [qrPayRef, setQrPayRef] = useState('DuitNow Transfer');
  const [qrCategory, setQrCategory] = useState('Food & Dining');
  const [enableRoundUp, setEnableRoundUp] = useState(true);

  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [investAmount, setInvestAmount] = useState('500');

  const [paymentType, setPaymentType] = useState('Electricity Bill (TNB)');
  const [paymentAmt, setPaymentAmt] = useState('');

  const evaluatedSessionRef = useRef(false);

  const grossSalary = parseFloat(currentUser?.monthly_income || 4200.00);
  const epfEmployee = grossSalary * 0.11;
  const socsoEmployee = grossSalary > 5000 ? 24.75 : grossSalary * 0.005;
  const eisEmployee = grossSalary > 5000 ? 9.90 : grossSalary * 0.002;
  const totalDeductions = epfEmployee + socsoEmployee + eisEmployee;
  const netTakeHomePay = Math.max(0, grossSalary - totalDeductions);

  const defaultInvestmentOptions = useMemo(() => [
    {
      id: 'stashaway',
      name: 'StashAway General Investing (Risk Index 22%)',
      provider: 'StashAway Malaysia (SC Regulated)',
      expectedReturn: '8.2% p.a.',
      riskLevel: 'Moderate-Aggressive',
      assetClass: 'Global Equities & Commodities (ETFs)',
      minInvestment: 50,
      color: '#3B82F6'
    },
    {
      id: 'wahed',
      name: 'Wahed Robo-Advisory (Halal Aggressive)',
      provider: 'Wahed Technologies Sdn Bhd',
      expectedReturn: '9.0% p.a.',
      riskLevel: 'Aggressive',
      assetClass: 'US Shariah Equities (HLAL) & Sukuk',
      minInvestment: 100,
      color: '#10B981'
    },
    {
      id: 'bursa_etf',
      name: 'MyETF FTSE Bursa Malaysia KLCI (0821EA)',
      provider: 'Bursa Malaysia Securities Berhad',
      expectedReturn: '6.8% p.a.',
      riskLevel: 'Moderate',
      assetClass: 'Top 30 Malaysian Blue-Chip Equities',
      minInvestment: 100,
      color: '#8B5CF6'
    },
    {
      id: 'epf_topup',
      name: 'EPF / KWSP Self-Contribution (i-Saraan)',
      provider: 'Kumpulan Wang Simpanan Pekerja',
      expectedReturn: '5.5% – 6.0% p.a.',
      riskLevel: 'Low Risk',
      assetClass: 'Capital Guaranteed + Annual Dividend',
      minInvestment: 50,
      color: '#F59E0B'
    }
  ], []);

  const handleGoogleCredentialResponse = useCallback(async (response) => {
    setIsAuthLoading(true);
    setAuthError('');
    try {
      const res = await axios.post(`${PHP_API}/auth.php?action=google`, {
        credential: response.credential,
        intent: authView === 'login' ? 'login' : 'signup'
      });

      if (res.data.status === 'success') {
        setCurrentUser(res.data.user);
      } else if (res.data.status === 'not_registered') {
        setAuthError("This Google account has not registered yet. Please click 'Sign Up' below to create your account.");
      } else if (res.data.status === 'needs_onboarding') {
        setGooglePendingProfile(res.data.google_profile);
      } else {
        setAuthError(res.data.message || 'Google authentication failed.');
      }
    } catch (err) {
      setAuthError('Connection error. Ensure Apache and MySQL are running in XAMPP.');
    } finally {
      setIsAuthLoading(false);
    }
  }, [authView]);

  const handleCompleteGoogleOnboarding = async (e) => {
    e.preventDefault();
    if (!googlePendingProfile) return;

    setIsAuthLoading(true);
    try {
      const res = await axios.post(`${PHP_API}/auth.php?action=google`, {
        intent: 'signup',
        email: googlePendingProfile.email,
        full_name: googlePendingProfile.full_name,
        google_id: googlePendingProfile.google_id,
        monthly_income: parseFloat(googleIncomeInput)
      });

      if (res.data.status === 'success') {
        setCurrentUser(res.data.user);
        setGooglePendingProfile(null);
      } else {
        setAuthError(res.data.message || 'Onboarding failed.');
      }
    } catch (err) {
      setAuthError('Connection error during profile setup.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false
        });

        const btnContainer = document.getElementById("google-signin-real-btn");
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            width: 368,
            text: authView === 'login' ? "signin_with" : "signup_with",
            shape: "rectangular"
          });
        }
      } catch (e) {
        console.warn("Google init notice:", e);
      }
    }
  }, [currentUser, authView, handleGoogleCredentialResponse]);

  const fetchTransactions = useCallback(async () => {
    if (!currentUser) return;
    try {
      const params = new URLSearchParams({
        user_id: currentUser.user_id,
        month: selectedMonth,
        year: selectedYear,
        category: selectedCategory
      });
      const res = await axios.get(`${PHP_API}/transactions.php?${params.toString()}`);
      if (res.data.status === 'success') {
        setTransactionsRefreshFailed(false);
        setTransactions(res.data.transactions || []);
        if (res.data.wallet) {
          setWallet({
            total_balance: parseFloat(res.data.wallet.total_balance),
            total_income: parseFloat(res.data.wallet.total_income),
            total_expense: parseFloat(res.data.wallet.total_expense),
            total_invested: parseFloat(res.data.wallet.total_invested)
          });
        }
      }
    } catch (err) {
      setTransactionsRefreshFailed(true);
      console.warn("Transactions fetch warning:", err);
    }
  }, [currentUser, selectedMonth, selectedYear, selectedCategory]);

  const fetchBudgets = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await axios.get(`${PHP_API}/budgets.php?user_id=${currentUser.user_id}`);
      if (res.data.status === 'success') {
        setBudgetsRefreshFailed(false);
        setBudgetList(res.data.budgets || []);
        setActiveAlerts(res.data.active_alerts || []);
      }
    } catch (err) {
      setBudgetsRefreshFailed(true);
      console.warn("Budgets load warning:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const refreshAccountData = () => {
      if (document.visibilityState !== 'visible') return;
      fetchTransactions();
      fetchBudgets();
    };

    refreshAccountData();
    const interval = setInterval(refreshAccountData, 30000);
    window.addEventListener('focus', refreshAccountData);
    document.addEventListener('visibilitychange', refreshAccountData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshAccountData);
      document.removeEventListener('visibilitychange', refreshAccountData);
    };
  }, [currentUser, fetchTransactions, fetchBudgets]);

  // AI Evaluation
  useEffect(() => {
    if (!currentUser || evaluatedSessionRef.current) return;
    evaluatedSessionRef.current = true;

    axios.post(`${PYTHON_API}/analytics/evaluate`, {
      monthly_income: netTakeHomePay,
      transactions: transactions.slice(0, 15)
    }).then(res => {
      setAnalytics(res.data);
    }).catch(() => {
      setAnalytics({
        risk_capacity_score: 74,
        investor_type: "Moderate-Aggressive",
        savings_rate: 34,
        expense_volatility: "LOW",
        stock_allocation_pct: 65,
        bond_allocation_pct: 25,
        cash_allocation_pct: 10,
        recommendation: "Maintain a baseline 3-month emergency reserve. Channel surplus into diversified global ETFs and EPF i-Saraan.",
        clusters: [
          { cluster_group: 0, category: "Rental & Housing", total_amount: 900.0, frequency: 1 },
          { cluster_group: 1, category: "Food & Dining", total_amount: 467.5, frequency: 3 },
          { cluster_group: 2, category: "Bills & Utilities", total_amount: 230.4, frequency: 2 }
        ],
        portfolios: defaultInvestmentOptions,
        xai_attributions: [
          { feature: "Savings Discipline (>30%)", impact: 18, type: "positive" },
          { feature: "Emergency Liquidity Buffer", impact: 12, type: "positive" },
          { feature: "Discretionary Spending Volatility", impact: -6, type: "negative" },
          { feature: "Fixed Debt Obligation Ratio", impact: 4, type: "positive" }
        ],
        health_radar: [
          { axis: "Emergency Buffer", score: 85 },
          { axis: "Savings Rate", score: 80 },
          { axis: "Debt Health", score: 88 },
          { axis: "Diversification", score: 75 },
          { axis: "Budget Adherence", score: 82 }
        ],
        anomalies: []
      });
    });
  }, [currentUser, netTakeHomePay, transactions, defaultInvestmentOptions]);

  const handleAskAdvisor = async (e) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;

    const currentPrompt = chatPrompt;
    setIsChatLoading(true);
    setChatResponse('');

    try {
      const res = await axios.post(`${PYTHON_API}/analytics/advisor-chat`, {
        user_query: currentPrompt,
        monthly_income: netTakeHomePay,
        total_balance: wallet.total_balance,
        invested_amount: wallet.total_invested
      }, { timeout: 18000 });

      if (res.data && res.data.response) {
        setChatResponse(res.data.response);
      } else {
        throw new Error("No response text returned");
      }
    } catch (err) {
      console.warn("Direct chat endpoint issue:", err);
      setChatResponse(
        `Evaluating against your Net Take-Home Pay of ${formatMYR(netTakeHomePay)}:\n\n` +
        `Prudent financial guidelines recommend keeping discretionary installment obligations under 10%–15% of your net income, ` +
        `while ensuring your emergency cash reserve remains fully intact.`
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  // Monte Carlo & What-If Simulation Runner
  const runMonteCarlo = useCallback(async (scenarioOverride = mcScenario, extraBoostOverride = whatIfExtraSavings) => {
    const monthlyNum = parseFloat(mcMonthly) || 500;
    const returnNum = parseFloat(mcReturn) || 8.0;
    const yearsNum = parseInt(mcYears, 10) || 10;
    const goalNum = parseFloat(mcTargetGoal) || 100000;
    const extraBoostNum = parseFloat(extraBoostOverride) || 0;

    try {
      const res = await axios.post(`${PYTHON_API}/analytics/monte-carlo`, {
        initial_amount: parseFloat(wallet.total_invested || 4500),
        monthly_investment: monthlyNum,
        expected_annual_return: returnNum,
        volatility: 15.0,
        years: yearsNum,
        scenario: scenarioOverride,
        target_goal: goalNum,
        what_if_extra_savings: extraBoostNum
      }, { timeout: 3500 });
      setMcResults(res.data);
    } catch (err) {
      // Local exact math fallback if backend is offline
      const data = [];
      let balanceWorst = wallet.total_invested || 4500;
      let balanceAvg = wallet.total_invested || 4500;
      let balanceBest = wallet.total_invested || 4500;
      let balanceOpt = wallet.total_invested || 4500;
      const rate = returnNum / 100;
      let mult = scenarioOverride === 'BEAR_CRASH' ? 0.60 : scenarioOverride === 'BULL_RALLY' ? 1.35 : 1.0;

      for (let y = 0; y <= yearsNum; y++) {
        data.push({
          year: `Year ${y}`,
          worst_case: Math.round(balanceWorst),
          average_case: Math.round(balanceAvg),
          best_case: Math.round(balanceBest),
          what_if_boost: Math.round(balanceOpt)
        });
        const annualContrib = monthlyNum * 12;
        const annualContribBoost = (monthlyNum + extraBoostNum) * 12;
        balanceWorst = (balanceWorst + annualContrib) * (1 + rate * 0.45 * mult);
        balanceAvg = (balanceAvg + annualContrib) * (1 + rate * mult);
        balanceBest = (balanceBest + annualContrib) * (1 + rate * 1.55 * mult);
        balanceOpt = (balanceOpt + annualContribBoost) * (1 + rate * mult);
      }
      setMcResults({
        yearly_trajectory: data,
        worst_case_final: data[data.length - 1].worst_case,
        average_case_final: data[data.length - 1].average_case,
        best_case_final: data[data.length - 1].best_case,
        what_if_final: data[data.length - 1].what_if_boost,
        probability_of_success: Math.min(99, Math.round((data[data.length - 1].average_case / goalNum) * 75)),
        scenario_desc: `Simulated under ${scenarioOverride} conditions.`
      });
    }
  }, [wallet.total_invested, mcMonthly, mcReturn, mcYears, mcScenario, mcTargetGoal, whatIfExtraSavings]);

  useEffect(() => {
    runMonteCarlo('BASE', whatIfExtraSavings);
  }, [runMonteCarlo, whatIfExtraSavings]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const res = await axios.post(`${PHP_API}/auth.php?action=login`, {
        email: authEmail,
        password: authPassword
      });

      if (res.data.status === 'success') {
        setCurrentUser(res.data.user);
      } else {
        setAuthError(res.data.message || 'Login failed.');
      }
    } catch (err) {
      setAuthError('Connection refused. Ensure Apache and MySQL are running in XAMPP.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const res = await axios.post(`${PHP_API}/auth.php?action=register`, {
        full_name: authFullName,
        email: authEmail,
        password: authPassword,
        monthly_income: authIncome
      });

      if (res.data.status === 'success') {
        setCurrentUser(res.data.user);
      } else {
        setAuthError(res.data.message || 'Registration failed.');
      }
    } catch (err) {
      setAuthError('Registration connection error. Check MySQL in XAMPP.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthEmail('');
    setAuthPassword('');
    setGooglePendingProfile(null);
    setTransactionsRefreshFailed(false);
    setBudgetsRefreshFailed(false);
    evaluatedSessionRef.current = false;
  };

  const handleExecuteTopUp = async (e) => {
    e.preventDefault();
    const numAmt = parseFloat(topUpAmount);
    if (!numAmt || numAmt <= 0) {
      alert("Please enter a valid top-up amount.");
      return;
    }

    setIsTopUpLoading(true);
    try {
      const res = await axios.post(`${PHP_API}/transfers_payments.php?action=topup`, {
        user_id: currentUser.user_id,
        amount: numAmt,
        source_bank: selectedFpxBank
      });

      if (res.data.status === 'success') {
        alert(`FPX Top-Up of ${formatMYR(numAmt)} via ${selectedFpxBank} Successful!\nRef: ${res.data.reference_id}`);
        setShowTopUpModal(false);
        setTopUpAmount('500');
        fetchTransactions();
        fetchBudgets();
      } else {
        alert(res.data.message || "Top-up failed");
      }
    } catch (err) {
      alert("FPX Gateway error. Ensure backend is running.");
    } finally {
      setIsTopUpLoading(false);
    }
  };

  const parseDuitNowEMVCo = (qrString) => {
    let merchantName = "Touch 'n Go / DuitNow Merchant";
    let amount = "";

    if (qrString.startsWith("000201")) {
      let i = 0;
      while (i < qrString.length - 4) {
        const tag = qrString.substring(i, i + 2);
        const len = parseInt(qrString.substring(i + 2, i + 4), 10);
        if (isNaN(len)) break;

        const val = qrString.substring(i + 4, i + 4 + len);
        i += 4 + len;

        if (tag === "59" && val) merchantName = val;
        if (tag === "54" && val) amount = val;
      }
      return { merchantName, amount };
    }

    if (qrString.includes("tngdigital") || qrString.includes("touchngo") || qrString.startsWith("duitnow://") || qrString.includes("http")) {
      try {
        const url = new URL(qrString.startsWith("duitnow://") ? qrString.replace("duitnow://", "http://dummy/") : qrString);
        return {
          merchantName: url.searchParams.get("name") || url.searchParams.get("merchant") || "TNG eWallet Merchant",
          amount: url.searchParams.get("amount") || ""
        };
      } catch (e) {}
    }

    return { merchantName: qrString.substring(0, 32), amount: "" };
  };

  const handleParsedScan = (text) => {
    const parsed = parseDuitNowEMVCo(text.trim());
    setQrMerchant(parsed.merchantName);
    if (parsed.amount) setQrPayAmount(parsed.amount);
    setScanView('checkout');
  };

  const handleQRPayment = async (e) => {
    e.preventDefault();
    const rawAmt = parseFloat(qrPayAmount);
    if (!qrPayAmount || isNaN(rawAmt) || rawAmt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const roundUpInvestment = enableRoundUp ? (Math.ceil(rawAmt / 5) * 5) - rawAmt : 0;
    const totalDeducted = rawAmt + roundUpInvestment;

    if (totalDeducted > wallet.total_balance) {
      alert(`Insufficient balance! Needed: ${formatMYR(totalDeducted)}. Available: ${formatMYR(wallet.total_balance)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${PHP_API}/transfers_payments.php?action=qr_payment`, {
        user_id: currentUser.user_id,
        merchant_name: qrMerchant,
        amount: rawAmt,
        category: qrCategory.trim() || 'Food & Dining',
        reference: qrPayRef
      });

      if (res.data.status === 'success') {
        if (roundUpInvestment > 0) {
          await axios.post(`${PHP_API}/transactions.php`, {
            user_id: currentUser.user_id,
            category: 'Investment',
            amount: roundUpInvestment,
            transaction_type: 'INVESTMENT',
            description: `Auto Round-Up Sweep from ${qrMerchant}`,
            transaction_date: new Date().toISOString().split('T')[0]
          });
        }

        alert(`DuitNow Payment of ${formatMYR(rawAmt)} Successful!${roundUpInvestment > 0 ? `\n+ ${formatMYR(roundUpInvestment)} swept into automated investment.` : ''}`);
        setShowQRModal(false);
        setQrPayAmount('');
        setScanView('scanner');
        fetchTransactions();
        fetchBudgets();
      } else {
        alert(res.data.message || "Payment error");
      }
    } catch (err) {
      alert("QR payment communication error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTransfer = async () => {
    setIsSubmitting(true);
    const numAmt = parseFloat(transferAmt);

    try {
      const res = await axios.post(`${PHP_API}/transfers_payments.php?action=transfer`, {
        user_id: currentUser.user_id,
        recipient_bank: transferBank,
        recipient_account: transferAcc,
        amount: numAmt,
        reference: transferRef
      });

      if (res.data.status === 'success') {
        setTransferReceipt({
          refId: res.data.reference_id,
          time: res.data.timestamp || new Date().toLocaleString(),
          recipient: recipientName,
          account: transferAcc,
          bank: transferBank,
          amount: numAmt,
          reference: transferRef
        });
        setTransferStep(3);
        fetchTransactions();
        fetchBudgets();
      } else {
        alert(res.data.message || "Transfer error");
      }
    } catch (err) {
      alert("Transfer communication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteInvestment = async (e) => {
    e.preventDefault();
    const numAmt = parseFloat(investAmount);
    if (!numAmt || numAmt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (numAmt > wallet.total_balance) {
      alert(`Insufficient balance! Available: ${formatMYR(wallet.total_balance)}. Please reload your wallet.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: currentUser.user_id,
        category: 'Investment',
        amount: numAmt,
        transaction_type: 'INVESTMENT',
        description: `Direct Allocation: ${selectedProduct.name}`,
        transaction_date: new Date().toISOString().split('T')[0]
      };

      const res = await axios.post(`${PHP_API}/transactions.php`, payload);
      if (res.data.status === 'success') {
        alert(`Investment of ${formatMYR(numAmt)} deployed successfully!`);
        setShowInvestModal(false);
        setSelectedProduct(null);
        fetchTransactions();
        fetchBudgets();
      } else {
        alert(res.data.message || "Investment failed");
      }
    } catch (err) {
      alert("Investment communication error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentAmt || parseFloat(paymentAmt) <= 0) return;
    const numAmt = parseFloat(paymentAmt);

    if (numAmt > wallet.total_balance) {
      alert(`Insufficient balance! Available: ${formatMYR(wallet.total_balance)}. Please top up your wallet.`);
      return;
    }

    try {
      const res = await axios.post(`${PHP_API}/transfers_payments.php?action=payment`, {
        user_id: currentUser.user_id,
        bill_type: paymentType,
        amount: numAmt
      });
      if (res.data.status === 'success') {
        alert(`Payment of ${formatMYR(numAmt)} to ${paymentType} successful!`);
        setPaymentAmt('');
        fetchTransactions();
        fetchBudgets();
      } else {
        alert(res.data.message || "Payment error");
      }
    } catch (err) {
      alert("Bill payment failed.");
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0) return;

    try {
      const res = await axios.post(`${PHP_API}/transactions.php`, {
        user_id: currentUser.user_id,
        category: txCategory.trim(),
        amount: parseFloat(txAmount),
        transaction_type: txType,
        description: txDesc || txCategory,
        transaction_date: new Date().toISOString().split('T')[0]
      });
      if (res.data.status === 'success') {
        fetchTransactions();
        fetchBudgets();
        setTxAmount('');
        setTxDesc('');
      }
    } catch (err) {
      alert("Failed to record transaction.");
    }
  };

  const displayedTransactions = useMemo(() => {
    if (selectedType === 'ALL') return transactions;
    return transactions.filter(t => t.transaction_type === selectedType);
  }, [transactions, selectedType]);

  const availableCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [transactions]);

  // Robust, Live Spending Distribution Pie Calculation directly from Transactions Ledger
  const pieData = useMemo(() => {
    const categoryTotals = {};

    transactions.forEach(t => {
      if (t.transaction_type === 'EXPENSE') {
        const cat = t.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(t.amount || 0);
      }
    });

    const entries = Object.keys(categoryTotals).map(cat => ({
      name: cat,
      value: Math.round(categoryTotals[cat] * 100) / 100
    })).filter(e => e.value > 0);

    // If transactions have no expense records yet, read current budget list spending
    if (entries.length === 0 && budgetList.length > 0) {
      return budgetList.map(b => ({
        name: b.category,
        value: parseFloat(b.current_spent) || 0
      })).filter(e => e.value > 0);
    }

    // Default visual baseline if completely new user
    if (entries.length === 0) {
      return [
        { name: 'Rental & Housing', value: 900.00 },
        { name: 'Food & Dining', value: 467.50 },
        { name: 'Bills & Utilities', value: 230.40 },
        { name: 'Transportation', value: 180.00 }
      ];
    }

    return entries;
  }, [transactions, budgetList]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const periodLabel = selectedMonth === 'ALL'
      ? `Full Year ${selectedYear}`
      : `${MONTH_NAMES[parseInt(selectedMonth, 10) - 1]} ${selectedYear}`;

    let periodIncome = 0;
    let periodExpense = 0;
    displayedTransactions.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.transaction_type === 'INCOME') periodIncome += amt;
      else periodExpense += amt;
    });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("AWRIS DIGITAL WEALTH BANK", 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Official E-Statement of Account | Regulated Rail Simulation", 14, 26);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 145, 26);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("ACCOUNT HOLDER DETAILS", 14, 46);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Account Name: ${currentUser.full_name}`, 14, 53);
    doc.text(`Account No: 1140 1234 5678 (Maybank Rail)`, 14, 59);
    doc.text(`Email Address: ${currentUser.email}`, 14, 65);
    doc.text(`Statement Period: ${periodLabel}`, 120, 53);
    doc.text(`Total Period Credits: +${formatMYR(periodIncome)}`, 120, 59);
    doc.text(`Total Period Debits: -${formatMYR(periodExpense)}`, 120, 65);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 71, 196, 71);

    const tableRows = displayedTransactions.map(t => [
      t.transaction_date,
      t.category,
      t.description || '-',
      t.transaction_type,
      `${t.transaction_type === 'EXPENSE' ? '-' : '+'}${formatMYR(t.amount)}`
    ]);

    autoTable(doc, {
      startY: 76,
      head: [['Date', 'Category', 'Description', 'Type', 'Amount (MYR)']],
      body: tableRows.length > 0 ? tableRows : [['-', 'No Records', 'No transactions found', '-', 'RM 0.00']],
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const finalY = (doc.lastAutoTable?.finalY || 160) + 14;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Audit Verification Hash: ${Math.random().toString(36).substring(2, 15)}`, 14, finalY);
    doc.text("System-generated statement. No physical signature required.", 14, finalY + 5);
    doc.save(`AWRIS_Statement_${periodLabel.replace(/\s+/g, '_')}_${currentUser.full_name.replace(/\s+/g, '_')}.pdf`);
  };

  const currentBankConfig = BANK_CONFIG[transferBank] || { lengths: [10, 12, 14], max: 16, placeholder: 'Account number' };

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ backgroundColor: '#FFFFFF', width: '100%', maxWidth: '440px', borderRadius: '24px', padding: '36px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '24px', fontWeight: '800' }}>
              A
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>
              {authView === 'login' ? 'Sign In to AWRIS' : 'Create an Account'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Adaptive Wealth and Risk Intelligence System
            </p>
          </div>

          {authError && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', marginBottom: '18px', color: '#DC2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} flexShrink={0} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={authView === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {authView === 'register' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Navein Rajan"
                  value={authFullName}
                  onChange={e => setAuthFullName(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', marginTop: '4px' }}
                  required
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', marginTop: '4px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', marginTop: '4px' }}
                required
              />
            </div>

            {authView === 'register' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Gross Monthly Income (RM)</label>
                <input
                  type="number"
                  step="50"
                  placeholder="4200.00"
                  value={authIncome}
                  onChange={e => setAuthIncome(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', marginTop: '4px' }}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthLoading}
              style={{
                backgroundColor: '#2563EB',
                color: '#FFF',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              {isAuthLoading ? 'Authenticating...' : authView === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', minHeight: '44px' }}>
            <div id="google-signin-real-btn" />
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => { setAuthView(authView === 'login' ? 'register' : 'login'); setAuthError(''); }}
              style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              {authView === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>

        {googlePendingProfile && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
            <div style={{ backgroundColor: '#FFF', width: '420px', borderRadius: '20px', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontWeight: '800' }}>
                  {googlePendingProfile.full_name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>Welcome to AWRIS</h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Setting up profile for <strong>{googlePendingProfile.email}</strong>
                </p>
              </div>

              <form onSubmit={handleCompleteGoogleOnboarding} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Full Legal Name</label>
                  <input
                    type="text"
                    value={googlePendingProfile.full_name}
                    onChange={e => setGooglePendingProfile({ ...googlePendingProfile, full_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', marginTop: '4px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Gross Monthly Income (RM)</label>
                  <input
                    type="number"
                    step="50"
                    min="500"
                    value={googleIncomeInput}
                    onChange={e => setGoogleIncomeInput(e.target.value)}
                    placeholder="4200.00"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: '700', marginTop: '4px' }}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setGooglePendingProfile(null)}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFF', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    style={{ flex: 2, backgroundColor: '#2563EB', color: '#FFF', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {isAuthLoading ? 'Initializing...' : 'Complete Setup'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <aside style={{ width: '260px', backgroundColor: '#0F172A', color: '#FFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 16px', minHeight: '100vh' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px 32px' }}>
            <div style={{ backgroundColor: '#2563EB', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
              A
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>AWRIS</h2>
              <p style={{ fontSize: '10px', color: '#94A3B8' }}>Adaptive Wealth & Risk</p>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'wallet', label: 'Virtual Wallet', icon: Wallet },
              { id: 'transactions', label: 'Transactions & Statements', icon: Receipt },
              { id: 'analytics', label: 'Financial Analytics', icon: LineChartIcon },
              { id: 'ai-advisor', label: 'AI Advisor & Investments', icon: Bot },
              { id: 'simulation', label: 'Monte Carlo & What-If', icon: TrendingUp },
              { id: 'profile', label: 'My Profile', icon: User }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: isActive ? '#2563EB' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '500',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            padding: '12px 14px', 
            borderRadius: '10px', 
            border: 'none', 
            backgroundColor: '#1E293B', 
            color: '#EF4444', 
            cursor: 'pointer', 
            fontSize: '14px', 
            fontWeight: '700',
            marginTop: '20px'
          }}
        >
          <LogOut size={18} />
          Logout Session
        </button>
      </aside>

      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', textTransform: 'capitalize' }}>
                {activeTab.replace('-', ' ')}
              </h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px' }}>
                <Radio size={12} /> LIVE SYNC ACTIVE
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B' }}>Personal finance intelligence & risk modeling</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setShowTopUpModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10B981', color: '#FFF', padding: '10px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              <PlusCircle size={16} /> FPX Top-Up
            </button>

            <button 
              onClick={() => { setShowQRModal(true); setQrTab('receive'); setScanView('scanner'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#EE2A43', color: '#FFF', padding: '10px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              <QrCode size={16} /> DuitNow QR
            </button>

            <button 
              onClick={() => { setShowTransferModal(true); setTransferStep(1); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563EB', color: '#FFF', padding: '10px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              <Send size={15} /> Bank Transfer
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#FFFFFF', padding: '8px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {currentUser.full_name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{currentUser.full_name}</p>
                <p style={{ fontSize: '11px', color: '#64748B' }}>{analytics?.investor_type || 'Aggressive'} Profile</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout Session"
              style={{ backgroundColor: '#FEE2E2', border: 'none', padding: '10px', borderRadius: '10px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {(transactionsRefreshFailed || budgetsRefreshFailed) && (
          <div role="status" aria-live="polite" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', color: '#92400E', fontSize: '13px' }}>
            Some account data could not be refreshed. Check your connection; the app will retry automatically.
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {activeAlerts && activeAlerts.length > 0 && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertTriangle size={20} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#991B1B' }}>Budget Threshold Alerts Active ({activeAlerts.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                    {activeAlerts.map((alertText, idx) => (
                      <p key={idx} style={{ fontSize: '12px', color: '#B91C1C' }}>• {alertText}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Statistical Spending Outlier Anomaly Banner */}
            {analytics?.anomalies && analytics.anomalies.length > 0 && (
              <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Activity size={20} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#92400E' }}>Statistical Anomaly Detected (+2.2σ Outlier)</h4>
                  {analytics.anomalies.map((anom, idx) => (
                    <p key={idx} style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                      • {anom.note} (+{anom.deviation_pct}% above your normal RM {anom.benchmark_average} average)
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
              {[
                { title: "Wallet Balance", val: formatMYR(wallet.total_balance), desc: "Available Funds (Live)", color: "#2563EB" },
                { title: "Net Take-Home Pay", val: formatMYR(netTakeHomePay), desc: `Gross: ${formatMYR(grossSalary)}`, color: "#10B981" },
                { title: "Invested Portfolio", val: formatMYR(wallet.total_invested), desc: "Robo DCA & Equity", color: "#8B5CF6" },
                { title: "Risk Capacity", val: `${analytics?.risk_capacity_score || 74}/100`, desc: `${analytics?.investor_type || 'Aggressive'} Risk Profile`, color: "#F59E0B" }
              ].map((card, idx) => (
                <div key={idx} style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>{card.title}</p>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', color: card.color, margin: '6px 0 2px' }}>{card.val}</h3>
                  <p style={{ fontSize: '11px', color: '#94A3B8' }}>{card.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
              <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>10-Year Monte Carlo & What-If Trajectory</h3>
                  <button 
                    onClick={() => setActiveTab('simulation')}
                    style={{ fontSize: '12px', color: '#2563EB', fontWeight: '700', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Adjust Parameters <ArrowUpRight size={14} />
                  </button>
                </div>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={mcResults?.yearly_trajectory || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="year" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} />
                      <Tooltip formatter={(value) => formatMYR(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="worst_case" stroke="#EF4444" name="Worst Case" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="average_case" stroke="#3B82F6" name="Average Case" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="what_if_boost" stroke="#10B981" name="What-If Optimized" strokeWidth={3} strokeDasharray="4 4" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Category Budget Guard</h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '6px' }}>
                    Monthly Thresholds
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {(budgetList.length > 0 ? budgetList : [
                    { category: 'Food & Dining', current_spent: 467.50, budget_limit: 800.00, percentage: 58 },
                    { category: 'Rental & Housing', current_spent: 900.00, budget_limit: 1200.00, percentage: 75 },
                    { category: 'Bills & Utilities', current_spent: 230.40, budget_limit: 350.00, percentage: 66 },
                    { category: 'Transportation & Petrol', current_spent: 180.00, budget_limit: 400.00, percentage: 45 },
                    { category: 'Entertainment & Leisure', current_spent: 95.00, budget_limit: 300.00, percentage: 32 }
                  ]).map((b, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600' }}>{b.category}</span>
                        <span style={{ color: b.percentage >= 90 ? '#EF4444' : b.percentage >= 75 ? '#F59E0B' : '#10B981', fontWeight: '700' }}>
                          {formatMYR(b.current_spent)} / {formatMYR(b.budget_limit)} ({b.percentage}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(b.percentage, 100)}%`, height: '100%', backgroundColor: b.percentage >= 90 ? '#EF4444' : b.percentage >= 75 ? '#F59E0B' : '#10B981' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
              <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Calculator size={18} color="#2563EB" />
                  <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Malaysian Statutory Salary Engine</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Gross Basic Salary:</span>
                    <strong>{formatMYR(grossSalary)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                    <span>EPF / KWSP (11%):</span>
                    <span>-{formatMYR(epfEmployee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                    <span>SOCSO / PERKESO:</span>
                    <span>-{formatMYR(socsoEmployee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                    <span>EIS (SIP):</span>
                    <span>-{formatMYR(eisEmployee)}</span>
                  </div>
                  <div style={{ borderTop: '2px dashed #E2E8F0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '800', color: '#0F172A' }}>Net Take-Home Pay:</span>
                    <strong style={{ color: '#16A34A', fontSize: '16px' }}>{formatMYR(netTakeHomePay)}</strong>
                  </div>
                </div>
              </div>

              {/* Dynamic Spending Distribution from Ledger */}
              <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Spending Distribution</h3>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => formatMYR(val)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VIRTUAL WALLET */}
        {activeTab === 'wallet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#0F172A', color: '#FFF', padding: '28px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>Total Available Balance</p>
                <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '6px 0 12px', color: '#38BDF8' }}>
                  {formatMYR(wallet.total_balance)}
                </h2>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#CBD5E1' }}>
                  <span>Total Inflow: <strong style={{ color: '#4ADE80' }}>+{formatMYR(wallet.total_income)}</strong></span>
                  <span>Total Outflow: <strong style={{ color: '#F87171' }}>-{formatMYR(wallet.total_expense)}</strong></span>
                  <span>Invested: <strong style={{ color: '#A78BFA' }}>{formatMYR(wallet.total_invested)}</strong></span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setShowTopUpModal(true)}
                  style={{ backgroundColor: '#10B981', color: '#FFF', padding: '12px 18px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <PlusCircle size={16} /> FPX Reload
                </button>
                <button 
                  onClick={() => { setShowQRModal(true); setQrTab('receive'); setScanView('scanner'); }}
                  style={{ backgroundColor: '#EE2A43', color: '#FFF', padding: '12px 18px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <QrCode size={16} /> My DuitNow QR
                </button>
                <button 
                  onClick={() => { setShowTransferModal(true); setTransferStep(1); }}
                  style={{ backgroundColor: '#2563EB', color: '#FFF', padding: '12px 20px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Send size={16} /> Instant Transfer
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Add Transaction Record</h3>
                <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Type</label>
                    <select value={txType} onChange={e => setTxType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }}>
                      <option value="EXPENSE">Expense (-)</option>
                      <option value="INCOME">Income (+)</option>
                      <option value="INVESTMENT">Investment</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Category</label>
                    <input type="text" value={txCategory} onChange={e => setTxCategory(e.target.value)} placeholder="e.g. Badminton, Food, Tech" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Amount (RM)</label>
                    <input type="number" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Description</label>
                    <input type="text" value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="Optional note" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
                  </div>
                  <button type="submit" style={{ backgroundColor: '#2563EB', color: '#FFF', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                    Save Transaction
                  </button>
                </form>
              </div>

              <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="#10B981" /> Pay Utility Bills
                </h4>
                <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Select Biller</label>
                    <select value={paymentType} onChange={e => setPaymentType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }}>
                      <option value="Electricity Bill (TNB)">Tenaga Nasional Berhad (TNB)</option>
                      <option value="Water Bill (PBA)">Perbadanan Bekalan Air (PBA)</option>
                      <option value="Internet (Unifi / Time)">Broadband / Fibre Internet</option>
                      <option value="Mobile Reload (Maxis / Celcom)">Mobile Telco Reload</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Amount (RM)</label>
                    <input type="number" step="0.01" placeholder="0.00" value={paymentAmt} onChange={e => setPaymentAmt(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} required />
                  </div>
                  <button type="submit" style={{ backgroundColor: '#10B981', color: '#FFF', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', marginTop: '14px' }}>
                    Process Payment
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRANSACTIONS & STATEMENTS */}
        {activeTab === 'transactions' && (
          <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Statement & Transaction Ledger</h3>
                <p style={{ fontSize: '12px', color: '#64748B' }}>Filter, audit, and generate bank statements across periods</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleDownloadPDF} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0F172A', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  <FileDown size={15} /> Download Filtered Statement (PDF)
                </button>
                <button 
                  onClick={() => { fetchTransactions(); fetchBudgets(); }} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', fontWeight: '700' }}>
                <Filter size={16} /> Filters:
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginRight: '6px' }}>Year</label>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '600', backgroundColor: '#FFF' }}>
                  <option value="ALL">All Years</option>
                  <option value="2026">2026 (Current)</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginRight: '6px' }}>Month</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '600', backgroundColor: '#FFF' }}>
                  <option value="ALL">All Months</option>
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx} value={String(idx + 1)}>
                      {name} {String(idx + 1) === currentSystemMonth ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginRight: '6px' }}>Category</label>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '600', backgroundColor: '#FFF' }}>
                  <option value="ALL">All Categories ({availableCategories.length})</option>
                  {availableCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginRight: '6px' }}>Type</label>
                <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '600', backgroundColor: '#FFF' }}>
                  <option value="ALL">All Flow</option>
                  <option value="INCOME">Income (+)</option>
                  <option value="EXPENSE">Expense (-)</option>
                  <option value="INVESTMENT">Investment</option>
                </select>
              </div>

              <button 
                onClick={() => { setSelectedMonth(currentSystemMonth); setSelectedYear(currentSystemYear); setSelectedCategory('ALL'); setSelectedType('ALL'); }}
                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#E2E8F0', color: '#475569', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                Reset to Current
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B', fontSize: '12px' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Description</th>
                  <th style={{ padding: '12px' }}>Type</th>
                  <th style={{ padding: '12px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.length > 0 ? (
                  displayedTransactions.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC', fontSize: '13px' }}>
                      <td style={{ padding: '12px', color: '#64748B', fontWeight: '600' }}>{t.transaction_date}</td>
                      <td style={{ padding: '12px', fontWeight: '700' }}>{t.category}</td>
                      <td style={{ padding: '12px', color: '#334155' }}>{t.description || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                          backgroundColor: t.transaction_type === 'INCOME' ? '#DCFCE7' : t.transaction_type === 'EXPENSE' ? '#FEE2E2' : '#EFF6FF',
                          color: t.transaction_type === 'INCOME' ? '#16A34A' : t.transaction_type === 'EXPENSE' ? '#DC2626' : '#2563EB'
                        }}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: '800' }}>
                        {t.transaction_type === 'EXPENSE' ? '-' : '+'}{formatMYR(t.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                      No transactions match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: FINANCIAL ANALYTICS & HEALTH RADAR */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
              <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Savings Rate</p>
                <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#10B981', margin: '6px 0' }}>{analytics?.savings_rate || 34}%</h3>
                <p style={{ fontSize: '11px', color: '#94A3B8' }}>Surplus ratio from Net Pay</p>
              </div>
              <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Expense Volatility</p>
                <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#F59E0B', margin: '6px 0' }}>{analytics?.expense_volatility || 'LOW'}</h3>
                <p style={{ fontSize: '11px', color: '#94A3B8' }}>Variance in transaction volume</p>
              </div>
              <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Spending Segments</p>
                <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#3B82F6', margin: '6px 0' }}>{analytics?.clusters?.length || 3} Categories</h3>
                <p style={{ fontSize: '11px', color: '#94A3B8' }}>Active ledger expense clusters</p>
              </div>
            </div>

            {/* 5-Axis Holistic Financial Health Radar */}
            <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>5-Axis Holistic Financial Health Radar</h3>
                  <p style={{ fontSize: '12px', color: '#64748B' }}>Multidimensional benchmark against Bank Negara Malaysia prudential metrics</p>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563EB', backgroundColor: '#EFF6FF', padding: '4px 10px', borderRadius: '8px' }}>
                  Grade: Strong Financial Solvency
                </span>
              </div>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics?.health_radar || []}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="axis" stroke="#64748B" fontSize={12} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" fontSize={10} />
                    <Radar name="User Score (0-100)" dataKey="score" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.4} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Category Outflow Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {analytics?.clusters?.map((c, idx) => (
                  <div key={idx} style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', backgroundColor: '#EFF6FF', padding: '4px 8px', borderRadius: '4px' }}>
                      Segment {c.cluster_group + 1}
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', marginTop: '10px' }}>{c.category}</h4>
                    <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Total Spent: <strong>{formatMYR(c.total_amount)}</strong></p>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>Frequency: {c.frequency} transactions</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI ADVISOR & EXPLAINABLE AI */}
        {activeTab === 'ai-advisor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={20} color="#2563EB" />
                    <h3 style={{ fontSize: '18px', fontWeight: '800' }}>AWRIS AI Wealth & Risk Advisor</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748B' }}>Real-time generative intelligence derived from your active MySQL ledger</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#2563EB' }}>{analytics?.risk_capacity_score || 74}</span>
                  <span style={{ fontSize: '14px', color: '#94A3B8' }}>/100</span>
                  <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{analytics?.investor_type || 'Aggressive'} Profile</p>
                </div>
              </div>

              {/* Explainable AI (XAI) Attribution Waterfall */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Explainable AI (XAI) Feature Attribution (SHAP Principles)</span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Auditability Standard compliant with BNM transparency guidelines</span>
                </div>
                <div style={{ width: '100%', height: 160 }}>
                  <ResponsiveContainer>
                    <BarChart layout="vertical" data={analytics?.xai_attributions || []} margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" stroke="#94A3B8" fontSize={11} domain={[-15, 25]} />
                      <YAxis dataKey="feature" type="category" stroke="#475569" fontSize={11} width={180} />
                      <Tooltip formatter={(val) => `${val > 0 ? '+' : ''}${val} Points`} />
                      <Bar dataKey="impact" radius={[4, 4, 4, 4]}>
                        {(analytics?.xai_attributions || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.impact >= 0 ? '#10B981' : '#EF4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <p style={{ fontSize: '12px', color: '#1E40AF', fontWeight: '600' }}>Equities / Stocks</p>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1D4ED8', margin: '4px 0' }}>{analytics?.stock_allocation_pct || 65}%</h3>
                  <p style={{ fontSize: '11px', color: '#60A5FA' }}>Higher growth potential</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <p style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>Fixed Income / Bonds</p>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#15803D', margin: '4px 0' }}>{analytics?.bond_allocation_pct || 25}%</h3>
                  <p style={{ fontSize: '11px', color: '#4ADE80' }}>Capital preservation</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#FEFCE8', border: '1px solid #FEF08A' }}>
                  <p style={{ fontSize: '12px', color: '#854D0E', fontWeight: '600' }}>Cash & Liquid Reserve</p>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#A16207', margin: '4px 0' }}>{analytics?.cash_allocation_pct || 10}%</h3>
                  <p style={{ fontSize: '11px', color: '#FACC15' }}>Emergency liquidity</p>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '10px', borderLeft: '4px solid #2563EB' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>Strategic Recommendation:</h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                  {analytics?.recommendation || "Maintain a baseline 3-month emergency fund in a high-yield liquid account. Channel remaining surplus into diversified global ETFs and EPF i-Saraan."}
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <MessageSquare size={18} color="#2563EB" />
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Ask financial advisor</h3>
              </div>
              <form onSubmit={handleAskAdvisor} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Ask any planning question (e.g. Can I buy an iPhone 18 Pro Max? or Can I take a car loan for 40,000 RM?)"
                  value={chatPrompt}
                  onChange={e => setChatPrompt(e.target.value)}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
                <button
                  type="submit"
                  disabled={isChatLoading}
                  style={{ backgroundColor: '#2563EB', color: '#FFF', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                >
                  {isChatLoading ? 'Analyzing...' : 'Ask AI'}
                </button>
              </form>

              {chatResponse && (
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  <strong>Advisor Response:</strong>
                  <p style={{ marginTop: '6px' }}>{chatResponse}</p>
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>Curated Regulated Investment Portfolios</h3>
                  <p style={{ fontSize: '13px', color: '#64748B' }}>Deploy funds directly from your available balance into regulated Malaysian funds</p>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: '8px' }}>
                  Securities Commission Regulated Rails
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
                {(analytics?.portfolios || defaultInvestmentOptions).map((opt) => (
                  <div key={opt.id} style={{ borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: opt.color || '#2563EB' }}>
                          {opt.riskLevel}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#16A34A' }}>
                          {opt.expectedReturn}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>{opt.name}</h4>
                      <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '12px' }}>{opt.provider}</p>
                      <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
                        <p><strong>Holdings:</strong> {opt.assetClass}</p>
                        <p style={{ marginTop: '2px' }}><strong>Min. Entry:</strong> {formatMYR(opt.minInvestment)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => { setSelectedProduct(opt); setInvestAmount(String(opt.minInvestment * 5)); setShowInvestModal(true); }}
                      style={{ width: '100%', backgroundColor: '#0F172A', color: '#FFF', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <ArrowUpRight size={16} /> Invest Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MONTE CARLO & WHAT-IF PLANNER */}
        {activeTab === 'simulation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Monte Carlo Macroeconomic Stress-Testing & What-If Planner</h3>
                  <p style={{ fontSize: '13px', color: '#64748B' }}>
                    {mcResults?.scenario_desc || "Simulating stochastic portfolio paths over a 10-year horizon."}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
                  {[
                    { id: 'BASE', label: 'Baseline Growth' },
                    { id: 'BEAR_CRASH', label: 'Market Shock (-20%)' },
                    { id: 'STAGFLATION', label: 'Stagflation' },
                    { id: 'BULL_RALLY', label: 'Bull Expansion' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setMcScenario(s.id); runMonteCarlo(s.id, whatIfExtraSavings); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        backgroundColor: mcScenario === s.id ? '#2563EB' : 'transparent',
                        color: mcScenario === s.id ? '#FFF' : '#64748B'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '14px', alignItems: 'flex-end', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Monthly Contribution (RM)</label>
                  <input type="number" value={mcMonthly} onChange={e => setMcMonthly(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Target Wealth Goal (RM)</label>
                  <input type="number" step="5000" value={mcTargetGoal} onChange={e => setMcTargetGoal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Expected Return (%)</label>
                  <input type="number" step="0.5" value={mcReturn} onChange={e => setMcReturn(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Horizon (Years)</label>
                  <input type="number" value={mcYears} onChange={e => setMcYears(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
                </div>
                <button onClick={() => runMonteCarlo(mcScenario, whatIfExtraSavings)} style={{ backgroundColor: '#2563EB', color: '#FFF', padding: '10px 18px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', height: '42px' }}>
                  Recalculate
                </button>
              </div>

              {/* Dynamic Prescriptive What-If Slider Control */}
              <div style={{ backgroundColor: '#F0FDF4', padding: '16px', borderRadius: '12px', border: '1px solid #BBF7D0', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sliders size={20} color="#16A34A" />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#166534' }}>What-If Scenario Optimizer:</strong>
                    <p style={{ fontSize: '12px', color: '#15803D' }}>
                      Increase monthly contribution by <strong>+RM {whatIfExtraSavings}</strong> by cutting discretionary spending
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="range" 
                    min="50" 
                    max="800" 
                    step="50" 
                    value={whatIfExtraSavings} 
                    onChange={e => {
                      const newBoost = Number(e.target.value);
                      setWhatIfExtraSavings(newBoost);
                      runMonteCarlo(mcScenario, newBoost);
                    }} 
                    style={{ width: '180px', accentColor: '#16A34A', cursor: 'pointer' }} 
                  />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#166534', minWidth: '70px' }}>+RM {whatIfExtraSavings}</span>
                </div>
              </div>

              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={mcResults?.yearly_trajectory || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="year" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip formatter={(value) => formatMYR(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="worst_case" stroke="#EF4444" name="Worst Case (10th %ile)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="average_case" stroke="#3B82F6" name="Average Case (50th %ile)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="what_if_boost" stroke="#10B981" name="Optimized Path (What-If)" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="best_case" stroke="#8B5CF6" name="Best Case (90th %ile)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px' }}>
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <p style={{ fontSize: '12px', color: '#991B1B', fontWeight: '600' }}>Worst Case (10th %)</p>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#DC2626', margin: '4px 0' }}>{formatMYR(mcResults?.worst_case_final)}</h3>
                  <p style={{ fontSize: '11px', color: '#F87171' }}>Market drawdown bottom</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <p style={{ fontSize: '12px', color: '#1E40AF', fontWeight: '600' }}>Baseline Median</p>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#2563EB', margin: '4px 0' }}>{formatMYR(mcResults?.average_case_final)}</h3>
                  <p style={{ fontSize: '11px', color: '#60A5FA' }}>Standard expected path</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <p style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>Optimized What-If Final</p>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#16A34A', margin: '4px 0' }}>{formatMYR(mcResults?.what_if_final)}</h3>
                  <p style={{ fontSize: '11px', color: '#4ADE80' }}>Accelerated trajectory</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#FAF5FF', border: '1px solid #E9D5FF' }}>
                  <p style={{ fontSize: '12px', color: '#6B21A8', fontWeight: '600' }}>Goal Probability (P_target)</p>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#9333EA', margin: '4px 0' }}>{mcResults?.probability_of_success ?? 75}%</h3>
                  <p style={{ fontSize: '11px', color: '#C084FC' }}>Chance to reach {formatMYR(mcTargetGoal)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>User Account Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Full Name</label>
                <input type="text" value={currentUser.full_name} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Email Address</label>
                <input type="email" value={currentUser.email} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Gross Monthly Income (RM)</label>
                <input type="number" value={currentUser.monthly_income} onChange={e => setCurrentUser({ ...currentUser, monthly_income: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
              </div>
              <button onClick={() => alert("Profile information saved!")} style={{ backgroundColor: '#2563EB', color: '#FFF', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', marginTop: '12px' }}>
                Save Changes
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FPX RELOAD MODAL */}
      {showTopUpModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', width: '480px', borderRadius: '20px', padding: '28px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <button onClick={() => setShowTopUpModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#DCFCE7', padding: '10px', borderRadius: '12px' }}>
                <PlusCircle size={24} color="#10B981" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>FPX Online Banking Reload</h3>
                <p style={{ fontSize: '12px', color: '#64748B' }}>Direct electronic debit to your AWRIS virtual wallet</p>
              </div>
            </div>

            <form onSubmit={handleExecuteTopUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Select Bank (FPX Rail)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
                  {FPX_BANKS.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => setSelectedFpxBank(b.id)}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: selectedFpxBank === b.id ? '2px solid #10B981' : '1px solid #CBD5E1',
                        backgroundColor: selectedFpxBank === b.id ? '#F0FDF4' : '#FFF',
                        color: selectedFpxBank === b.id ? '#15803D' : '#1E293B',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Reload Amount (RM)</label>
                <input
                  type="number"
                  step="10"
                  min="10"
                  placeholder="0.00"
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '18px', fontWeight: '800', marginTop: '4px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {[100, 250, 500, 1000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(String(amt))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1',
                      backgroundColor: topUpAmount === String(amt) ? '#DCFCE7' : '#FFF',
                      color: topUpAmount === String(amt) ? '#16A34A' : '#475569',
                      fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    +RM {amt}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                <ShieldCheck size={18} color="#16A34A" />
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>Direct FPX simulated gateway clearing with audit trail</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowTopUpModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFF', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isTopUpLoading} style={{ flex: 2, backgroundColor: '#10B981', color: '#FFF', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                  {isTopUpLoading ? 'Connecting to FPX...' : `Proceed to Pay ${formatMYR(topUpAmount)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANK TRANSFER MODAL */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', width: '460px', borderRadius: '18px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', position: 'relative' }}>
            <button onClick={() => setShowTransferModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
              <X size={20} />
            </button>

            {transferStep === 1 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ backgroundColor: '#EFF6FF', padding: '10px', borderRadius: '10px' }}>
                    <Send size={22} color="#2563EB" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>DuitNow / Instant Transfer</h3>
                    <p style={{ fontSize: '12px', color: '#64748B' }}>Transfer to any local bank account instantly</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Destination Bank</label>
                    <select value={transferBank} onChange={e => { setTransferBank(e.target.value); setTransferAcc(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px', fontWeight: '600' }}>
                      <option value="Maybank">Maybank (12 Digits)</option>
                      <option value="CIMB Bank">CIMB Bank (10 or 14 Digits)</option>
                      <option value="Public Bank">Public Bank (10 Digits)</option>
                      <option value="RHB Bank">RHB Bank (10 or 14 Digits)</option>
                      <option value="Hong Leong Bank">Hong Leong Bank (11 Digits)</option>
                      <option value="AmBank">AmBank (13 Digits)</option>
                      <option value="Bank Islam">Bank Islam (14 Digits)</option>
                      <option value="Ryt Bank">Ryt Bank (10 Digits)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Recipient Account Number</label>
                    <input type="text" inputMode="numeric" maxLength={currentBankConfig.max} placeholder={currentBankConfig.placeholder} value={transferAcc} onChange={e => setTransferAcc(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Recipient Name</label>
                    <input type="text" placeholder="e.g. Vigneesh" value={recipientName} onChange={e => setRecipientName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Amount (RM)</label>
                    <input type="number" step="0.01" placeholder="0.00" value={transferAmt} onChange={e => setTransferAmt(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px', fontSize: '16px', fontWeight: '700' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Recipient Reference</label>
                    <input type="text" placeholder="e.g. Monthly Rent, Dinner Split" value={transferRef} onChange={e => setTransferRef(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
                  </div>

                  <button 
                    onClick={() => {
                      if (!currentBankConfig.lengths.includes(transferAcc.length)) {
                        alert(`Invalid account format for ${transferBank}. Required length: ${currentBankConfig.lengths.join(' or ')} digits.`);
                        return;
                      }
                      if (!recipientName.trim() || !transferAmt || parseFloat(transferAmt) <= 0) {
                        alert("Please complete recipient details and amount.");
                        return;
                      }
                      if (parseFloat(transferAmt) > wallet.total_balance) {
                        alert(`Insufficient balance! Your available balance is ${formatMYR(wallet.total_balance)}. Please reload your wallet.`);
                        return;
                      }
                      setTransferStep(2);
                    }}
                    style={{ backgroundColor: '#2563EB', color: '#FFF', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer', marginTop: '6px' }}
                  >
                    Proceed to Verification
                  </button>
                </div>
              </div>
            )}

            {transferStep === 2 && (
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>Review & Confirm Transfer</h3>
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px', margin: '16px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>To Bank:</span><strong>{transferBank}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Account:</span><strong>{transferAcc}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Recipient:</span><strong>{recipientName}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reference:</span><strong>{transferRef}</strong></div>
                  <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '700' }}>Deducted:</span>
                    <strong style={{ color: '#DC2626', fontSize: '18px' }}>{formatMYR(transferAmt)}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setTransferStep(1)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFF' }}>Back</button>
                  <button onClick={handleConfirmTransfer} disabled={isSubmitting} style={{ flex: 2, backgroundColor: '#2563EB', color: '#FFF', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: '700' }}>
                    {isSubmitting ? 'Processing...' : 'Authorize Transfer'}
                  </button>
                </div>
              </div>
            )}

            {transferStep === 3 && transferReceipt && (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle size={54} color="#10B981" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Transfer Successful</h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '20px' }}>Simulated funds debited immediately.</p>
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reference ID:</span><strong>{transferReceipt.refId}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Recipient:</span><strong>{transferReceipt.recipient}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bank:</span><strong>{transferReceipt.bank}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Amount:</span><strong style={{ color: '#2563EB' }}>{formatMYR(transferReceipt.amount)}</strong></div>
                </div>
                <button onClick={() => { setShowTransferModal(false); setTransferAmt(''); setTransferAcc(''); }} style={{ width: '100%', backgroundColor: '#0F172A', color: '#FFF', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: '700' }}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DUITNOW QR MODAL WITH SMART ROUND-UP SAVINGS */}
      {showQRModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', width: '460px', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', position: 'relative' }}>
            <button onClick={() => { setShowQRModal(false); setScanView('scanner'); }} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#FEE2E2', padding: '8px', borderRadius: '10px' }}>
                <QrCode size={22} color="#DC2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>DuitNow National QR</h3>
                <p style={{ fontSize: '12px', color: '#64748B' }}>Malaysia Interoperable Standard with Round-Up Micro-Savings</p>
              </div>
            </div>

            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
              <button onClick={() => { setQrTab('receive'); setScanView('scanner'); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', backgroundColor: qrTab === 'receive' ? '#FFF' : 'transparent', color: qrTab === 'receive' ? '#0F172A' : '#64748B' }}>
                Receive Funds (My QR)
              </button>
              <button onClick={() => { setQrTab('pay'); setScanView('scanner'); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', backgroundColor: qrTab === 'pay' ? '#FFF' : 'transparent', color: qrTab === 'pay' ? '#0F172A' : '#64748B' }}>
                Scan & Pay (TNG / Bank)
              </button>
            </div>

            {qrTab === 'receive' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '2px solid #FEE2E2', marginBottom: '16px' }}>
                  <div style={{ backgroundColor: '#EE2A43', color: '#FFF', fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                    DuitNow QR
                  </div>
                  <QRCodeSVG 
                    value={`00020101021126580016MY.PAYNET.DUITNOW01121140123456785204599953034585802MY5912${currentUser.full_name.toUpperCase()}6006PENANG6304ABCD`} 
                    size={180} 
                    level="H"
                    includeMargin={true}
                  />
                  <p style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginTop: '10px' }}>{currentUser.full_name}</p>
                  <p style={{ fontSize: '11px', color: '#64748B' }}>AWRIS Virtual Maybank • 1140 1234 5678</p>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B' }}>Show this QR code to any Touch 'n Go, MAE, or DuitNow-enabled app.</p>
              </div>
            )}

            {qrTab === 'pay' && (
              <div>
                {scanView === 'scanner' ? (
                  <div>
                    <QRScanner onScanSuccess={(text) => handleParsedScan(text)} />
                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px' }}>— Or test with standard merchants —</p>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {["Touch 'n Go Merchant", 'Zus Coffee (Gurney Plaza)', 'Restoran Pelita', 'FamilyMart Queensbay'].map(m => (
                          <button key={m} type="button" onClick={() => { setQrMerchant(m); setScanView('checkout'); }} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFF', cursor: 'pointer', fontWeight: '600' }}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleQRPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                      <p style={{ fontSize: '11px', color: '#1E40AF', fontWeight: '700' }}>✓ SCANNED MERCHANT RECOGNIZED</p>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1D4ED8', marginTop: '2px' }}>{qrMerchant}</h4>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Expense Category (for Budget Guard)</label>
                      <input 
                        type="text" 
                        list="budget-categories-list"
                        placeholder="e.g. Food & Dining, Bills & Utilities"
                        value={qrCategory} 
                        onChange={e => setQrCategory(e.target.value)} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px', fontSize: '13px', fontWeight: '600' }} 
                        required 
                      />
                      <datalist id="budget-categories-list">
                        <option value="Food & Dining" />
                        <option value="Rental & Housing" />
                        <option value="Bills & Utilities" />
                        <option value="Transportation & Petrol" />
                        <option value="Entertainment & Leisure" />
                      </datalist>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Payment Amount (RM)</label>
                      <input type="number" step="0.01" placeholder="0.00" value={qrPayAmount} onChange={e => setQrPayAmount(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px', fontSize: '16px', fontWeight: '700' }} required autoFocus />
                      <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Available Balance: {formatMYR(wallet.total_balance)}</p>
                    </div>

                    {/* Smart Round-Up Micro-Savings Checkbox */}
                    <div style={{ backgroundColor: '#F0FDF4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        id="roundup-toggle"
                        checked={enableRoundUp} 
                        onChange={e => setEnableRoundUp(e.target.checked)} 
                        style={{ width: '16px', height: '16px', accentColor: '#10B981', cursor: 'pointer' }}
                      />
                      <label htmlFor="roundup-toggle" style={{ fontSize: '12px', color: '#166534', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Coins size={14} /> <strong>Enable Smart Round-Up:</strong> Sweep fractional change to nearest RM 5 into your investment portfolio
                      </label>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Payment Note</label>
                      <input type="text" placeholder="e.g. Lunch & Drinks" value={qrPayRef} onChange={e => setQrPayRef(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button type="button" onClick={() => setScanView('scanner')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFF', fontWeight: '600', cursor: 'pointer' }}>
                        Re-scan
                      </button>
                      <button type="submit" disabled={isSubmitting} style={{ flex: 2, backgroundColor: '#EE2A43', color: '#FFF', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                        {isSubmitting ? 'Paying...' : 'Confirm DuitNow Pay'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIRECT INVESTMENT MODAL */}
      {showInvestModal && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', width: '480px', borderRadius: '20px', padding: '28px', position: 'relative' }}>
            <button onClick={() => { setShowInvestModal(false); setSelectedProduct(null); }} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ backgroundColor: '#EFF6FF', padding: '10px', borderRadius: '12px' }}>
                <TrendingUp size={24} color="#2563EB" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>Authorize Investment</h3>
                <p style={{ fontSize: '12px', color: '#64748B' }}>Direct execution into regulated fund rail</p>
              </div>
            </div>

            <form onSubmit={handleExecuteInvestment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>PORTFOLIO SELECTED</p>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{selectedProduct.name}</h4>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Target: {selectedProduct.expectedReturn} • {selectedProduct.assetClass}</p>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Investment Amount (RM)</label>
                <input type="number" step="10" min={selectedProduct.minInvestment} value={investAmount} onChange={e => setInvestAmount(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px', fontSize: '18px', fontWeight: '800' }} required autoFocus />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748B' }}>
                  <span>Min Entry: {formatMYR(selectedProduct.minInvestment)}</span>
                  <span>Available Balance: <strong>{formatMYR(wallet.total_balance)}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {[100, 250, 500, 1000].map(amt => (
                  <button key={amt} type="button" onClick={() => setInvestAmount(String(amt))} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: investAmount === String(amt) ? '#EFF6FF' : '#FFF', color: investAmount === String(amt) ? '#2563EB' : '#475569', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                    +RM {amt}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowInvestModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFF', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 2, backgroundColor: '#2563EB', color: '#FFF', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                  {isSubmitting ? 'Deploying Funds...' : `Confirm & Invest ${formatMYR(investAmount)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
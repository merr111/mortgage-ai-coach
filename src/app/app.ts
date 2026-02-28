import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ExtraPayment {
  id: number;
  month: number;
  amount: number;
  strategy: PrepaymentStrategy;
}

type CommissionMode = 'none' | 'interestRate' | 'balanceRate' | 'fixed';
type PrepaymentStrategy = 'reduceTime' | 'reducePayment';
type AppLanguage = 'en' | 'ka';
type InterestPhase = 'interestHeavy' | 'balanced' | 'principalHeavy';
type CoachExtraTier = 'small' | 'meaningful' | 'aggressive';
type CoachTimingAdvice = 'asap' | 'keepPlan';
type CoachPaymentPattern = 'none' | 'lumpSum' | 'recurring' | 'mixed';

interface ExtraPaymentBucket {
  reduceTime: number;
  reducePayment: number;
}

interface AmortizationRow {
  month: number;
  dueDate: string;
  startingBalance: number;
  basePayment: number;
  commissionPaid: number;
  totalPaymentDue: number;
  extraPayment: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  cumulativeInterest: number;
  cumulativeInterestSaved: number;
}

interface ScheduleSummary {
  months: number;
  totalInterest: number;
  totalCommission: number;
  totalPaid: number;
}

interface ScheduleResult {
  rows: AmortizationRow[];
  summary: ScheduleSummary;
}

interface PaymentMixBar {
  year: number;
  principalPaid: number;
  extraPaid: number;
  interestPaid: number;
  totalPaid: number;
  principalPct: number;
  interestPct: number;
  principalLoanPct: number;
  cumulativePrincipalLoanPct: number;
  columnHeightPx: number;
}

interface AIPrepaymentTip {
  month: number;
  dueDate: string;
  interestPaid: number;
  interestSharePct: number;
  suggestedExtra: number;
  estimatedInterestSaved: number;
  extraTier: CoachExtraTier;
  phase: InterestPhase;
  reason?: string;
}

interface AICoachSummary {
  bestMonths: number[];
  recommendedStrategy: PrepaymentStrategy;
  recommendedExtra: number;
  recommendedTier: CoachExtraTier;
  currentPhase: InterestPhase;
  projectedMonthsCut: number;
  projectedInterestSaved: number;
  timingAdvice: CoachTimingAdvice;
  paymentPattern: CoachPaymentPattern;
  budgetRisk: boolean;
}

interface PersistedAppState {
  language?: AppLanguage;
  loanAmount: number;
  annualInterestRate: number;
  loanTermMonths: number;
  firstPaymentDate: string;
  commissionMode: CommissionMode;
  prepaymentStrategy?: PrepaymentStrategy;
  commissionRate: number;
  fixedCommission: number;
  extraPayments: ExtraPayment[];
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  constructor(private readonly cdr: ChangeDetectorRef) {}

  protected readonly currency = 'GEL';
  protected language: AppLanguage = 'en';
  protected readonly languageOptions: AppLanguage[] = ['en', 'ka'];
  protected aiStatus: 'idle' | 'loading' | 'connected' | 'error' = 'idle';
  protected aiErrorMessage = '';

  private readonly i18n: Record<AppLanguage, Record<string, string>> = {
    en: {
      'app.title': 'MortgageOS',
      'app.subtitle': 'Mortgage calculator dashboard',
      'lang.label': 'Language',
      'lang.en': 'English',
      'lang.ka': 'ქართული',
      'panel.inputs.title': 'Loan Inputs',
      'panel.inputs.subtitle': 'Set loan details and optional early payments.',
      'input.loanAmount': 'Loan amount',
      'input.annualInterest': 'Annual interest (%)',
      'input.termMonths': 'Term (months)',
      'input.firstPaymentDate': 'First payment date',
      'input.commissionType': 'Commission type',
      'input.commissionRate': 'Commission rate (%)',
      'input.fixedCommission': 'Fixed commission',
      'prepay.title': 'Extra prepayments',
      'common.add': 'Add',
      'prepay.month': 'Month',
      'prepay.amount': 'Amount',
      'prepay.effect': 'Effect',
      'common.remove': 'Remove',
      'panel.results.title': 'Results',
      'panel.results.subtitle': 'Yearly split of principal and interest payments.',
      'error.title': 'Calculation Error',
      'metric.basePayment': 'Base payment',
      'metric.interestSaved': 'Interest saved',
      'metric.commissionSaved': 'Commission saved',
      'metric.totalSaved': 'Total saved',
      'metric.totalInterestToPay': 'Total interest you will pay by the end',
      'chart.title': 'Interest vs Principal (Yearly)',
      'chart.principal': 'Principal',
      'chart.interest': 'Interest',
      'chart.hint': 'Hover each year bar to see amounts, extra prepayment and percentage split.',
      'chart.principalInclExtra': 'Principal (incl. extra)',
      'chart.extraPrepayment': 'Extra prepayment',
      'chart.paidVsLoanYear': 'Paid vs loan (year)',
      'chart.cumulativePaidVsLoan': 'Cumulative paid vs loan',
      'chart.principalPct': 'Principal %',
      'chart.interestPct': 'Interest %',
      'chart.total': 'Total',
      'panel.schedule.title': 'Repayment Schedule',
      'panel.schedule.subtitle': 'Monthly breakdown of payment, principal, interest, commission and saved interest.',
      'schedule.payoffDate': 'Payoff date',
      'schedule.monthsReduced': 'Months reduced',
      'schedule.totalSaved': 'Total saved',
      'schedule.date': 'Date',
      'schedule.payment': 'Payment',
      'schedule.principal': 'Principal',
      'schedule.interest': 'Interest',
      'schedule.commission': 'Commission',
      'schedule.extra': 'Extra',
      'schedule.startingBalance': 'Starting balance',
      'schedule.endingBalance': 'Ending balance',
      'schedule.savedInterest': 'Saved interest',
      'commission.none': 'No commission',
      'commission.interestRate': 'Percent of interest',
      'commission.balanceRate': 'Percent of balance',
      'commission.fixed': 'Fixed monthly amount',
      'strategy.reduceTime': 'Reduce loan time',
      'strategy.reducePayment': 'Reduce monthly payment',
      'bar.title.year': 'Year',
      'bar.title.principal': 'Principal (incl. extra)',
      'bar.title.extra': 'Extra prepayment',
      'bar.title.paidYear': 'Paid vs loan this year',
      'bar.title.cumulativePaid': 'Cumulative paid vs loan',
      'bar.title.interest': 'Interest',
      'bar.title.total': 'Total',
      'ai.badge': 'Free AI Coach',
      'ai.title': 'Best months for extra payment',
      'ai.subtitle': 'Based on your interest curve, these months usually give the biggest savings.',
      'ai.interestMonth': 'Interest this month',
      'ai.shareMonth': 'Interest share',
      'ai.suggestedExtra': 'Suggested extra',
      'ai.estimatedSaved': 'Estimated interest saved',
      'ai.action': 'Apply suggestion',
      'ai.empty': 'No suggestion yet. Click Connect Free Coach to generate tips.',
      'ai.note': 'Tip: earlier extra payments usually save more interest.',
      'ai.connect': 'Connect Free Coach',
      'ai.refresh': 'Refresh Suggestions',
      'ai.statusIdle': 'Free coach is ready. Click connect to generate suggestions.',
      'ai.statusLoading': 'Analyzing your schedule...',
      'ai.statusConnected': 'Connected: simulated AI suggestions generated locally from your mortgage data.',
      'ai.statusError': 'AI error: {message}',
      'ai.reason': 'Why this month',
      'ai.summary.title': 'AI Coach',
      'ai.summary.bestMonths': 'Best months',
      'ai.summary.bestMonthsNote': 'These months have the highest interest cost in your schedule.',
      'ai.summary.strategy': 'Best strategy',
      'ai.summary.phase': 'Current phase',
      'ai.summary.extraTier': 'Suggested extra tier',
      'ai.summary.impact':
        'If you pay +{extra} {currency}/month, you may cut about {months} months and save about {saved} {currency} interest.',
      'ai.summary.tip': 'Tip: extra payments are strongest while interest share is above 60%.',
      'ai.summary.timing.asap':
        'Timing: pay lump-sum as early as possible, ideally in the next payment cycle.',
      'ai.summary.timing.keepPlan': 'Timing: keep extra payments early in the schedule for bigger savings.',
      'ai.summary.pattern.none': 'Pattern: even small recurring extras can reduce total interest.',
      'ai.summary.pattern.lumpSum': 'Pattern: one-time lump sum early usually beats waiting.',
      'ai.summary.pattern.recurring': 'Pattern: recurring extra payments give steady reduction.',
      'ai.summary.pattern.mixed': 'Pattern: combine early lump sum + recurring extras for strongest effect.',
      'ai.summary.risk':
        'Cashflow warning: extra payment is above 3x monthly payment. Consider splitting over 2-3 months.',
      'ai.phase.interestHeavy': 'Interest-heavy',
      'ai.phase.balanced': 'Balanced',
      'ai.phase.principalHeavy': 'Principal-heavy',
      'ai.tier.small': 'Small boost (<5%)',
      'ai.tier.meaningful': 'Meaningful (5%-20%)',
      'ai.tier.aggressive': 'Aggressive (>20%)',
      'ai.error.noScheduleData': 'No schedule data. Set loan inputs first.',
      'ai.error.noValidTips': 'No valid coach tips generated.',
      'ai.error.requestFailed': 'Coach simulation failed.',
      'tips.title': 'Smart tips',
      'tips.one': 'Put extra payments in months with high interest share first.',
      'tips.two': 'Use "Reduce loan time" for maximum total savings.',
      'tips.three': 'Review and rebalance your extra payments every 6 months.',
      'ads.label': 'Sponsored',
      'ads.title': 'Partner area',
      'ads.body': 'Place refinancing, insurance, or bank partner offers here.',
      'ads.cta': 'Learn more',
      'error.loanAmountGt0': 'Loan amount must be greater than 0.',
      'error.monthlyPaymentGt0': 'Monthly payment must be greater than 0.',
      'error.scheduleExceeded': 'Schedule exceeded {months} months. Increase payment to finish the loan.',
      'error.paymentTooLow':
        'Monthly payment is too low. It does not cover monthly interest, so the loan cannot be paid off.',
      'error.unableToCalculate': 'Unable to calculate schedule with current values.'
    },
    ka: {
      'app.title': 'MortgageOS',
      'app.subtitle': 'იპოთეკის კალკულატორის დაფა',
      'lang.label': 'ენა',
      'lang.en': 'English',
      'lang.ka': 'ქართული',
      'panel.inputs.title': 'სესხის პარამეტრები',
      'panel.inputs.subtitle': 'დააყენეთ სესხის დეტალები და სურვილისამებრ დამატებითი წინსწრებით გადახდები.',
      'input.loanAmount': 'სესხის თანხა',
      'input.annualInterest': 'წლიური პროცენტი (%)',
      'input.termMonths': 'ვადა (თვეებში)',
      'input.firstPaymentDate': 'პირველი გადახდის თარიღი',
      'input.commissionType': 'საკომისიოს ტიპი',
      'input.commissionRate': 'საკომისიოს პროცენტი (%)',
      'input.fixedCommission': 'ფიქსირებული საკომისიო',
      'prepay.title': 'დამატებითი წინსწრებითი გადახდები',
      'common.add': 'დამატება',
      'prepay.month': 'თვე',
      'prepay.amount': 'თანხა',
      'prepay.effect': 'ეფექტი',
      'common.remove': 'წაშლა',
      'panel.results.title': 'შედეგები',
      'panel.results.subtitle': 'ძირის და პროცენტის წლიური განაწილება.',
      'error.title': 'გამოთვლის შეცდომა',
      'metric.basePayment': 'საბაზო გადახდა',
      'metric.interestSaved': 'დაზოგილი პროცენტი',
      'metric.commissionSaved': 'დაზოგილი საკომისიო',
      'metric.totalSaved': 'ჯამური დაზოგვა',
      'metric.totalInterestToPay': 'სულ რამდენ პროცენტს გადაიხდით ბოლომდე',
      'chart.title': 'პროცენტი vs ძირი (წლიურად)',
      'chart.principal': 'ძირი',
      'chart.interest': 'პროცენტი',
      'chart.hint': 'ბარზე მიიტანეთ კურსორი რომ ნახოთ თანხები, დამატებითი გადახდა და პროცენტული განაწილება.',
      'chart.principalInclExtra': 'ძირი (დამატებითის ჩათვლით)',
      'chart.extraPrepayment': 'დამატებითი წინსწრებითი გადახდა',
      'chart.paidVsLoanYear': 'სესხისგან გადახდილი % (წელი)',
      'chart.cumulativePaidVsLoan': 'დაგროვილი გადახდილი % სესხიდან',
      'chart.principalPct': 'ძირის %',
      'chart.interestPct': 'პროცენტის %',
      'chart.total': 'სულ',
      'panel.schedule.title': 'დაფარვის გრაფიკი',
      'panel.schedule.subtitle': 'ყოველთვიური განაწილება: გადახდა, ძირი, პროცენტი, საკომისიო და დაზოგილი პროცენტი.',
      'schedule.payoffDate': 'დასრულების თარიღი',
      'schedule.monthsReduced': 'შემცირებული თვეები',
      'schedule.totalSaved': 'ჯამური დაზოგვა',
      'schedule.date': 'თარიღი',
      'schedule.payment': 'გადასახდელი თანხა',
      'schedule.principal': 'ძირი',
      'schedule.interest': 'პროცენტი',
      'schedule.commission': 'საკომისიო',
      'schedule.extra': 'დამატებითი',
      'schedule.startingBalance': 'საწყისი ნაშთი',
      'schedule.endingBalance': 'დასასრული ნაშთი',
      'schedule.savedInterest': 'დაზოგილი პროცენტი',
      'commission.none': 'საკომისიოს გარეშე',
      'commission.interestRate': 'პროცენტის %',
      'commission.balanceRate': 'ნაშთის %',
      'commission.fixed': 'ფიქსირებული ყოველთვიური თანხა',
      'strategy.reduceTime': 'ვადის შემცირება',
      'strategy.reducePayment': 'თვიური გადახდის შემცირება',
      'bar.title.year': 'წელი',
      'bar.title.principal': 'ძირი (დამატებითის ჩათვლით)',
      'bar.title.extra': 'დამატებითი წინსწრებითი გადახდა',
      'bar.title.paidYear': 'სესხიდან გადახდილი % ამ წელს',
      'bar.title.cumulativePaid': 'სესხიდან დაგროვილი გადახდილი %',
      'bar.title.interest': 'პროცენტი',
      'bar.title.total': 'სულ',
      'ai.badge': 'უფასო AI ასისტენტი',
      'ai.title': 'სად ჯობს დამატებითი გადახდა',
      'ai.subtitle': 'თქვენი პროცენტის დინამიკაზე დაყრდნობით ეს თვეები ხშირად იძლევა ყველაზე დიდ დაზოგვას.',
      'ai.interestMonth': 'პროცენტი ამ თვეში',
      'ai.shareMonth': 'პროცენტის წილი',
      'ai.suggestedExtra': 'რეკომენდებული დამატებითი თანხა',
      'ai.estimatedSaved': 'დაზოგილი პროცენტის შეფასება',
      'ai.action': 'დამატება გეგმაში',
      'ai.empty': 'ჯერ რეკომენდაცია არ არის. დააჭირეთ უფასო ასისტენტის დაკავშირებას.',
      'ai.note': 'რჩევა: რაც უფრო ადრე შეიტანთ დამატებით თანხას, მით მეტ პროცენტს დაზოგავთ.',
      'ai.connect': 'უფასო ასისტენტის დაკავშირება',
      'ai.refresh': 'რეკომენდაციების განახლება',
      'ai.statusIdle': 'უფასო ასისტენტი მზადაა. დააჭირეთ დაკავშირებას და მიიღეთ რეკომენდაციები.',
      'ai.statusLoading': 'მიმდინარეობს გრაფიკის ანალიზი...',
      'ai.statusConnected': 'დაკავშირებულია: ლოკალურად სიმულირებული AI რეკომენდაციები გენერირებულია თქვენი სესხის მონაცემებით.',
      'ai.statusError': 'AI შეცდომა: {message}',
      'ai.reason': 'რატომ ეს თვე',
      'ai.summary.title': 'AI ასისტენტი',
      'ai.summary.bestMonths': 'საუკეთესო თვეები',
      'ai.summary.bestMonthsNote': 'ეს თვეები თქვენს გრაფიკში ყველაზე მაღალი პროცენტის ღირებულებით გამოირჩევა.',
      'ai.summary.strategy': 'საუკეთესო სტრატეგია',
      'ai.summary.phase': 'მიმდინარე ფაზა',
      'ai.summary.extraTier': 'რეკომენდებული დამატებითი დონე',
      'ai.summary.impact':
        'თუ ყოველთვე გადაიხდით +{extra} {currency}-ს, შეიძლება დაახლოებით {months} თვე მოიკლოს და დაზოგოთ დაახლოებით {saved} {currency} პროცენტი.',
      'ai.summary.tip': 'რჩევა: დამატებითი გადახდა ყველაზე ეფექტურია როცა პროცენტის წილი 60%-ზე მეტია.',
      'ai.summary.timing.asap':
        'დრო: ერთჯერადი დიდი თანხა ჯობს რაც შეიძლება ადრე, იდეალურად შემდეგ გადახდის ციკლში.',
      'ai.summary.timing.keepPlan':
        'დრო: დამატებითი გადახდები სესხის ადრეულ ეტაპზე უფრო დიდ დაზოგვას იძლევა.',
      'ai.summary.pattern.none': 'შაბლონი: მცირე მაგრამ რეგულარული დამატებითი გადახდაც ამცირებს პროცენტს.',
      'ai.summary.pattern.lumpSum': 'შაბლონი: ადრეული ერთჯერადი დიდი გადახდა ხშირად ჯობს გადადებას.',
      'ai.summary.pattern.recurring': 'შაბლონი: ყოველთვიური დამატებითი გადახდა სტაბილურ შემცირებას იძლევა.',
      'ai.summary.pattern.mixed':
        'შაბლონი: ადრეული დიდი თანხა + ყოველთვიური დამატება ყველაზე ძლიერ ეფექტს იძლევა.',
      'ai.summary.risk':
        'ფულადი ნაკადის გაფრთხილება: დამატებითი გადახდა თვიურ გადასახადზე 3-ჯერ მეტია. სჯობს დაყოთ 2-3 თვეზე.',
      'ai.phase.interestHeavy': 'პროცენტზე დატვირთული',
      'ai.phase.balanced': 'დაბალანსებული',
      'ai.phase.principalHeavy': 'ძირზე დატვირთული',
      'ai.tier.small': 'მცირე ზრდა (<5%)',
      'ai.tier.meaningful': 'მნიშვნელოვანი (5%-20%)',
      'ai.tier.aggressive': 'აგრესიული (>20%)',
      'ai.error.noScheduleData': 'გრაფიკის მონაცემი არ არის. ჯერ შეავსეთ სესხის პარამეტრები.',
      'ai.error.noValidTips': 'სარწმუნო რეკომენდაციები ვერ დაგენერირდა.',
      'ai.error.requestFailed': 'ასისტენტის სიმულაცია ვერ შესრულდა.',
      'tips.title': 'ჭკვიანი რჩევები',
      'tips.one': 'ჯერ შეიტანეთ დამატებითი თანხა იმ თვეებში, სადაც პროცენტის წილი მაღალია.',
      'tips.two': 'მაქსიმალური დაზოგვისთვის გამოიყენეთ "ვადის შემცირება".',
      'tips.three': 'ყოველ 6 თვეში გადახედეთ გეგმას და შეასწორეთ დამატებითი გადახდები.',
      'ads.label': 'რეკლამა',
      'ads.title': 'პარტნიორის სივრცე',
      'ads.body': 'აქ შეგიძლიათ განათავსოთ რეფინანსირების, დაზღვევის ან ბანკის შეთავაზებები.',
      'ads.cta': 'მეტის ნახვა',
      'error.loanAmountGt0': 'სესხის თანხა უნდა იყოს 0-ზე მეტი.',
      'error.monthlyPaymentGt0': 'თვიური გადახდა უნდა იყოს 0-ზე მეტი.',
      'error.scheduleExceeded':
        'გრაფიკმა გადააჭარბა {months} თვეს. გაზარდეთ გადახდა, რომ სესხი დასრულდეს.',
      'error.paymentTooLow':
        'თვიური გადახდა ძალიან დაბალია. იგი არ ფარავს თვიურ პროცენტს და სესხი ვერ დაიფარება.',
      'error.unableToCalculate': 'მიმდინარე პარამეტრებით გამოთვლა ვერ მოხერხდა.'
    }
  };

  protected loanAmount = 300000;
  protected annualInterestRate = 11;
  protected loanTermMonths = 84;
  protected firstPaymentDate = '2026-03-09';

  protected commissionMode: CommissionMode = 'interestRate';
  protected commissionRate = 4;
  protected fixedCommission = 0;

  protected readonly commissionModeOptions: CommissionMode[] = [
    'none',
    'interestRate',
    'balanceRate',
    'fixed'
  ];
  protected readonly prepaymentStrategyOptions: PrepaymentStrategy[] = [
    'reduceTime',
    'reducePayment'
  ];

  protected extraPayments: ExtraPayment[] = [
    { id: 1, month: 3, amount: 17059.17, strategy: 'reduceTime' },
    { id: 2, month: 9, amount: 26700, strategy: 'reduceTime' }
  ];

  protected paymentUsed = 0;
  protected baselineRows: AmortizationRow[] = [];
  protected planRows: AmortizationRow[] = [];
  protected baselineSummary: ScheduleSummary | null = null;
  protected planSummary: ScheduleSummary | null = null;
  protected errorMessage = '';
  protected hoveredBarYear: number | null = null;
  protected aiModelTips: AIPrepaymentTip[] = [];
  protected aiCoachSummary: AICoachSummary | null = null;

  private readonly storageKey = 'mortgage-os-state-v1';
  private nextExtraPaymentId = 3;
  private readonly maxScheduleMonths = 1200;
  private readonly paymentMixMaxBars = 18;
  private aiRequestToken = 0;
  private readonly fakeAiReasonTemplates: Record<AppLanguage, string[]> = {
    en: [
      'High interest share this month, so extra payment is very effective.',
      'Remaining balance is still high here, so prepayment impact is strong.',
      'Interest cost is among the highest in this period.',
      'Paying extra now reduces future interest-heavy months.'
    ],
    ka: [
      'ამ თვეში პროცენტის წილი მაღალია და დამატებითი გადახდა ყველაზე ეფექტურია.',
      'ამ პერიოდში ნაშთი ჯერ კიდევ დიდია, ამიტომ წინსწრებით გადახდა ძლიერად მუშაობს.',
      'ამ მონაკვეთში პროცენტის ღირებულება ერთ-ერთი ყველაზე მაღალია.',
      'ახლა დამატება ამცირებს შემდეგ პროცენტით დატვირთულ თვეებს.'
    ]
  };

  ngOnInit(): void {
    this.restoreFromStorage();
    this.recalculate();
  }

  protected addExtraPayment(): void {
    this.extraPayments = [
      ...this.extraPayments,
      {
        id: this.nextExtraPaymentId++,
        month: Math.min(this.loanTermMonths, 12),
        amount: 1000,
        strategy: 'reduceTime'
      }
    ];
    this.recalculate();
  }

  protected removeExtraPayment(id: number): void {
    this.extraPayments = this.extraPayments.filter((item) => item.id !== id);
    this.recalculate();
  }

  protected onLanguageChange(): void {
    this.saveToStorage();
  }

  protected recalculate(): void {
    this.errorMessage = '';
    this.aiRequestToken += 1;
    this.aiModelTips = [];
    this.aiCoachSummary = null;
    if (this.aiStatus === 'connected') {
      this.aiStatus = 'idle';
    }
    this.saveToStorage();

    const principal = this.normalizeMoney(this.loanAmount);
    const annualRate = Math.max(0, this.annualInterestRate);
    const initialTermMonths = Math.max(1, Math.round(this.loanTermMonths));

    if (principal <= 0) {
      this.resetResults();
      this.errorMessage = this.t('error.loanAmountGt0');
      return;
    }

    const monthlyRate = annualRate / 100 / 12;
    const payment = this.calculateMonthlyPayment(principal, monthlyRate, initialTermMonths);

    if (payment <= 0) {
      this.resetResults();
      this.errorMessage = this.t('error.monthlyPaymentGt0');
      return;
    }

    this.paymentUsed = payment;

    try {
      const baseline = this.buildSchedule(
        principal,
        monthlyRate,
        payment,
        initialTermMonths,
        new Map<number, ExtraPaymentBucket>()
      );
      const planned = this.buildSchedule(
        principal,
        monthlyRate,
        payment,
        initialTermMonths,
        this.buildExtraPaymentMap()
      );

      const baselineRowsByMonth = new Map<number, AmortizationRow>(
        baseline.rows.map((row) => [row.month, row])
      );

      this.planRows = planned.rows.map((row) => {
        const baselineRow = baselineRowsByMonth.get(row.month);
        const baselineInterestAtMonth = baselineRow?.cumulativeInterest ?? baseline.summary.totalInterest;
        return {
          ...row,
          cumulativeInterestSaved: this.roundMoney(baselineInterestAtMonth - row.cumulativeInterest)
        };
      });

      this.baselineRows = baseline.rows;
      this.baselineSummary = baseline.summary;
      this.planSummary = planned.summary;
    } catch (error) {
      this.resetResults();
      this.errorMessage =
        error instanceof Error ? error.message : this.t('error.unableToCalculate');
    }
  }

  protected get interestSaved(): number {
    if (!this.baselineSummary || !this.planSummary) {
      return 0;
    }

    return this.roundMoney(this.baselineSummary.totalInterest - this.planSummary.totalInterest);
  }

  protected get commissionSaved(): number {
    if (!this.baselineSummary || !this.planSummary) {
      return 0;
    }

    return this.roundMoney(this.baselineSummary.totalCommission - this.planSummary.totalCommission);
  }

  protected get totalCostSaved(): number {
    return this.roundMoney(this.interestSaved + this.commissionSaved);
  }

  protected get totalInterestToPay(): number {
    if (!this.planSummary) {
      return 0;
    }

    return this.roundMoney(this.planSummary.totalInterest);
  }

  protected get monthsReduced(): number {
    if (!this.baselineSummary || !this.planSummary) {
      return 0;
    }

    return Math.max(0, this.baselineSummary.months - this.planSummary.months);
  }

  protected get completionDate(): string {
    if (this.planRows.length === 0) {
      return '';
    }

    return this.planRows[this.planRows.length - 1].dueDate;
  }

  protected get hasChartData(): boolean {
    return this.planRows.length > 0;
  }

  protected get paymentMixBars(): PaymentMixBar[] {
    return this.buildPaymentMixBars(this.paymentMixMaxBars);
  }

  protected get aiPrepaymentTips(): AIPrepaymentTip[] {
    return this.aiModelTips;
  }

  protected get aiStatusText(): string {
    switch (this.aiStatus) {
      case 'loading':
        return this.t('ai.statusLoading');
      case 'connected':
        return this.t('ai.statusConnected');
      case 'error':
        return this.t('ai.statusError', { message: this.aiErrorMessage || 'Unknown error' });
      case 'idle':
      default:
        return this.t('ai.statusIdle');
    }
  }

  protected get aiActionLabel(): string {
    return this.aiStatus === 'connected' ? this.t('ai.refresh') : this.t('ai.connect');
  }

  protected barTitle(bar: PaymentMixBar): string {
    return `${this.t('bar.title.year')} ${bar.year}
${this.t('bar.title.principal')}: ${bar.principalPaid.toFixed(2)} ${this.currency} (${bar.principalPct.toFixed(2)}%)
${this.t('bar.title.extra')}: ${bar.extraPaid.toFixed(2)} ${this.currency}
${this.t('bar.title.paidYear')}: ${bar.principalLoanPct.toFixed(2)}%
${this.t('bar.title.cumulativePaid')}: ${bar.cumulativePrincipalLoanPct.toFixed(2)}%
${this.t('bar.title.interest')}: ${bar.interestPaid.toFixed(2)} ${this.currency} (${bar.interestPct.toFixed(2)}%)
${this.t('bar.title.total')}: ${bar.totalPaid.toFixed(2)} ${this.currency}`;
  }

  protected t(key: string, params: Record<string, string | number> = {}): string {
    const value = this.i18n[this.language][key] ?? this.i18n.en[key] ?? key;
    return Object.entries(params).reduce(
      (acc, [paramKey, paramValue]) => acc.replaceAll(`{${paramKey}}`, String(paramValue)),
      value
    );
  }

  protected languageLabel(lang: AppLanguage): string {
    return this.t(`lang.${lang}`);
  }

  protected commissionModeLabel(mode: CommissionMode): string {
    return this.t(`commission.${mode}`);
  }

  protected prepaymentStrategyLabel(strategy: PrepaymentStrategy): string {
    return this.t(`strategy.${strategy}`);
  }

  protected phaseLabel(phase: InterestPhase): string {
    return this.t(`ai.phase.${phase}`);
  }

  protected extraTierLabel(tier: CoachExtraTier): string {
    return this.t(`ai.tier.${tier}`);
  }

  protected coachBestMonthsText(summary: AICoachSummary): string {
    const monthLabel = this.t('prepay.month');
    return summary.bestMonths.map((month) => `${monthLabel} ${month}`).join(', ');
  }

  protected coachImpactText(summary: AICoachSummary): string {
    return this.t('ai.summary.impact', {
      extra: summary.recommendedExtra.toFixed(2),
      currency: this.currency,
      months: summary.projectedMonthsCut,
      saved: summary.projectedInterestSaved.toFixed(2)
    });
  }

  protected applyAiTip(tip: AIPrepaymentTip): void {
    const month = Math.max(1, Math.round(tip.month));
    const amount = this.roundMoney(Math.max(0, tip.suggestedExtra));

    if (amount <= 0) {
      return;
    }

    const existingIndex = this.extraPayments.findIndex(
      (item) => Math.round(item.month) === month && item.strategy === 'reduceTime'
    );

    if (existingIndex >= 0) {
      const next = [...this.extraPayments];
      const existing = next[existingIndex];
      next[existingIndex] = {
        ...existing,
        amount: this.roundMoney(existing.amount + amount)
      };
      this.extraPayments = next;
    } else {
      this.extraPayments = [
        ...this.extraPayments,
        {
          id: this.nextExtraPaymentId++,
          month,
          amount,
          strategy: 'reduceTime'
        }
      ];
    }

    this.recalculate();
  }

  protected requestAiSuggestions(): void {
    if (!this.baselineSummary || this.baselineRows.length === 0) {
      this.aiStatus = 'error';
      this.aiErrorMessage = this.t('ai.error.noScheduleData');
      this.aiCoachSummary = null;
      this.cdr.detectChanges();
      return;
    }

    const requestToken = ++this.aiRequestToken;
    this.aiStatus = 'loading';
    this.aiErrorMessage = '';
    this.aiModelTips = [];
    this.aiCoachSummary = null;
    this.cdr.detectChanges();

    const delayMs = 450 + Math.floor(Math.random() * 350);
    setTimeout(() => {
      if (requestToken !== this.aiRequestToken) {
        return;
      }

      try {
        const tips = this.simulateAiResponse(4);
        if (tips.length === 0) {
          this.aiStatus = 'error';
          this.aiErrorMessage = this.t('ai.error.noValidTips');
        } else {
          this.aiModelTips = tips;
          this.aiCoachSummary = this.buildAiCoachSummary(tips);
          this.aiStatus = 'connected';
        }
      } catch (error) {
        this.aiStatus = 'error';
        this.aiErrorMessage =
          error instanceof Error ? error.message : this.t('ai.error.requestFailed');
      }

      this.cdr.detectChanges();
    }, delayMs);
  }

  private buildExtraPaymentMap(): Map<number, ExtraPaymentBucket> {
    const extraPaymentMap = new Map<number, ExtraPaymentBucket>();

    for (const extra of this.extraPayments) {
      const month = Math.max(1, Math.round(extra.month));
      const amount = this.normalizeMoney(extra.amount);

      if (amount <= 0) {
        continue;
      }

      const bucket = extraPaymentMap.get(month) ?? { reduceTime: 0, reducePayment: 0 };

      if (extra.strategy === 'reducePayment') {
        bucket.reducePayment += amount;
      } else {
        bucket.reduceTime += amount;
      }

      extraPaymentMap.set(month, bucket);
    }

    return extraPaymentMap;
  }

  private buildSchedule(
    principal: number,
    monthlyRate: number,
    monthlyPayment: number,
    initialTermMonths: number,
    extraPaymentMap: Map<number, ExtraPaymentBucket>
  ): ScheduleResult {
    const rows: AmortizationRow[] = [];
    let month = 1;
    let balance = principal;
    let currentMonthlyPayment = monthlyPayment;
    let totalInterest = 0;
    let totalCommission = 0;
    let totalPaid = 0;
    let dueDate = this.parseIsoDate(this.firstPaymentDate);

    while (balance > 0.0000001) {
      if (month > this.maxScheduleMonths) {
        throw new Error(
          this.t('error.scheduleExceeded', { months: this.maxScheduleMonths })
        );
      }

      const startingBalance = balance;

      const interestPaid = startingBalance * monthlyRate;

      if (currentMonthlyPayment <= interestPaid + 1e-8) {
        throw new Error(this.t('error.paymentTooLow'));
      }

      const scheduledPayment = Math.min(currentMonthlyPayment, startingBalance + interestPaid);
      const principalPaid = scheduledPayment - interestPaid;
      const monthExtra = extraPaymentMap.get(month) ?? { reduceTime: 0, reducePayment: 0 };
      const rawExtraPayment = monthExtra.reduceTime + monthExtra.reducePayment;
      const availableExtra = Math.max(0, startingBalance - principalPaid);
      const extraPayment = Math.min(rawExtraPayment, availableExtra);
      const appliedReducePayment =
        rawExtraPayment > 0 ? (extraPayment * monthExtra.reducePayment) / rawExtraPayment : 0;
      const commissionPaid = this.calculateCommission(startingBalance, interestPaid);
      const totalPaymentDue = scheduledPayment + commissionPaid;

      balance = Math.max(0, startingBalance - principalPaid - extraPayment);
      totalInterest += interestPaid;
      totalCommission += commissionPaid;
      totalPaid += totalPaymentDue + extraPayment;

      rows.push({
        month,
        dueDate: this.formatDateAsIso(dueDate),
        startingBalance: this.roundMoney(startingBalance),
        basePayment: this.roundMoney(scheduledPayment),
        commissionPaid: this.roundMoney(commissionPaid),
        totalPaymentDue: this.roundMoney(totalPaymentDue),
        extraPayment: this.roundMoney(extraPayment),
        principalPaid: this.roundMoney(principalPaid),
        interestPaid: this.roundMoney(interestPaid),
        endingBalance: this.roundMoney(balance),
        cumulativeInterest: this.roundMoney(totalInterest),
        cumulativeInterestSaved: 0
      });

      if (appliedReducePayment > 0 && balance > 0.0000001) {
        const monthsAfterCurrent = Math.max(1, initialTermMonths - month);
        currentMonthlyPayment = this.calculateMonthlyPayment(balance, monthlyRate, monthsAfterCurrent);
      }

      month += 1;
      dueDate = this.addMonths(dueDate, 1);
    }

    return {
      rows,
      summary: {
        months: rows.length,
        totalInterest: this.roundMoney(totalInterest),
        totalCommission: this.roundMoney(totalCommission),
        totalPaid: this.roundMoney(totalPaid)
      }
    };
  }

  private calculateCommission(startingBalance: number, interestPaid: number): number {
    const rate = Math.max(0, this.commissionRate) / 100;
    const fixed = Math.max(0, this.fixedCommission);

    switch (this.commissionMode) {
      case 'interestRate':
        return interestPaid * rate;
      case 'balanceRate':
        return startingBalance * rate;
      case 'fixed':
        return fixed;
      case 'none':
      default:
        return 0;
    }
  }

  private calculateMonthlyPayment(principal: number, monthlyRate: number, termMonths: number): number {
    if (monthlyRate === 0) {
      return principal / termMonths;
    }

    const growthFactor = (1 + monthlyRate) ** termMonths;
    return (principal * monthlyRate * growthFactor) / (growthFactor - 1);
  }

  private buildPaymentMixBars(maxBars: number): PaymentMixBar[] {
    if (this.planRows.length === 0) {
      return [];
    }

    const yearlyTotals = new Map<number, { principalBase: number; extra: number; interest: number }>();

    for (const row of this.planRows) {
      const parsedYear = Number.parseInt(row.dueDate.slice(0, 4), 10);
      const year = Number.isNaN(parsedYear)
        ? new Date(this.firstPaymentDate).getFullYear() + Math.floor((row.month - 1) / 12)
        : parsedYear;
      const current = yearlyTotals.get(year) ?? { principalBase: 0, extra: 0, interest: 0 };
      current.principalBase += row.principalPaid;
      current.extra += row.extraPayment;
      current.interest += row.interestPaid;
      yearlyTotals.set(year, current);
    }

    const sortedEntries = [...yearlyTotals.entries()].sort((a, b) => a[0] - b[0]).slice(0, maxBars);
    const maxYearTotal = Math.max(
      1,
      ...sortedEntries.map(([, totals]) => totals.principalBase + totals.extra + totals.interest)
    );

    const chartMaxHeightPx = 190;
    const chartMinHeightPx = 14;
    const originalLoanAmount = Math.max(0.000001, this.normalizeMoney(this.loanAmount));
    let cumulativePrincipalPaid = 0;

    return sortedEntries.map(([year, totals]) => {
      const principalPaid = totals.principalBase + totals.extra;
      const totalPaid = principalPaid + totals.interest;
      const scaledHeight = (totalPaid / maxYearTotal) * chartMaxHeightPx;
      const safeTotal = Math.max(0.000001, totalPaid);
      cumulativePrincipalPaid += principalPaid;

      return {
        year,
        principalPaid: this.roundMoney(principalPaid),
        extraPaid: this.roundMoney(totals.extra),
        interestPaid: this.roundMoney(totals.interest),
        totalPaid: this.roundMoney(totalPaid),
        principalPct: (principalPaid / safeTotal) * 100,
        interestPct: (totals.interest / safeTotal) * 100,
        principalLoanPct: (principalPaid / originalLoanAmount) * 100,
        cumulativePrincipalLoanPct: Math.min(100, (cumulativePrincipalPaid / originalLoanAmount) * 100),
        columnHeightPx: Math.max(chartMinHeightPx, scaledHeight)
      };
    });
  }

  private buildAiPrepaymentTips(limit: number): AIPrepaymentTip[] {
    if (this.baselineRows.length === 0 || !this.baselineSummary) {
      return [];
    }

    const monthlyRate = Math.max(0, this.annualInterestRate) / 100 / 12;
    const maxMonth = this.baselineSummary.months;

    const candidates: Array<AIPrepaymentTip & { score: number }> = this.baselineRows.map((row) => {
      const interestSharePct = row.basePayment > 0 ? (row.interestPaid / row.basePayment) * 100 : 0;
      const phase = this.getInterestPhase(interestSharePct);
      const extraRatio = this.suggestedExtraRatioForShare(interestSharePct);
      const suggestedExtra = this.roundMoney(Math.max(100, row.basePayment * extraRatio));
      const extraTier = this.classifyExtraTier(extraRatio * 100);
      const monthsRemaining = Math.max(1, maxMonth - row.month + 1);
      const estimatedInterestSaved = this.roundMoney(suggestedExtra * monthlyRate * monthsRemaining);
      const score = row.interestPaid + row.startingBalance * monthlyRate;

      return {
        month: row.month,
        dueDate: row.dueDate,
        interestPaid: row.interestPaid,
        interestSharePct,
        suggestedExtra,
        estimatedInterestSaved,
        extraTier,
        phase,
        reason: this.t('ai.note'),
        score
      };
    });

    return candidates
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.month - b.month;
      })
      .slice(0, limit)
      .map(({ score: _score, ...tip }) => tip);
  }

  private simulateAiResponse(limit: number): AIPrepaymentTip[] {
    const baseTips = this.buildAiPrepaymentTips(limit);
    if (baseTips.length === 0) {
      return [];
    }

    return baseTips.map((tip, index) => ({
      ...tip,
      reason: this.buildFakeAiReason(tip, index)
    }));
  }

  private buildFakeAiReason(tip: AIPrepaymentTip, rank: number): string {
    const templates = this.fakeAiReasonTemplates[this.language];
    const template = templates[rank % templates.length];

    return `${template} (${this.t('ai.phase.' + tip.phase)}, ${this.t('ai.tier.' + tip.extraTier)}, ${this.t(
      'ai.shareMonth'
    )}: ${tip.interestSharePct.toFixed(1)}%)`;
  }

  private buildAiCoachSummary(tips: AIPrepaymentTip[]): AICoachSummary | null {
    if (!this.baselineSummary || this.baselineRows.length === 0 || tips.length === 0) {
      return null;
    }

    const recommendedStrategy = this.recommendCoachStrategy();
    const recommendedExtra = this.roundMoney(
      tips.reduce((acc, tip) => acc + tip.suggestedExtra, 0) / tips.length
    );
    const extraPctOfPayment = this.paymentUsed > 0 ? (recommendedExtra / this.paymentUsed) * 100 : 0;
    const recommendedTier = this.classifyExtraTier(extraPctOfPayment);
    const firstRow = this.baselineRows[0];
    const currentShare = firstRow.basePayment > 0 ? (firstRow.interestPaid / firstRow.basePayment) * 100 : 0;
    const currentPhase = this.getInterestPhase(currentShare);
    const estimated = this.estimateRecurringImpact(recommendedExtra, recommendedStrategy);

    return {
      bestMonths: tips.slice(0, 3).map((tip) => tip.month),
      recommendedStrategy,
      recommendedExtra,
      recommendedTier,
      currentPhase,
      projectedMonthsCut: estimated.monthsCut,
      projectedInterestSaved: estimated.interestSaved,
      timingAdvice: this.detectTimingAdvice(),
      paymentPattern: this.detectPaymentPattern(),
      budgetRisk: this.hasBudgetRisk()
    };
  }

  private estimateRecurringImpact(
    extraAmount: number,
    strategy: PrepaymentStrategy
  ): { monthsCut: number; interestSaved: number } {
    if (!this.baselineSummary || extraAmount <= 0) {
      return { monthsCut: 0, interestSaved: 0 };
    }

    const principal = this.normalizeMoney(this.loanAmount);
    const annualRate = Math.max(0, this.annualInterestRate);
    const initialTermMonths = Math.max(1, Math.round(this.loanTermMonths));
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = this.calculateMonthlyPayment(principal, monthlyRate, initialTermMonths);

    if (monthlyPayment <= 0) {
      return { monthsCut: 0, interestSaved: 0 };
    }

    const scenarioMap = new Map<number, ExtraPaymentBucket>();
    for (let month = 1; month <= this.baselineSummary.months; month += 1) {
      scenarioMap.set(
        month,
        strategy === 'reducePayment'
          ? { reduceTime: 0, reducePayment: extraAmount }
          : { reduceTime: extraAmount, reducePayment: 0 }
      );
    }

    try {
      const scenario = this.buildSchedule(
        principal,
        monthlyRate,
        monthlyPayment,
        initialTermMonths,
        scenarioMap
      );

      return {
        monthsCut: Math.max(0, this.baselineSummary.months - scenario.summary.months),
        interestSaved: this.roundMoney(
          Math.max(0, this.baselineSummary.totalInterest - scenario.summary.totalInterest)
        )
      };
    } catch {
      return { monthsCut: 0, interestSaved: 0 };
    }
  }

  private recommendCoachStrategy(): PrepaymentStrategy {
    const positiveExtras = this.extraPayments.filter(
      (item) => this.normalizeMoney(item.amount) > 0
    );
    if (positiveExtras.length === 0) {
      return 'reduceTime';
    }

    if (this.isRecurringExtraPattern(positiveExtras)) {
      return 'reduceTime';
    }

    const reduceTimeCount = positiveExtras.filter((item) => item.strategy === 'reduceTime').length;
    const reducePaymentCount = positiveExtras.filter(
      (item) => item.strategy === 'reducePayment'
    ).length;

    return reducePaymentCount > reduceTimeCount ? 'reducePayment' : 'reduceTime';
  }

  private detectPaymentPattern(): CoachPaymentPattern {
    const positiveExtras = this.extraPayments.filter(
      (item) => this.normalizeMoney(item.amount) > 0
    );

    if (positiveExtras.length === 0) {
      return 'none';
    }

    const hasLumpSum = positiveExtras.some(
      (item) => this.normalizeMoney(item.amount) >= this.paymentUsed * 2
    );
    const recurring = this.isRecurringExtraPattern(positiveExtras);

    if (hasLumpSum && recurring) {
      return 'mixed';
    }

    if (hasLumpSum) {
      return 'lumpSum';
    }

    return recurring || positiveExtras.length > 1 ? 'recurring' : 'none';
  }

  private detectTimingAdvice(): CoachTimingAdvice {
    const hasFutureLumpSum = this.extraPayments.some((item) => {
      const amount = this.normalizeMoney(item.amount);
      const month = Math.max(1, Math.round(item.month));
      return amount >= this.paymentUsed * 2 && month > 1;
    });

    return hasFutureLumpSum ? 'asap' : 'keepPlan';
  }

  private hasBudgetRisk(): boolean {
    return this.extraPayments.some(
      (item) => this.normalizeMoney(item.amount) > this.paymentUsed * 3
    );
  }

  private isRecurringExtraPattern(extras: ExtraPayment[]): boolean {
    const months = [...new Set(extras.map((item) => Math.max(1, Math.round(item.month))))].sort(
      (a, b) => a - b
    );
    if (months.length < 3) {
      return false;
    }

    let links = 0;
    for (let index = 1; index < months.length; index += 1) {
      if (months[index] - months[index - 1] <= 1) {
        links += 1;
      }
    }

    return links >= Math.ceil((months.length - 1) * 0.6);
  }

  private suggestedExtraRatioForShare(interestSharePct: number): number {
    if (interestSharePct > 60) {
      return 0.24;
    }
    if (interestSharePct >= 30) {
      return 0.12;
    }
    return 0.04;
  }

  private classifyExtraTier(extraPctOfPayment: number): CoachExtraTier {
    if (extraPctOfPayment < 5) {
      return 'small';
    }
    if (extraPctOfPayment <= 20) {
      return 'meaningful';
    }
    return 'aggressive';
  }

  private getInterestPhase(interestSharePct: number): InterestPhase {
    if (interestSharePct > 60) {
      return 'interestHeavy';
    }
    if (interestSharePct >= 30) {
      return 'balanced';
    }
    return 'principalHeavy';
  }

  private parseIsoDate(value: string): Date {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }

    return parsed;
  }

  private addMonths(date: Date, months: number): Date {
    const next = new Date(date.getTime());
    const originalDay = next.getDate();

    next.setDate(1);
    next.setMonth(next.getMonth() + months);

    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(originalDay, lastDay));

    return next;
  }

  private formatDateAsIso(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeMoney(value: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private restoreFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Partial<PersistedAppState>;

      if (typeof parsed.language === 'string' && this.isLanguage(parsed.language)) {
        this.language = parsed.language;
      }

      if (typeof parsed.loanAmount === 'number') {
        this.loanAmount = this.normalizeMoney(parsed.loanAmount);
      }

      if (typeof parsed.annualInterestRate === 'number') {
        this.annualInterestRate = Math.max(0, parsed.annualInterestRate);
      }

      if (typeof parsed.loanTermMonths === 'number') {
        this.loanTermMonths = Math.max(1, Math.round(parsed.loanTermMonths));
      }

      if (typeof parsed.firstPaymentDate === 'string' && this.isIsoDate(parsed.firstPaymentDate)) {
        this.firstPaymentDate = parsed.firstPaymentDate;
      }

      if (typeof parsed.commissionMode === 'string' && this.isCommissionMode(parsed.commissionMode)) {
        this.commissionMode = parsed.commissionMode;
      }

      const legacyStrategy =
        typeof parsed.prepaymentStrategy === 'string' && this.isPrepaymentStrategy(parsed.prepaymentStrategy)
          ? parsed.prepaymentStrategy
          : 'reduceTime';

      if (typeof parsed.commissionRate === 'number') {
        this.commissionRate = Math.max(0, parsed.commissionRate);
      }

      if (typeof parsed.fixedCommission === 'number') {
        this.fixedCommission = Math.max(0, parsed.fixedCommission);
      }

      if (Array.isArray(parsed.extraPayments)) {
        const restored = parsed.extraPayments
          .map((item, index) => {
            const maybeId = Number(item?.id);
            const month = Math.max(1, Math.round(Number(item?.month)));
            const amount = this.normalizeMoney(Number(item?.amount));
            const strategy =
              typeof item?.strategy === 'string' && this.isPrepaymentStrategy(item.strategy)
                ? item.strategy
                : legacyStrategy;

            if (!Number.isFinite(month) || !Number.isFinite(amount)) {
              return null;
            }

            return {
              id: Number.isInteger(maybeId) && maybeId > 0 ? maybeId : index + 1,
              month,
              amount,
              strategy
            } satisfies ExtraPayment;
          })
          .filter((item): item is ExtraPayment => item !== null);

        this.extraPayments = restored;
      }

      this.nextExtraPaymentId = Math.max(1, ...this.extraPayments.map((item) => item.id)) + 1;
    } catch {
      // Ignore invalid persisted state and continue with defaults.
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const state: PersistedAppState = {
      language: this.language,
      loanAmount: this.loanAmount,
      annualInterestRate: this.annualInterestRate,
      loanTermMonths: this.loanTermMonths,
      firstPaymentDate: this.firstPaymentDate,
      commissionMode: this.commissionMode,
      commissionRate: this.commissionRate,
      fixedCommission: this.fixedCommission,
      extraPayments: this.extraPayments.map((item) => ({
        id: item.id,
        month: item.month,
        amount: item.amount,
        strategy: item.strategy
      }))
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // Ignore storage quota and privacy mode errors.
    }
  }

  private isCommissionMode(value: string): value is CommissionMode {
    return value === 'none' || value === 'interestRate' || value === 'balanceRate' || value === 'fixed';
  }

  private isPrepaymentStrategy(value: string): value is PrepaymentStrategy {
    return value === 'reduceTime' || value === 'reducePayment';
  }

  private isLanguage(value: string): value is AppLanguage {
    return value === 'en' || value === 'ka';
  }

  private isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private resetResults(): void {
    this.baselineRows = [];
    this.planRows = [];
    this.baselineSummary = null;
    this.planSummary = null;
    this.paymentUsed = 0;
    this.aiCoachSummary = null;
  }
}

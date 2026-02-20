/**
 * Popular stock symbols (US and major international on US exchanges).
 * Deduped. Finnhub supports these and many more — users can also type any symbol.
 */
const RAW = [
  // Mega tech & software
  "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "META", "NVDA", "TSLA", "AVGO", "ORCL",
  "ADBE", "CRM", "CSCO", "ACN", "AMD", "INTC", "QCOM", "TXN", "IBM", "NOW",
  "INTU", "AMAT", "MU", "LRCX", "ADI", "KLAC", "SNPS", "CDNS", "PANW", "CRWD",
  "FTNT", "DDOG", "NET", "SNOW", "MDB", "PLTR", "ZM", "DOCU", "SHOP", "SQ",
  "PYPL", "COIN", "HOOD", "RBLX", "U", "DKNG", "ABNB", "UBER", "LYFT", "ASTR",
  "RIVN", "LCID", "NIO", "XPEV", "LI", "FSR", "RIDE", "SOFI", "AFRM", "UPST",
  "TEAM", "WDAY", "OKTA", "ZS", "SPLK", "CFLT", "ESTC", "PATH", "IOT", "FSLY",
  "TWLO", "VEEV", "HUBS", "ZM", "DOCU", "BILL", "PAYC", "PAYX", "ADP", "FIS",
  "FISV", "GDDY", "AKAM", "VRSN", "ANSS", "CDNS", "SW", "FTNT", "CHKP", "CYBR",
  "GEN", "S", "TMUS", "VZ", "T", "LUMN", "LBRDK", "LBRDA", "DISH", "TDS",
  // Semis & hardware
  "ON", "NXPI", "MRVL", "MCHP", "MPWR", "SWKS", "QRVO", "RMBS", "SMCI", "WDC",
  "STX", "MU", "QRVO", "ARM", "GFS", "ASML", "AMAT", "LRCX", "KLAC", "ENTG",
  // Consumer & retail
  "WMT", "COST", "TGT", "HD", "LOW", "NKE", "SBUX", "MCD", "YUM", "DPZ",
  "PEP", "KO", "PG", "CL", "EL", "NEE", "PM", "MO", "CHTR", "CMCSA", "DIS",
  "NFLX", "WBD", "PARA", "F", "GM", "BBY", "DG", "DLTR", "ROST", "TJX",
  "LULU", "ETSY", "EBAY", "W", "DKS", "BOOT", "ANF", "AEO", "GPS", "VSCO",
  "ULTA", "SIG", "BURL", "WRBY", "FIVE", "BKE", "FL", "DDS", "JWN", "M",
  "CPRI", "TPR", "PVH", "LEVI", "CROX", "DECK", "UAA", "UA", "VFC", "HBI",
  "WBA", "RAD", "KR", "SYY", "USFD", "CTLT", "SMPL", "LANC", "SJM", "K",
  "GIS", "KHC", "CPB", "HRL", "MKC", "HSY", "MDLZ", "KMB", "CHD", "CLX",
  "CAG", "STZ", "BF.B", "TAP", "SAM", "FIZZ", "MNST", "KDP", "CELH", "FLO",
  // Healthcare & pharma & biotech
  "UNH", "JNJ", "PFE", "ABBV", "MRK", "LLY", "TMO", "ABT", "DHR", "BMY",
  "AMGN", "GILD", "VRTX", "REGN", "MRNA", "BNTX", "JAZZ", "BIIB", "ILMN", "DXCM",
  "ISRG", "SYK", "MDT", "BSX", "ZBH", "EW", "IDXX", "HCA", "CI", "HUM",
  "CVS", "ELV", "MCK", "CAH", "ZTS", "IQV", "LH", "DGX", "A", "WAT",
  "MTD", "TECH", "ALGN", "XRAY", "BAX", "BDX", "RMD", "HOLX", "PODD", "ALNY",
  "BMRN", "EXEL", "INCY", "NBIX", "SGEN", "SRPT", "BPMC", "NTRA", "EXAS",
  "TECH", "HZNP", "UTHR", "MOH", "CNC", "ELV", "HUM", "CNC", "MOH", "AGL",
  "RGNX", "CRSP", "EDIT", "BEAM", "NTLA", "VERV", "BLUE", "FOLD", "RARE",
  "SRPT", "BIIB", "SGEN", "LEGN", "RCKT", "KYMR", "PRTC", "RVMD",
  // Financials
  "BRK.B", "JPM", "BAC", "WFC", "GS", "MS", "C", "AXP", "V", "MA",
  "BLK", "SCHW", "SPGI", "CME", "ICE", "BX", "KKR", "APO", "AON", "MMC",
  "PGR", "TRV", "AIG", "MET", "PRU", "ALL", "AFL", "CB", "CINF", "WRB",
  "L", "AJG", "BRO", "ERIE", "CNA", "FNF", "GL", "RE", "RGA", "PFG",
  "TFC", "USB", "PNC", "COF", "FITB", "KEY", "CFG", "MTB", "HBAN", "RF",
  "ZION", "FHN", "CFR", "BOKF", "IBKR", "COIN", "HOOD", "SOFI", "NU", "PAGS",
  "ADYEN", "GPN", "FIS", "FISV", "GDDY", "SQ", "PYPL", "AFRM", "UPST",
  // Industrials & transport & aerospace
  "CAT", "DE", "HON", "UPS", "FDX", "LMT", "RTX", "BA", "GE", "GEV",
  "MMM", "UNP", "CSX", "NSC", "EMR", "ITW", "ETN", "PH", "ROK", "CARR",
  "OTIS", "JCI", "APD", "SHW", "ECL", "WM", "RSG", "PCAR", "CMI", "DOV",
  "NOC", "LDOS", "HII", "TXT", "LHX", "GD", "LDOS", "CW", "PWR", "GNRC",
  "TT", "IR", "CARR", "SWK", "FAST", "CTAS", "PAYX", "ADP", "EFX", "FLT",
  "CPRT", "JKHY", "BR", "R", "NDSN", "IEX", "GNRC", "AME", "TDG", "HWM",
  "DAL", "UAL", "LUV", "AAL", "JBLU", "ALK", "SAVE", "XPO", "CHRW", "JBHT",
  "EXPD", "KNX", "LSTR", "ODFL", "WERN", "ARCB", "RXO", "YELL",
  // Energy & oil & gas
  "XOM", "CVX", "COP", "EOG", "SLB", "MPC", "PSX", "VLO", "OXY", "PXD",
  "DVN", "HAL", "BKR", "KMI", "WMB", "OKE", "EPD", "ET", "APA", "FANG",
  "HES", "MRO", "OVV", "CTRA", "EQT", "AR", "RRC", "SWN", "CHRD", "MGY",
  "SM", "HP", "NOV", "CHX", "PTEN", "RIG", "VAL", "HPK", "NBR", "PTEN",
  "SUN", "PBF", "DK", "PARR", "CLNE", "REGI", "ENPH", "FSLR", "RUN", "NOVA",
  "SEDG", "MAXN", "SPWR", "NEE", "AES", "CEG", "VST", "NRG", "XEL", "WEC",
  "ES", "AWK", "DTE", "ED", "SO", "DUK", "D", "AEE", "EVRG", "PEG", "EIX",
  // Materials & chemicals & mining
  "LIN", "FCX", "NEM", "NUE", "STLD", "VMC", "MLM", "DD", "DOW", "PPG",
  "CE", "ALB", "LTHM", "LAC", "MP", "SQM", "FMC", "MOS", "CF", "NTR",
  "SCCO", "TECK", "RIO", "BHP", "VALE", "GLNCY", "LAC", "LTHM", "ALB", "LITM",
  "LYB", "WLK", "EMN", "CE", "HUN", "OLN", "AXTA", "IFF", "CC", "AVNT",
  // Real estate (REITs)
  "PLD", "AMT", "EQIX", "CCI", "PSA", "O", "WELL", "SPG", "DLR", "VICI",
  "AVB", "EQR", "MAA", "UDR", "ESS", "INVH", "AMH", "SUI", "CPT", "KIM",
  "REG", "FRT", "NNN", "ADC", "NHI", "OHI", "SBRA", "DOC", "HR", "PEAK",
  "ARE", "BXP", "SLG", "VNO", "KIM", "HIW", "HR", "IRM", "CUBE", "EXR",
  "LSI", "NSA", "STOR", "REXR", "STAG", "FR", "LAMR", "OUT", "SBAC",
  // ETFs (popular)
  "SPY", "QQQ", "IWM", "DIA", "VOO", "VTI", "VEA", "VWO", "BND", "AGG",
  "GLD", "SLV", "USO", "XLF", "XLK", "XLE", "XLV", "XLI", "XLP", "XLY",
  "XLU", "XLRE", "XLB", "ARKK", "SOXL", "TQQQ", "SQQQ", "SPXL", "UPRO",
  // International (US-listed)
  "ASML", "SAP", "NVO", "AZN", "GSK", "SAN", "BCS", "BABA", "JD", "PDD",
  "BIDU", "TCEHY", "HMC", "TM", "SONY", "NTES", "CPNG", "GRAB", "SE", "MELI",
  "VALE", "PBR", "YPF", "TOT", "BP", "SHEL", "RY", "TD", "BNS", "BMO", "CM",
  "NVO", "NCPNG", "ASML", "STM", "PHG", "SIEGY", "MBLY", "ORSTED", "VWS",
  "LVMUY", "MC", "PDRDY", "DEO", "BTI", "IMBBY", "NTT", "TCEHY", "CPNG",
  "GRAB", "SE", "MELI", "MELI", "BBD", "ITUB", "VIV", "PBR", "GGB", "SID",
  "GFI", "AUY", "NG", "GOLD", "FNV", "AG", "NEM", "KGC", "AEM", "CDE",
];

export const SUGGESTED_STOCKS: readonly string[] = Array.from(new Set(RAW));

/** First N symbols shown as quick-add chips (rest in "Browse all"). */
export const QUICK_ADD_COUNT = 14;

 // Standalone local mock-data version
    /********************************************
     * WIKIPEDIA LIGHTBOX LOGIC
     ********************************************/
    const wikiLinks = {
      "Sanusi Lamido":        "https://en.wikipedia.org/wiki/Sanusi_Lamido_Sanusi",
      "Goodluck Jonathan":  "https://en.wikipedia.org/wiki/Goodluck_Jonathan",
      "Aminu Tambuwal":     "https://en.wikipedia.org/wiki/Aminu_Tambuwal",
      "Rotimi Amaechi":     "https://en.wikipedia.org/wiki/Rotimi_Amaechi",
      "Bukola Saraki":      "https://en.wikipedia.org/wiki/Bukola_Saraki",
      "Godswill Akpabio":   "https://en.wikipedia.org/wiki/Godswill_Akpabio",
      "Nyesom Wike":        "https://en.wikipedia.org/wiki/Nyesom_Wike",
      "Yemi Osinbajo":      "https://en.wikipedia.org/wiki/Yemi_Osinbajo",
      "Yakubu Dogara":      "https://en.wikipedia.org/wiki/Yakubu_Dogara",
      "Atiku Abubakar":     "https://en.wikipedia.org/wiki/Atiku_Abubakar",
      "Rabiu Kwankwaso":    "https://en.wikipedia.org/wiki/Rabiu_Kwankwaso",
      "Peter Obi":          "https://en.wikipedia.org/wiki/Peter_Obi",
      "Nasir El-Rufai":     "https://en.wikipedia.org/wiki/Nasir_El-Rufai",
      "Kashim Shettima":    "https://en.wikipedia.org/wiki/Kashim_Shettima",
      "Bola Tinubu":        "https://en.wikipedia.org/wiki/Bola_Tinubu"
    };
    const wikiLightbox = document.getElementById('wikiLightbox');
    const wikiIframe   = document.getElementById('wikiIframe');
    const wikiCloseBtn = document.getElementById('wikiLightboxClose');
    let wikiTimer = null;
    function showWikiLightbox(candidateName) {
      let link = wikiLinks[candidateName] || "about:blank";
      wikiIframe.src = link;
      wikiLightbox.style.display = 'flex';
    }
    function closeWikiLightbox() {
      wikiLightbox.style.display = 'none';
      wikiIframe.src = "about:blank";
      if (wikiTimer) { clearTimeout(wikiTimer); wikiTimer = null; }
    }
    wikiLightbox.addEventListener("click", (event) => { if (event.target === wikiLightbox) { closeWikiLightbox(); } });
    wikiCloseBtn.addEventListener('click', closeWikiLightbox);
    /********************************************
     * GLOBALS, DATA STORAGE
     ********************************************/
    let candidates       = [];
    let candidateImages  = {};
    let candidateDetails = {};
    let candidateLikes   = {};
    let candidateRoleVotes = { president: {}, vicePresident: {} };
    let votesData        = {};
    let comboShares      = {};
    let comboComments    = {};
    let loyalists        = {};
    let mapStatesData    = [];
    let comboDefinitions = [];
    let selectedPresident= null;
    let selectedVP       = null;
    let currentCombo     = null;
    let userIP           = "123.45.67.89"; // Mock IP
    let socialProofIndex = 0;
    let socialProofTimer = null;
    let socialProofHideTimer = null;
    let voteTooltipTimer = null;
    let influencerSignupState = null;
    let influencerStatusPollTimer = null;
    let locationData = {};
    const NIGERIAN_STATES_URL = "https://gist.githubusercontent.com/chrisidakwo/4ba3a4f03afc442305021be4ca67738e/raw/a8276ee3a756ae47ee853c4be5a82a11d6c8a313/nigerian-states.json";
    const SUPABASE_URL = "https://eeynpndieynavvxdyqhp.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVleW5wbmRpZXluYXZ2eGR5cWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTA3NTksImV4cCI6MjA5MDg2Njc1OX0.-IHvceypEfRZoO3OfJtZtcHiMpDCbqKDFdwEAQB9NbU";
    const supabaseClient = window.supabase?.createClient
      ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;
    let socialProofMessages = [];
    let dataBackend = "mock";
    const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === '1';
    function debugLog(scope, message, details) {
      if (!DEBUG_MODE) return;
      const prefix = `[DEBUG:${scope}]`;
      if (details === undefined) {
        console.log(prefix, message);
      } else {
        console.log(prefix, message, details);
      }
    }
    function debugError(scope, message, error) {
      if (!DEBUG_MODE) return;
      console.error(`[DEBUG:${scope}]`, message, error);
    }
    async function registerServiceWorker() {
      if (!('serviceWorker' in navigator)) return;
      try {
        await navigator.serviceWorker.register('./sw.js?v=20260405-1', { scope: './' });
        debugLog("pwa", "Service worker registered.");
      } catch (error) {
        debugError("pwa", "Service worker registration failed.", error);
      }
    }
    async function fetchAllSupabaseRows(tableName, selectClause, options = {}) {
      if (!supabaseClient) return { data: [], error: new Error("Supabase client missing") };
      const pageSize = options.pageSize || 1000;
      const orderBy = options.orderBy || null;
      const ascending = options.ascending ?? true;
      let from = 0;
      let allRows = [];
      while (true) {
        let query = supabaseClient.from(tableName).select(selectClause).range(from, from + pageSize - 1);
        if (orderBy) {
          query = query.order(orderBy, { ascending });
        }
        const { data, error } = await query;
        if (error) {
          debugError("fetchAllSupabaseRows", `Failed fetching ${tableName} rows.`, error);
          return { data: allRows, error };
        }
        const pageRows = data || [];
        allRows = allRows.concat(pageRows);
        debugLog("fetchAllSupabaseRows", `Fetched page for ${tableName}.`, {
          from,
          pageSize,
          pageRows: pageRows.length,
          totalRows: allRows.length
        });
        if (pageRows.length < pageSize) break;
        from += pageSize;
      }
      return { data: allRows, error: null };
    }
    const MOCK_DATA = {
      candidates: [
        { name: "Bola Tinubu", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Bola_Tinubu_portrait.jpg/1200px-Bola_Tinubu_portrait.jpg", age: 70, zone: "SW", likes: 500000 },
        { name: "Kashim Shettima", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYTAojx7fgjFx49kdn8eEN4GfOrJtc8_ocuRxI0uTTCZ11Ug4W1NG67JsEs2acSXr77BucEZFTu5eS50YqGpYXA8TogvE-ft48gb8mOA&s=10", age: 65, zone: "NE", likes: 350000 },
        { name: "Nasir El-Rufai", imageUrl: "https://d1jcea4y7xhp7l.cloudfront.net/2018/10/Kaduna_state_Governor.jpg", age: 63, zone: "NW", likes: 290000 },
        { name: "Peter Obi", imageUrl: "https://todayafrica.co/wp-content/uploads/2024/04/Blue-Simple-Dad-Appreciation-Facebook-Post-1200-%C3%97-720-px-10-2.png", age: 60, zone: "SE", likes: 600000 },
        { name: "Rabiu Kwankwaso", imageUrl: "https://thetop10magazine.com.ng/wp-content/uploads/2022/09/Rabiu-Musa-Kwankwaso-NNPP.jpg", age: 66, zone: "NW", likes: 310000 },
        { name: "Atiku Abubakar", imageUrl: "https://miro.medium.com/v2/resize:fit:2400/0*AZFse8ApInmJg7xf.jpg", age: 76, zone: "NE", likes: 450000 },
        { name: "Yakubu Dogara", imageUrl: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjuBvZJoVkod1KbQdOKCSxKVqt9dk7zP6M26tKuy320OLGSuke9AuduxgF8j1G6f7OthrtlQr3MYW12RX8869PyIQQm8c_9EolExIJTu4y2q5JduhahRcnBA_6fCF0F5wDTlARpFAZuVz-L2_RBD-mVTnBcj01I-faMqKBx33v-H4cez3fPk0IdBrvF3uo/s600/Dogara.jpg", age: 55, zone: "NE", likes: 92000 },
        { name: "Yemi Osinbajo", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg8Lf5k-amv-09x0qKf60WXtzfSxibqI7JD9zw4bwxMkCKdMQZga3SwYfkb1KeFF3DqWZ2ugTc7pDI9Jyv3NBkMaTZUrgjgFPqU7aDJCk&s=10", age: 64, zone: "SW", likes: 250000 },
        { name: "Nyesom Wike", imageUrl: "https://dailypost.ng/wp-content/uploads/2024/01/wike.jpg", age: 54, zone: "SS", likes: 140000 },
        { name: "Godswill Akpabio", imageUrl: "https://www.citypost.ng/wp-content/uploads/2024/08/IMG-20240827-WA0043.jpg", age: 60, zone: "SS", likes: 115000 },
        { name: "Bukola Saraki", imageUrl: "https://leadership.ng/wp-content/uploads/2023/12/Bukola-Saraki-jpg.webp", age: 60, zone: "NC", likes: 290000 },
        { name: "Rotimi Amaechi", imageUrl: "https://cdn.vanguardngr.com/wp-content/uploads/2022/04/Rt-Hon.-Chibuike-Rotimi-Amaechi-Image-2022-04-28-at-7.05.36-PM.jpeg", age: 57, zone: "SS", likes: 110000 },
        { name: "Aminu Tambuwal", imageUrl: "https://csn-prod-profile-images.s3.amazonaws.com/kHNmjl177dtFve7iYeHvx", age: 56, zone: "NW", likes: 73000 },
        { name: "Goodluck Jonathan", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/42/Goodluck_Jonathan_World_Economic_Forum_2013.jpg", age: 65, zone: "SS", likes: 380000 },
        { name: "Sanusi Lamido", imageUrl: "https://www.itvradiong.com/wp-content/uploads/2024/05/image-208.webp", age: 47, zone: "NC", likes: 87000 }
      ],
      combos: [
        { president: "Bola Tinubu", vicePresident: "Kashim Shettima", totalVotes: 179000, commentCount: 3, shareCount: 4200 },
        { president: "Atiku Abubakar", vicePresident: "Rotimi Amaechi", totalVotes: 127600, commentCount: 2, shareCount: 2800 },
        { president: "Peter Obi", vicePresident: "Sanusi Lamido", totalVotes: 97400, commentCount: 2, shareCount: 2400 },
        { president: "Goodluck Jonathan", vicePresident: "Rabiu Kwankwaso", totalVotes: 87000, commentCount: 2, shareCount: 2100 },
        { president: "Peter Obi", vicePresident: "Rabiu Kwankwaso", totalVotes: 82800, commentCount: 2, shareCount: 2000 },
        { president: "Peter Obi", vicePresident: "Aminu Tambuwal", totalVotes: 74200, commentCount: 2, shareCount: 1800 },
        { president: "Rabiu Kwankwaso", vicePresident: "Peter Obi", totalVotes: 64900, commentCount: 2, shareCount: 1650 },
        { president: "Atiku Abubakar", vicePresident: "Goodluck Jonathan", totalVotes: 63300, commentCount: 1, shareCount: 1500 },
        { president: "Nyesom Wike", vicePresident: "Sanusi Lamido", totalVotes: 62800, commentCount: 1, shareCount: 1450 },
        { president: "Goodluck Jonathan", vicePresident: "Aminu Tambuwal", totalVotes: 61100, commentCount: 1, shareCount: 1370 },
        { president: "Rotimi Amaechi", vicePresident: "Bukola Saraki", totalVotes: 60900, commentCount: 1, shareCount: 1320 },
        { president: "Aminu Tambuwal", vicePresident: "Peter Obi", totalVotes: 59600, commentCount: 2, shareCount: 1260 },
        { president: "Aminu Tambuwal", vicePresident: "Nyesom Wike", totalVotes: 58100, commentCount: 1, shareCount: 1210 },
        { president: "Atiku Abubakar", vicePresident: "Peter Obi", totalVotes: 57800, commentCount: 1, shareCount: 1180 },
        { president: "Peter Obi", vicePresident: "Nasir El-Rufai", totalVotes: 57200, commentCount: 2, shareCount: 1160 },
        { president: "Yemi Osinbajo", vicePresident: "Sanusi Lamido", totalVotes: 56900, commentCount: 7, shareCount: 1110 },
        { president: "Peter Obi", vicePresident: "Bukola Saraki", totalVotes: 55200, commentCount: 1, shareCount: 980 },
        { president: "Sanusi Lamido", vicePresident: "Peter Obi", totalVotes: 53300, commentCount: 1, shareCount: 930 },
        { president: "Nyesom Wike", vicePresident: "Aminu Tambuwal", totalVotes: 53300, commentCount: 1, shareCount: 910 },
        { president: "Yemi Osinbajo", vicePresident: "Bukola Saraki", totalVotes: 49000, commentCount: 1, shareCount: 860 },
        { president: "Nasir El-Rufai", vicePresident: "Peter Obi", totalVotes: 48600, commentCount: 2, shareCount: 810 },
        { president: "Sanusi Lamido", vicePresident: "Yemi Osinbajo", totalVotes: 46900, commentCount: 1, shareCount: 760 },
        { president: "Peter Obi", vicePresident: "Kashim Shettima", totalVotes: 2, commentCount: 2, shareCount: 7 },
        { president: "Nasir El-Rufai", vicePresident: "Nyesom Wike", totalVotes: 1, commentCount: 1, shareCount: 4 },
        { president: "Peter Obi", vicePresident: "Bola Tinubu", totalVotes: 1, commentCount: 1, shareCount: 3 },
        { president: "Bukola Saraki", vicePresident: "Nyesom Wike", totalVotes: 1, commentCount: 0, shareCount: 2 }
      ],
      users: [],
      mapStates: [
        { state: "Lagos", tinubuKashim: 1200, peterObiYemiOsinbajo: 2600, atikuWike: 900 },
        { state: "Abia", peterObiYemiOsinbajo: 1800, atikuWike: 320, goodluckElRufai: 200 },
        { state: "Adamawa", atikuWike: 1400, rabiuAmaechi: 800, tinubuKashim: 500 },
        { state: "Kaduna", goodluckElRufai: 1500, tinubuKashim: 900, sanusiYemi: 400 },
        { state: "Rivers", atikuWike: 1700, peterObiYemiOsinbajo: 1200, rabiuAmaechi: 600 },
        { state: "Enugu", peterObiYemiOsinbajo: 1900, sanusiYemi: 450, goodluckElRufai: 220 },
        { state: "Ebonyi", peterObiYemiOsinbajo: 1300, atikuWike: 750, goodluckElRufai: 180 },
        { state: "Delta", tinubuKashim: 880, rabiuAmaechi: 540, atikuWike: 710 }
      ],
      loyalists: [
        { referralCode: "REF98123", loyalistName: "Segun", city: "Ikeja", combo: "Peter Obi & Yemi Osinbajo", supporters: 9300, totalInfluencers: 346, donation: 1500, comboImg1: "https://todayafrica.co/wp-content/uploads/2024/04/Blue-Simple-Dad-Appreciation-Facebook-Post-1200-%C3%97-720-px-10-2.png", comboImg2: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg8Lf5k-amv-09x0qKf60WXtzfSxibqI7JD9zw4bwxMkCKdMQZga3SwYfkb1KeFF3DqWZ2ugTc7pDI9Jyv3NBkMaTZUrgjgFPqU7aDJCk&s=10" },
        { referralCode: "REF98124", loyalistName: "Felicia", city: "Lekki", combo: "Peter Obi & Yemi Osinbajo", supporters: 15000, totalInfluencers: 346, donation: 2200, comboImg1: "https://todayafrica.co/wp-content/uploads/2024/04/Blue-Simple-Dad-Appreciation-Facebook-Post-1200-%C3%97-720-px-10-2.png", comboImg2: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg8Lf5k-amv-09x0qKf60WXtzfSxibqI7JD9zw4bwxMkCKdMQZga3SwYfkb1KeFF3DqWZ2ugTc7pDI9Jyv3NBkMaTZUrgjgFPqU7aDJCk&s=10" },
        { referralCode: "REF98125", loyalistName: "Nkem", city: "Enugu", combo: "Peter Obi & Yemi Osinbajo", supporters: 10800, totalInfluencers: 346, donation: 1750, comboImg1: "https://todayafrica.co/wp-content/uploads/2024/04/Blue-Simple-Dad-Appreciation-Facebook-Post-1200-%C3%97-720-px-10-2.png", comboImg2: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg8Lf5k-amv-09x0qKf60WXtzfSxibqI7JD9zw4bwxMkCKdMQZga3SwYfkb1KeFF3DqWZ2ugTc7pDI9Jyv3NBkMaTZUrgjgFPqU7aDJCk&s=10" },
        { referralCode: "REF82776", loyalistName: "Musa", city: "Kaduna", combo: "Bola Tinubu & Kashim Shettima", supporters: 22000, totalInfluencers: 291, donation: 2500.5, comboImg1: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Bola_Tinubu_portrait.jpg/1200px-Bola_Tinubu_portrait.jpg", comboImg2: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYTAojx7fgjFx49kdn8eEN4GfOrJtc8_ocuRxI0uTTCZ11Ug4W1NG67JsEs2acSXr77BucEZFTu5eS50YqGpYXA8TogvE-ft48gb8mOA&s=10" },
        { referralCode: "REF82777", loyalistName: "Tolu", city: "Abuja", combo: "Bola Tinubu & Kashim Shettima", supporters: 12400, totalInfluencers: 291, donation: 1800, comboImg1: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Bola_Tinubu_portrait.jpg/1200px-Bola_Tinubu_portrait.jpg", comboImg2: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYTAojx7fgjFx49kdn8eEN4GfOrJtc8_ocuRxI0uTTCZ11Ug4W1NG67JsEs2acSXr77BucEZFTu5eS50YqGpYXA8TogvE-ft48gb8mOA&s=10" },
        { referralCode: "REF82778", loyalistName: "Zainab", city: "Kano", combo: "Bola Tinubu & Kashim Shettima", supporters: 9400, totalInfluencers: 291, donation: 1350, comboImg1: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Bola_Tinubu_portrait.jpg/1200px-Bola_Tinubu_portrait.jpg", comboImg2: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYTAojx7fgjFx49kdn8eEN4GfOrJtc8_ocuRxI0uTTCZ11Ug4W1NG67JsEs2acSXr77BucEZFTu5eS50YqGpYXA8TogvE-ft48gb8mOA&s=10" },
        { referralCode: "REF34921", loyalistName: "Salihu", city: "Kano", combo: "Rabiu Kwankwaso & Rotimi Amaechi", supporters: 15000, totalInfluencers: 184, donation: 2000, comboImg1: "https://thetop10magazine.com.ng/wp-content/uploads/2022/09/Rabiu-Musa-Kwankwaso-NNPP.jpg", comboImg2: "https://cdn.vanguardngr.com/wp-content/uploads/2022/04/Rt-Hon.-Chibuike-Rotimi-Amaechi-Image-2022-04-28-at-7.05.36-PM.jpeg" },
        { referralCode: "REF76218", loyalistName: "Princess", city: "Port Harcourt", combo: "Goodluck Jonathan & Nasir El-Rufai", supporters: 8100, totalInfluencers: 128, donation: 500, comboImg1: "https://upload.wikimedia.org/wikipedia/commons/4/42/Goodluck_Jonathan_World_Economic_Forum_2013.jpg", comboImg2: "https://d1jcea4y7xhp7l.cloudfront.net/2018/10/Kaduna_state_Governor.jpg" }
      ],
      socialProofs: [
        "Musa voted for Nyesom Wike & Aminu Tambuwal.",
        "Felicia just became an influencer for Peter Obi & Yemi Osinbajo.",
        "Nkem from Enugu just voted.",
        "Musa just influenced 2K people.",
        "Zainab may become a minister after influencing 10K voters.",
        "Segun from Ikeja just shared his referral code.",
        "Princess from Port Harcourt just climbed the influencer leaderboard.",
        "Salihu just brought in another block of voters.",
        "Felicia shared a direct combo link for Peter Obi & Yemi Osinbajo.",
        "Nkem from Enugu is gaining momentum as an influencer."
      ]
    };
    // DOM References
    const presidentListEl     = document.getElementById('presidentList');
    const vicePresidentListEl = document.getElementById('vicePresidentList');
    const voteBtn             = document.getElementById('voteBtn');
    const buttonFillEl        = document.getElementById('buttonFill');
    const chartBarsEl         = document.getElementById('chartBars');
    const loyalistCombosEl    = document.getElementById('loyalistCombosContainer');
    const loyalistMetaEl      = document.getElementById('loyalistMeta');
    const loyalistModalEl     = document.getElementById('loyalistModal');
    const loyalistModalClose  = document.getElementById('loyalistModalClose');
    const loyalistModalTitle  = document.getElementById('loyalistModalTitle');
    const loyalistModalMeta   = document.getElementById('loyalistModalMeta');
    const loyalistModalList   = document.getElementById('loyalistModalList');
    const loyalistModalImage1 = document.getElementById('loyalistModalImage1');
    const loyalistModalImage2 = document.getElementById('loyalistModalImage2');
    const comboGridEl         = document.getElementById('comboGrid');
    const voterNameEl         = document.getElementById('voterName');
    const voterPhoneEl        = document.getElementById('voterPhone');
    const voterStateEl        = document.getElementById('voterState');
    const voterCityEl         = document.getElementById('voterCity');
    const voterGenderEl       = document.getElementById('voterGender');
    const voterAgeEl          = document.getElementById('voterAge');
    const voterReferralEl     = document.getElementById('voterReferral');
    const voteActionEl        = document.getElementById('voteAction');
    const voteTooltipEl       = document.getElementById('voteTooltip');
    const socialProofToastEl  = document.getElementById('socialProofToast');
    const socialProofMessageEl = document.getElementById('socialProofMessage');
    const pollBackendBaseMeta = document.querySelector('meta[name="poll-backend-base"]');
    const noticeModalEl       = document.getElementById('noticeModal');
    const noticeModalClose    = document.getElementById('noticeModalClose');
    const noticeModalKicker   = document.getElementById('noticeModalKicker');
    const noticeModalTitle    = document.getElementById('noticeModalTitle');
    const noticeModalMessage  = document.getElementById('noticeModalMessage');
    const noticeModalBtn      = document.getElementById('noticeModalBtn');
    const referralPromptModal = document.getElementById('referralPromptModal');
    const referralPromptClose = document.getElementById('referralPromptClose');
    const referralPromptInput = document.getElementById('referralPromptInput');
    const referralPromptContinue = document.getElementById('referralPromptContinue');
    const referralPromptSkip  = document.getElementById('referralPromptSkip');
    // const autoGenCodeEl       = document.getElementById('autoGenCode'); // Removed
    const comboCommentSection = document.getElementById('commentsSection'); // Corrected ID used
    const comboCommentClose   = document.getElementById('comboCommentClose');
    const comboCommentTitle   = document.getElementById('comboCommentTitle');
    const comboCommentName    = document.getElementById('comboCommentName');
    const comboCommentText    = document.getElementById('comboCommentText');
    const comboCommentPostBtn = document.getElementById('comboCommentPostBtn');
    const comboCommentListEl  = document.getElementById('comboCommentList');
    const comboModalComboName = document.getElementById('comboModalComboName');
    const comboModalImage1    = document.getElementById('comboModalImage1');
    const comboModalImage2    = document.getElementById('comboModalImage2');
    const comboModalVotes     = document.getElementById('comboModalVotes');
    const comboModalComments  = document.getElementById('comboModalComments');
    const contactUsBtn        = document.getElementById('contactUsBtn');
    const lightboxOverlay     = document.getElementById('lightboxOverlay');
    const lightboxClose       = document.getElementById('lightboxClose');
    const lightboxForm        = document.getElementById('lightboxForm');
    const contactFullNameEl   = document.getElementById('contactFullName');
    const contactPhoneEl      = document.getElementById('contactPhone');
    const contactEmailEl      = document.getElementById('contactEmail');
    const contactMessageEl    = document.getElementById('contactMessage');
    const lightboxSubmitMsg   = document.getElementById('lightboxSubmitMsg');
    const mobileMenuBtn       = document.getElementById('mobileMenuBtn');
    const mobileNavPanel      = document.getElementById('mobileNavPanel');
    const mobileNavCloseBtn   = mobileNavPanel.querySelector('.menu-close-btn');
    const mobileNavLinks      = mobileNavPanel.querySelectorAll('nav a');
    const getReferralCodeBtn  = document.getElementById('getReferralCodeBtn'); // New button
    const referralLightbox    = document.getElementById('referralLightbox'); // New lightbox
    const referralLightboxClose = document.getElementById('referralLightboxClose'); // New close button
    const referralRequestForm = document.getElementById('referralRequestForm'); // New form
    const referralNameEl      = document.getElementById('referralName'); // New input
    const referralContactEl   = document.getElementById('referralContact'); // New input
    const referralStateEl     = document.getElementById('referralState');
    const referralCityEl      = document.getElementById('referralCity');
    const referralRequestSubmitBtn = document.getElementById('referralRequestSubmitBtn');
    const referralSubmitMsg   = document.getElementById('referralSubmitMsg'); // New message div
    const receiptLightbox = document.getElementById('receiptLightbox');
    const receiptLightboxClose = document.getElementById('receiptLightboxClose');
    const influencerSelectedComboEl = document.getElementById('influencerSelectedCombo');
    const influencerStatusCardEl = document.getElementById('influencerStatusCard');
    const influencerStatusComboEl = document.getElementById('influencerStatusCombo');
    const influencerExpectedAmountEl = document.getElementById('influencerExpectedAmount');
    const influencerAccountNameEl = document.getElementById('influencerAccountName');
    const influencerAccountNumberEl = document.getElementById('influencerAccountNumber');
    const influencerPaymentStatusEl = document.getElementById('influencerPaymentStatus');
    const influencerRefreshBtn = document.getElementById('influencerRefreshBtn');
    const influencerCopyAccountBtn = document.getElementById('influencerCopyAccountBtn');
    const influencerActivationCardEl = document.getElementById('influencerActivationCard');
    const influencerReceiptIdEl = document.getElementById('influencerReceiptId');
    const influencerReceiptComboEl = document.getElementById('influencerReceiptCombo');
    const influencerReceiptAmountEl = document.getElementById('influencerReceiptAmount');
    const influencerReceiptPaidAtEl = document.getElementById('influencerReceiptPaidAt');
    const influencerReferralCodeEl = document.getElementById('influencerReferralCode');
    const influencerShareLinkEl = document.getElementById('influencerShareLink');
    const influencerReceiptQrEl = document.getElementById('influencerReceiptQr');
    const influencerCopyCodeBtn = document.getElementById('influencerCopyCodeBtn');
    const influencerShareBtn = document.getElementById('influencerShareBtn');
    const influencerDownloadReceiptBtn = document.getElementById('influencerDownloadReceiptBtn');
    const MOBILIZER_BUTTON_TEXT = "Proceed to get your Code/Link";
    // amCharts Globals
    let mapChart;
    let polygonSeries;
    let pieRoot;
    let pieChart;
    /********************************************
     * COUNTDOWN TIMER
     ********************************************/
    const countdownEl = document.getElementById('countdownTimer');
    const endMs = Date.now() + (3 * 24 * 60 * 60 + 2 * 60 * 60 + 3 * 60 + 45) * 1000;
    let countdownPulseInterval = null;
    let countdownHideTimer = null;
    function showCountdownToast() {
      if (!countdownEl) return;
      countdownEl.classList.add('visible');
      if (countdownHideTimer) clearTimeout(countdownHideTimer);
      countdownHideTimer = setTimeout(() => {
        countdownEl.classList.remove('visible');
      }, 3600);
    }
    function updateCountdown() {
      const current = Date.now();
      const diff = endMs - current;
      if (diff <= 0) {
        countdownEl.textContent = "Poll Ended!";
        clearInterval(countdownInterval);
        if (countdownPulseInterval) clearInterval(countdownPulseInterval);
        countdownEl.classList.add('visible');
        return;
      }
      let s = Math.floor(diff / 1000);
      let d = Math.floor(s / 86400); s %= 86400;
      let h = Math.floor(s / 3600); s %= 3600;
      let m = Math.floor(s / 60); s %= 60;
      countdownEl.textContent = `Poll Ends: ${d}d ${h}h ${m}m ${s}s`;
    }
    const countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
    showCountdownToast();
    countdownPulseInterval = setInterval(showCountdownToast, 9000);
    /********************************************
     * INPUT VALIDATION & EVENT LISTENERS
     ********************************************/
    voterPhoneEl.addEventListener('input', () => {
      voterPhoneEl.value = voterPhoneEl.value.replace(/\D/g, '').slice(0, 11);
      updateProgress();
    });
    voterAgeEl.addEventListener('input', () => {
      voterAgeEl.value = voterAgeEl.value.replace(/\D/g, '');
      updateProgress();
    });
     contactPhoneEl.addEventListener('input', () => {
      contactPhoneEl.value = contactPhoneEl.value.replace(/\D/g, '').slice(0,11);
    });
    if (referralContactEl) {
      referralContactEl.addEventListener('input', () => {
        referralContactEl.value = referralContactEl.value.replace(/\D/g, '').slice(0, 11);
      });
    }
    voterNameEl.addEventListener('input', updateProgress);
    voterStateEl.addEventListener('change', () => {
      populateCityOptions(voterStateEl.value);
      updateProgress();
    });
    voterCityEl.addEventListener('change', updateProgress);
    if (referralStateEl) {
      referralStateEl.addEventListener('change', () => {
        populateInfluencerCityOptions(referralStateEl.value);
      });
    }
    voterGenderEl.addEventListener('change', updateProgress);
    if (presidentListEl) presidentListEl.addEventListener('click', updateProgress);
    if (vicePresidentListEl) vicePresidentListEl.addEventListener('click', updateProgress);
    if (contactUsBtn) {
        contactUsBtn.addEventListener('click', () => {
          if (lightboxOverlay) lightboxOverlay.style.display = 'flex';
        });
    }
     if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            if (lightboxOverlay) lightboxOverlay.style.display = 'none';
        });
    }
    if (lightboxOverlay) {
        lightboxOverlay.addEventListener('click', (e) => {
            if (e.target === lightboxOverlay) {
                lightboxOverlay.style.display = 'none';
            }
        });
    }
    if (lightboxForm) {
        lightboxForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          let fn = contactFullNameEl.value.trim();
          let ph = contactPhoneEl.value.trim();
          let em = contactEmailEl.value.trim();
          if (!fn || ph.length !== 11 || !ph.startsWith('0') || !em.includes('@') || !em.includes('.')) {
            openNoticeModal({
              title: "Contact Form Error",
              message: "Please fill out all contact form fields correctly.",
              kicker: "Validation"
            });
            return;
          }
          try {
            await persistContactRequest();
          } catch (error) {
            console.error("Contact request error:", error);
            openNoticeModal({
              title: "Contact Form Error",
              message: "Unable to submit your request right now. Please try again.",
              kicker: "Network"
            });
            return;
          }
          if (lightboxSubmitMsg) lightboxSubmitMsg.style.display = 'block';
          lightboxForm.style.display = 'none';
          // Simulate submission
          setTimeout(() => {
            if (lightboxOverlay) lightboxOverlay.style.display = 'none';
            if (lightboxSubmitMsg) lightboxSubmitMsg.style.display = 'none';
            lightboxForm.style.display = 'flex';
            contactFullNameEl.value = '';
            contactPhoneEl.value = '';
            contactEmailEl.value = '';
            contactMessageEl.value = '';
          }, 2500);
        });
    }
    // --- Mobile Menu Listeners ---
    if (mobileMenuBtn && mobileNavPanel) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNavPanel.classList.add('active');
        });
    }
    if (mobileNavCloseBtn && mobileNavPanel) {
         mobileNavCloseBtn.addEventListener('click', () => {
            mobileNavPanel.classList.remove('active');
        });
    }
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor jump
            const targetId = link.getAttribute('href'); // Get '#sectionId'
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if (mobileNavPanel) {
                mobileNavPanel.classList.remove('active'); // Close menu after clicking link
            }
        });
    });
    // --- Referral Request Lightbox Listeners ---
    if (getReferralCodeBtn && referralLightbox) {
        getReferralCodeBtn.addEventListener('click', () => {
            const selectedCombo = getSelectedComboKey();
            if (!selectedCombo) {
              openNoticeModal({
                title: "Choose a Combo First",
                message: "Select both a president and a vice president before requesting your influencer account.",
                kicker: "Influencer"
              });
              return;
            }
            openReferralLightbox(selectedCombo);
        });
    }
    if (referralLightboxClose && referralLightbox) {
        referralLightboxClose.addEventListener('click', () => {
            closeReferralLightbox();
        });
    }
    if (receiptLightboxClose && receiptLightbox) {
        receiptLightboxClose.addEventListener('click', () => {
            closeReceiptLightbox();
        });
    }
     if (referralLightbox) {
        referralLightbox.addEventListener('click', (e) => {
            if (e.target === referralLightbox) { // Click on overlay background
                closeReferralLightbox();
            }
        });
    }
    if (receiptLightbox) {
        receiptLightbox.addEventListener('click', (e) => {
            if (e.target === receiptLightbox) {
                closeReceiptLightbox();
            }
        });
    }
    if (referralRequestForm) {
        referralRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectedCombo = getSelectedComboKey();
            const name = referralNameEl?.value.trim();
            const contact = referralContactEl?.value.trim();
            const state = referralStateEl?.value;
            const city = referralCityEl?.value;

            if (!selectedCombo) {
                openNoticeModal({
                  title: "Influencer Signup Error",
                  message: "Select a president and vice president combo first.",
                  kicker: "Validation"
                });
                return;
            }
            if (!name || !contact || !state || !city) {
                openNoticeModal({
                  title: "Influencer Signup Error",
                  message: "Please enter your full name, phone number, state, and city.",
                  kicker: "Validation"
                });
                return;
            }
            if (contact.length !== 11 || !contact.startsWith('0')) {
                openNoticeModal({
                  title: "Influencer Signup Error",
                  message: "Please enter a valid 11-digit Nigerian phone number.",
                  kicker: "Validation"
                });
                return;
            }

            try {
                await submitInfluencerSignup({
                  fullName: name,
                  phone: contact,
                  state,
                  city,
                  comboKey: selectedCombo
                });
            } catch (error) {
                console.error("Influencer signup error:", error);
                openNoticeModal({
                  title: "Influencer Signup Error",
                  message: error?.message || "Unable to create your influencer account right now. Please try again.",
                  kicker: "Network"
                });
            }
        });
    }
    if (influencerRefreshBtn) {
      influencerRefreshBtn.addEventListener('click', async () => {
        try {
          await refreshInfluencerStatus();
        } catch (error) {
          console.error('Influencer status refresh error:', error);
          openNoticeModal({
            title: "Status Check Failed",
            message: error?.message || "Unable to confirm payment right now.",
            kicker: "Network"
          });
        }
      });
    }
    if (influencerCopyAccountBtn) {
      influencerCopyAccountBtn.addEventListener('click', async () => {
        if (!influencerSignupState?.virtualAccountNumber) return;
        await copyTextToClipboard(influencerSignupState.virtualAccountNumber, {
          title: "Account Number Copied",
          message: "The account number has been copied.",
          kicker: "Influencer"
        });
      });
    }
    if (influencerCopyCodeBtn) {
      influencerCopyCodeBtn.addEventListener('click', async () => {
        if (!influencerSignupState?.referralCode) return;
        await copyTextToClipboard(influencerSignupState.referralCode, {
          title: "Referral Code Copied",
          message: "Your influencer referral code has been copied.",
          kicker: "Influencer"
        });
      });
    }
    if (influencerShareBtn) {
      influencerShareBtn.addEventListener('click', async () => {
        if (!influencerSignupState?.referralCode || !influencerSignupState?.comboKey) return;
        try {
          await shareVoteLink({
            comboKey: influencerSignupState.comboKey,
            referralCode: influencerSignupState.referralCode,
            sharerName: influencerSignupState.fullName || ""
          });
        } catch (error) {
          console.error('Influencer share error:', error);
          openNoticeModal({
            title: "Share Failed",
            message: "Unable to share your influencer link right now.",
            kicker: "Influencer"
          });
        }
      });
    }
    if (influencerDownloadReceiptBtn) {
      influencerDownloadReceiptBtn.addEventListener('click', async () => {
        await downloadInfluencerReceiptPng();
      });
    }
    /********************************************
     * HELPER FUNCTIONS
     ********************************************/
    function openNoticeModal({ title = "Update", message = "", kicker = "Notice" }) {
      if (!noticeModalEl || !noticeModalTitle || !noticeModalMessage || !noticeModalKicker) return;
      noticeModalKicker.textContent = kicker;
      noticeModalTitle.textContent = title;
      noticeModalMessage.textContent = message;
      noticeModalEl.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeNoticeModal() {
      if (!noticeModalEl) return;
      noticeModalEl.classList.remove('active');
      if (!comboCommentSection?.classList.contains('active') && !loyalistModalEl?.classList.contains('active') && !referralPromptModal?.classList.contains('active')) {
        document.body.style.overflow = '';
      }
    }
    function openReferralPromptModal() {
      if (!referralPromptModal) return;
      if (referralPromptInput && voterReferralEl) {
        referralPromptInput.value = voterReferralEl.value.trim().toUpperCase();
      }
      referralPromptModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => referralPromptInput?.focus(), 30);
    }
    function closeReferralPromptModal() {
      if (!referralPromptModal) return;
      referralPromptModal.classList.remove('active');
      if (!comboCommentSection?.classList.contains('active') && !loyalistModalEl?.classList.contains('active') && !noticeModalEl?.classList.contains('active')) {
        document.body.style.overflow = '';
      }
    }
    function getSelectedComboKey() {
      if (!selectedPresident || !selectedVP || selectedPresident === selectedVP) return "";
      return `${selectedPresident} & ${selectedVP}`;
    }
    function getPollBackendBase() {
      const configuredBase = pollBackendBaseMeta?.content?.trim();
      const resolvedBase = configuredBase || window.location.origin;
      return resolvedBase.replace(/\/+$/, "");
    }
    function getPollApiUrl(path) {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return `${getPollBackendBase()}${normalizedPath}`;
    }
    function formatNaira(amount) {
      const numericAmount = Number(amount) || 0;
      try {
        return new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          maximumFractionDigits: 0
        }).format(numericAmount);
      } catch (error) {
        return `NGN ${numericAmount.toLocaleString()}`;
      }
    }
    function normalizePhoneValue(phone) {
      return (phone || "").replace(/\D/g, '').slice(0, 11);
    }
    function stopInfluencerStatusPolling() {
      if (influencerStatusPollTimer) {
        clearTimeout(influencerStatusPollTimer);
        influencerStatusPollTimer = null;
      }
    }
    function setInfluencerSubmissionState(isSubmitting, message = "Processing your influencer signup...") {
      if (referralRequestSubmitBtn) {
        referralRequestSubmitBtn.disabled = isSubmitting;
        referralRequestSubmitBtn.textContent = isSubmitting ? 'Processing...' : MOBILIZER_BUTTON_TEXT;
      }
      if (referralSubmitMsg) {
        referralSubmitMsg.textContent = message;
        referralSubmitMsg.style.display = isSubmitting ? 'block' : 'none';
      }
    }
    function resetInfluencerModal({ clearFields = false } = {}) {
      stopInfluencerStatusPolling();
      influencerSignupState = null;
      if (receiptLightbox) receiptLightbox.style.display = 'none';
      setInfluencerSubmissionState(false, "Processing your influencer signup...");
      if (referralRequestForm) referralRequestForm.style.display = 'flex';
      if (influencerStatusCardEl) influencerStatusCardEl.hidden = true;
      if (influencerActivationCardEl) influencerActivationCardEl.hidden = true;
      if (influencerStatusComboEl) influencerStatusComboEl.textContent = '-';
      if (influencerExpectedAmountEl) influencerExpectedAmountEl.textContent = '-';
      if (influencerAccountNameEl) influencerAccountNameEl.textContent = '-';
      if (influencerAccountNumberEl) influencerAccountNumberEl.textContent = '-';
      if (influencerPaymentStatusEl) influencerPaymentStatusEl.textContent = 'Waiting for payment confirmation...';
      if (influencerReceiptIdEl) influencerReceiptIdEl.textContent = '-';
      if (influencerReceiptComboEl) influencerReceiptComboEl.textContent = '-';
      if (influencerReceiptAmountEl) influencerReceiptAmountEl.textContent = '-';
      if (influencerReceiptPaidAtEl) influencerReceiptPaidAtEl.textContent = '-';
      if (influencerReferralCodeEl) influencerReferralCodeEl.textContent = '-';
      if (influencerShareLinkEl) influencerShareLinkEl.textContent = '-';
      if (clearFields) {
        if (referralNameEl) referralNameEl.value = '';
        if (referralContactEl) referralContactEl.value = '';
        if (referralStateEl) referralStateEl.selectedIndex = 0;
        resetInfluencerCityOptions("Select state first");
      }
    }
    function closeReferralLightbox() {
      if (!referralLightbox) return;
      referralLightbox.style.display = 'none';
      if (receiptLightbox?.style.display !== 'flex') {
        document.body.style.overflow = '';
      }
      resetInfluencerModal();
    }
    function openReceiptLightbox() {
      if (!receiptLightbox) return;
      receiptLightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
    function closeReceiptLightbox() {
      if (!receiptLightbox) return;
      receiptLightbox.style.display = 'none';
      if (referralLightbox?.style.display !== 'flex') {
        document.body.style.overflow = '';
      }
    }
    function renderInfluencerSelectedCombo(comboKey) {
      if (influencerSelectedComboEl) {
        influencerSelectedComboEl.textContent = `Selected combo: ${comboKey || 'None'}`;
      }
    }
    function buildInfluencerReceiptId(signup) {
      const signupIdTail = String(signup?.signupId || '').slice(-6).toUpperCase();
      const referralCode = String(signup?.referralCode || '').toUpperCase();
      return referralCode ? `RCT-${referralCode.slice(-6)}` : `RCT-${signupIdTail || 'POLL50'}`;
    }
    function formatReceiptTimestamp(value) {
      if (!value) return '-';
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
    }
    function renderInfluencerReceiptQr(signup) {
      if (!influencerReceiptQrEl || !window.QRious) return;
      const qrValue = signup?.shareLink || signup?.referralCode || signup?.comboKey || '2027 Nigeria Election Permutation Poll';
      const qr = new window.QRious({
        element: influencerReceiptQrEl,
        value: qrValue,
        size: 184,
        level: 'H',
        foreground: '#143825',
        background: '#ffffff'
      });
      influencerReceiptQrEl.width = qr.size;
      influencerReceiptQrEl.height = qr.size;
    }
    function describeInfluencerStatus(signup) {
      const paymentStatus = (signup?.paymentStatus || 'pending').toLowerCase();
      const activationStatus = (signup?.activationStatus || 'pending').toLowerCase();
      if (activationStatus === 'activated') {
        return 'Payment has been received';
      }
      if (paymentStatus === 'underpaid') {
        return `Payment received but still below ${formatNaira(signup?.expectedAmount)}.`;
      }
      if (paymentStatus === 'paid') {
        return 'Payment received. Activation is being finalized.';
      }
      return 'Waiting for payment confirmation...';
    }
    function renderInfluencerSignup(signup) {
      if (!signup) return;
      const wasActivated = (influencerSignupState?.activationStatus || '').toLowerCase() === 'activated';
      influencerSignupState = signup;
      renderInfluencerSelectedCombo(signup.comboKey || getSelectedComboKey());
      if (referralRequestForm) referralRequestForm.style.display = 'none';
      if (referralSubmitMsg) referralSubmitMsg.style.display = 'none';
      if (influencerStatusCardEl) influencerStatusCardEl.hidden = false;
      if (influencerStatusComboEl) influencerStatusComboEl.textContent = signup.comboKey || '-';
      if (influencerExpectedAmountEl) influencerExpectedAmountEl.textContent = formatNaira(signup.expectedAmount);
      if (influencerAccountNameEl) influencerAccountNameEl.textContent = signup.accountName || '-';
      if (influencerAccountNumberEl) influencerAccountNumberEl.textContent = signup.virtualAccountNumber || '-';
      if (influencerPaymentStatusEl) influencerPaymentStatusEl.textContent = describeInfluencerStatus(signup);
      const isActivated = (signup.activationStatus || '').toLowerCase() === 'activated';
      if (influencerActivationCardEl) influencerActivationCardEl.hidden = !isActivated;
      if (influencerReceiptIdEl) influencerReceiptIdEl.textContent = buildInfluencerReceiptId(signup);
      if (influencerReceiptComboEl) influencerReceiptComboEl.textContent = signup.comboKey || '-';
      if (influencerReceiptAmountEl) influencerReceiptAmountEl.textContent = formatNaira(signup.totalPaid || signup.expectedAmount || 0);
      if (influencerReceiptPaidAtEl) influencerReceiptPaidAtEl.textContent = formatReceiptTimestamp(signup.paidAt || signup.activatedAt);
      if (influencerReferralCodeEl) influencerReferralCodeEl.textContent = signup.referralCode || '-';
      if (influencerShareLinkEl) influencerShareLinkEl.textContent = signup.shareLink || '-';
      renderInfluencerReceiptQr(signup);
      if (influencerRefreshBtn) {
        influencerRefreshBtn.textContent = isActivated ? 'Refresh Status' : 'Check Payment';
      }
      if (!isActivated) {
        scheduleInfluencerStatusPoll();
      } else {
        stopInfluencerStatusPolling();
        if (!wasActivated) {
          if (referralLightbox) referralLightbox.style.display = 'none';
          openReceiptLightbox();
        }
      }
    }
    async function downloadInfluencerReceiptPng() {
      if (!influencerActivationCardEl) return;
      const fileSuffix = String(influencerSignupState?.referralCode || influencerSignupState?.signupId || 'receipt')
        .replace(/[^a-z0-9_-]/gi, '')
        .slice(-12) || 'receipt';
      try {
        if (window.html2canvas) {
          const canvas = await window.html2canvas(influencerActivationCardEl, {
            backgroundColor: '#f8fbf8',
            scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
            useCORS: true,
            logging: false
          });
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = `mobilizer-receipt-${fileSuffix}.png`;
          link.click();
          return;
        }
        throw new Error('Receipt renderer unavailable');
      } catch (error) {
        console.error('Receipt download failed:', error);
        openNoticeModal({
          title: 'Download Failed',
          message: 'Unable to download the receipt as PNG right now.',
          kicker: 'Receipt'
        });
      }
    }
    function openReferralLightbox(comboKey) {
      resetInfluencerModal();
      renderInfluencerSelectedCombo(comboKey);
      if (referralNameEl && voterNameEl?.value.trim()) referralNameEl.value = voterNameEl.value.trim();
      if (referralContactEl && voterPhoneEl?.value.trim()) referralContactEl.value = normalizePhoneValue(voterPhoneEl.value);
      if (referralStateEl && voterStateEl?.value) {
        referralStateEl.value = voterStateEl.value;
        populateInfluencerCityOptions(voterStateEl.value, voterCityEl?.value || "");
      } else {
        if (referralStateEl) referralStateEl.selectedIndex = 0;
        resetInfluencerCityOptions("Select state first");
      }
      referralLightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
    async function callPollApi(path, { method = 'GET', body = null, query = null } = {}) {
      const url = new URL(getPollApiUrl(path));
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
          }
        });
      }
      const requestInit = {
        method,
        headers: {
          'Accept': 'application/json'
        }
      };
      if (body) {
        requestInit.headers['Content-Type'] = 'application/json';
        requestInit.body = JSON.stringify(body);
      }
      const response = await fetch(url.toString(), requestInit);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        const baseMessage = payload?.message || `Request failed with status ${response.status}`;
        if (!pollBackendBaseMeta?.content?.trim() && window.location.hostname.endsWith('github.io')) {
          throw new Error(`${baseMessage} Configure meta[name="poll-backend-base"] with your Wix site URL.`);
        }
        throw new Error(baseMessage);
      }
      return payload;
    }
    async function submitInfluencerSignup({ fullName, phone, state, city, comboKey }) {
      setInfluencerSubmissionState(true, "Creating your influencer account number...");
      const response = await callPollApi('/_functions/apiPollInfluencerSignup', {
        method: 'POST',
        body: {
          fullName,
          phone: normalizePhoneValue(phone),
          state,
          city,
          comboKey
        }
      });
      renderInfluencerSignup(response.signup);
      setInfluencerSubmissionState(false, "Creating your influencer account number...");
      return response.signup;
    }
    async function refreshInfluencerStatus() {
      const signupId = influencerSignupState?.signupId;
      const phone = influencerSignupState?.phone || normalizePhoneValue(referralContactEl?.value);
      if (!signupId && !phone) {
        throw new Error('No influencer signup found yet.');
      }
      if (influencerPaymentStatusEl) {
        influencerPaymentStatusEl.textContent = 'Checking payment confirmation...';
      }
      const response = await callPollApi('/_functions/apiPollInfluencerStatus', {
        query: signupId ? { signupId } : { phone }
      });
      renderInfluencerSignup(response.signup);
      return response.signup;
    }
    function scheduleInfluencerStatusPoll() {
      stopInfluencerStatusPolling();
      influencerStatusPollTimer = setTimeout(async () => {
        try {
          await refreshInfluencerStatus();
        } catch (error) {
          debugError('influencer', 'Automatic influencer status poll failed.', error);
          scheduleInfluencerStatusPoll();
        }
      }, 7000);
    }
    async function copyTextToClipboard(text, noticeOptions) {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        if (noticeOptions) openNoticeModal(noticeOptions);
      } catch (error) {
        console.error('Clipboard copy failed:', error);
        openNoticeModal({
          title: "Copy Failed",
          message: "Unable to copy to your clipboard on this device.",
          kicker: "Clipboard"
        });
      }
    }
    function showSocialProofMessage(message) {
      if (!socialProofToastEl || !socialProofMessageEl || !message) return;
      if (socialProofHideTimer) {
        clearTimeout(socialProofHideTimer);
        socialProofHideTimer = null;
      }
      socialProofToastEl.classList.remove('visible');
      socialProofMessageEl.textContent = message;
      requestAnimationFrame(() => {
        socialProofToastEl.classList.add('visible');
      });
      socialProofHideTimer = setTimeout(() => {
        socialProofToastEl.classList.remove('visible');
      }, 3000);
    }
    function startSocialProofFeed() {
      const messages = socialProofMessages || [];
      if (!socialProofToastEl || !socialProofMessageEl || !messages.length) {
        if (socialProofToastEl) {
          socialProofToastEl.classList.remove('visible');
        }
        return;
      }
      socialProofIndex = 0;
      showSocialProofMessage(messages[0]);
      if (socialProofTimer) clearInterval(socialProofTimer);
      socialProofTimer = setInterval(() => {
        socialProofIndex = (socialProofIndex + 1) % messages.length;
        showSocialProofMessage(messages[socialProofIndex]);
      }, 4200);
    }
    function resetSelectOptions(selectEl, placeholder) {
      if (!selectEl) return;
      selectEl.innerHTML = "";
      const option = document.createElement("option");
      option.value = "";
      option.disabled = true;
      option.selected = true;
      option.textContent = placeholder;
      selectEl.appendChild(option);
    }
    function resetCityOptions(placeholder = "City *") {
      resetSelectOptions(voterCityEl, placeholder);
    }
    function resetInfluencerCityOptions(placeholder = "City *") {
      resetSelectOptions(referralCityEl, placeholder);
    }
    function populateSelectWithStates(selectEl, statesMap, placeholderText = "State *") {
      if (!selectEl) return;
      const selectedState = selectEl.value;
      const stateNames = Object.keys(statesMap || {}).sort((a, b) => a.localeCompare(b));
      selectEl.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.disabled = true;
      placeholder.selected = !selectedState;
      placeholder.textContent = placeholderText;
      selectEl.appendChild(placeholder);
      stateNames.forEach((stateName) => {
        const option = document.createElement("option");
        option.value = stateName;
        option.textContent = stateName;
        if (selectedState === stateName) option.selected = true;
        selectEl.appendChild(option);
      });
    }
    function populateStateOptions(statesMap) {
      populateSelectWithStates(voterStateEl, statesMap, "State *");
      populateSelectWithStates(referralStateEl, statesMap, "State *");
    }
    function populateSelectWithCities(selectEl, stateName, preferredCity = "", emptyPlaceholder = "Select state first") {
      if (!selectEl) return;
      const cities = Array.isArray(locationData[stateName]) ? locationData[stateName] : [];
      resetSelectOptions(selectEl, cities.length ? "City *" : emptyPlaceholder);
      if (!cities.length) return;
      const sortedCities = [...cities].sort((a, b) => a.localeCompare(b));
      let matchedPreferred = false;
      sortedCities.forEach((cityName) => {
        const option = document.createElement("option");
        option.value = cityName;
        option.textContent = cityName;
        if (preferredCity && preferredCity === cityName) {
          option.selected = true;
          matchedPreferred = true;
        }
        selectEl.appendChild(option);
      });
      if (!matchedPreferred) {
        selectEl.selectedIndex = 0;
      }
    }
    function populateCityOptions(stateName, preferredCity = "") {
      populateSelectWithCities(voterCityEl, stateName, preferredCity, "Select state first");
    }
    function populateInfluencerCityOptions(stateName, preferredCity = "") {
      populateSelectWithCities(referralCityEl, stateName, preferredCity, "Select state first");
    }
    async function loadLocationData() {
      try {
        const response = await fetch(NIGERIAN_STATES_URL);
        if (!response.ok) throw new Error(`Failed to load locations: ${response.status}`);
        const data = await response.json();
        if (!data || typeof data !== "object") throw new Error("Invalid location payload");
        locationData = data;
      } catch (error) {
        console.error("Unable to load Nigerian states JSON", error);
        locationData = {
          "Abia": ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala-Ngwa North", "Isiala-Ngwa South", "Isuikwato", "Obi Nwa", "Ohafia", "Osisioma", "Ngwa", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu-Neochi"],
          "Adamawa": ["Demsa", "Fufore", "Ganaye", "Gireri", "Gombi", "Guyuk", "Hong", "Jada", "Lamurde", "Madagali", "Maiha"],
          "Akwa Ibom": [],
          "Anambra": [],
          "Bauchi": [],
          "Bayelsa": [],
          "Benue": [],
          "Borno": [],
          "Cross River": [],
          "Delta": [],
          "Ebonyi": [],
          "Edo": [],
          "Ekiti": [],
          "Enugu": [],
          "Federal Capital Territory": [],
          "Gombe": [],
          "Imo": [],
          "Jigawa": [],
          "Kaduna": [],
          "Kano": [],
          "Katsina": [],
          "Kebbi": [],
          "Kogi": [],
          "Kwara": [],
          "Lagos": [],
          "Nasarawa": [],
          "Niger": [],
          "Ogun": [],
          "Ondo": [],
          "Osun": [],
          "Oyo": [],
          "Plateau": [],
          "Rivers": [],
          "Sokoto": [],
          "Taraba": [],
          "Yobe": [],
          "Zamfara": []
        };
      }
      populateStateOptions(locationData);
      resetCityOptions("Select state first");
      resetInfluencerCityOptions("Select state first");
    }
    function normalizeSupabaseComment(commentRow) {
      return {
        id: commentRow.id,
        comboKey: commentRow.combo_key,
        parentID: commentRow.parent_id || 0,
        name: commentRow.author_name || "Anonymous",
        text: commentRow.body || "",
        createdAt: commentRow.created_at || null,
        replies: []
      };
    }
    function hydrateComments(commentRows) {
      comboComments = {};
      const commentsById = {};
      const allComments = commentRows.map(normalizeSupabaseComment);
      allComments.forEach((comment) => {
        commentsById[comment.id] = comment;
      });
      allComments.forEach((comment) => {
        if (comment.parentID && commentsById[comment.parentID]) {
          commentsById[comment.parentID].replies.push(comment);
        }
      });
      allComments.forEach((comment) => {
        if (!comment.parentID || comment.parentID === 0) {
          if (!comboComments[comment.comboKey]) comboComments[comment.comboKey] = [];
          comboComments[comment.comboKey].push(comment);
        }
      });
    }
    function initializeEmptyDataStore() {
      candidates = [];
      candidateImages = {};
      candidateDetails = {};
      candidateLikes = {};
      candidateRoleVotes = { president: {}, vicePresident: {} };
      votesData = {};
      comboShares = {};
      comboComments = {};
      loyalists = {};
      mapStatesData = [];
      comboDefinitions = [];
      socialProofMessages = [];
      dataBackend = "supabase";
    }
    function groupCounts(rows, keyGetter) {
      return (rows || []).reduce((acc, row) => {
        const key = keyGetter(row);
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    }
    function normalizeStateName(stateName) {
      const normalized = (stateName || "").toString().trim().replace(/\s+/g, " ");
      if (!normalized) return "";
      const upper = normalized.toUpperCase();
      const aliases = {
        "ABUJA": "FCT Abuja",
        "ABUJA FCT": "FCT Abuja",
        "FCT": "FCT Abuja",
        "F.C.T": "FCT Abuja",
        "FCT ABUJA": "FCT Abuja",
        "FEDERAL CAPITAL TERRITORY": "FCT Abuja",
        "FEDERAL CAPITAL TERRITORY ABUJA": "FCT Abuja",
        "AKWA-IBOM": "Akwa Ibom",
        "CROSS-RIVER": "Cross River"
      };
      if (aliases[upper]) return aliases[upper];
      return normalized
        .toLowerCase()
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
    function buildStateVoteRows(voteRows) {
      const grouped = {};
      (voteRows || []).forEach((row) => {
        const state = normalizeStateName(row.state);
        const comboKey = row.combo_key;
        if (!state || !comboKey) return;
        const bucketKey = `${state}|||${comboKey}`;
        grouped[bucketKey] = (grouped[bucketKey] || 0) + 1;
      });
      return Object.entries(grouped).map(([key, count]) => {
        const [state, comboKey] = key.split("|||");
        return { state, combo_key: comboKey, votes: count };
      });
    }
    function resetCandidateRoleVotes() {
      candidateRoleVotes = { president: {}, vicePresident: {} };
    }
    function buildCandidateRoleVotes(comboRows, voteCounts) {
      resetCandidateRoleVotes();
      (comboRows || []).forEach((row) => {
        const comboKey = row.combo_key || `${row.president} & ${row.vice_president}`;
        const totalVotes = voteCounts[comboKey] || 0;
        if (row.president) {
          candidateRoleVotes.president[row.president] = (candidateRoleVotes.president[row.president] || 0) + totalVotes;
        }
        if (row.vice_president) {
          candidateRoleVotes.vicePresident[row.vice_president] = (candidateRoleVotes.vicePresident[row.vice_president] || 0) + totalVotes;
        }
      });
    }
    function getCandidateRoleVoteCount(candidateName, isPresidentList) {
      return isPresidentList
        ? (candidateRoleVotes.president[candidateName] || 0)
        : (candidateRoleVotes.vicePresident[candidateName] || 0);
    }
    function updateCandidateRoleVotesUI(candidateName, isPresidentList) {
      const selector = isPresidentList
        ? '.candidate-role-count[data-role="president"]'
        : '.candidate-role-count[data-role="vice-president"]';
      const count = getCandidateRoleVoteCount(candidateName, isPresidentList);
      const nodes = document.querySelectorAll(`.candidate-item[data-candidate-name="${candidateName}"] ${selector}`);
      nodes.forEach((node) => {
        node.textContent = `${formatNumber(count)} ${isPresidentList ? 'Pres votes' : 'VP votes'}`;
      });
    }
    async function loadSupabaseData() {
      if (!supabaseClient) {
        debugLog("loadSupabaseData", "Supabase client missing. Initializing empty store.");
        initializeEmptyDataStore();
        return;
      }
      debugLog("loadSupabaseData", "Starting Supabase fetches.");
      const [
        candidatesRes,
        combosRes,
        commentsRes,
        loyalistsRes,
        stateVotesRes,
        proofsRes
      ] = await Promise.all([
        supabaseClient.from("candidate_profiles").select("*").order("display_order", { ascending: true }),
        supabaseClient.from("combo_stats").select("*").order("display_order", { ascending: true }),
        fetchAllSupabaseRows("comments", "*", { orderBy: "created_at", ascending: true }),
        supabaseClient.from("loyalists").select("*").order("created_at", { ascending: true }),
        supabaseClient.from("state_combo_votes").select("state, combo_key, votes"),
        supabaseClient.from("social_proofs").select("*").order("display_order", { ascending: true })
      ]);
      debugLog("loadSupabaseData", "Query results received.", {
        candidateProfiles: { rows: candidatesRes.data?.length || 0, error: candidatesRes.error?.message || null },
        comboStats: { rows: combosRes.data?.length || 0, error: combosRes.error?.message || null },
        comments: { rows: commentsRes.data?.length || 0, error: commentsRes.error?.message || null },
        loyalists: { rows: loyalistsRes.data?.length || 0, error: loyalistsRes.error?.message || null },
        stateComboVotes: { rows: stateVotesRes.data?.length || 0, error: stateVotesRes.error?.message || null },
        socialProofs: { rows: proofsRes.data?.length || 0, error: proofsRes.error?.message || null }
      });
      const errors = [
        candidatesRes.error,
        combosRes.error,
        commentsRes.error,
        loyalistsRes.error,
        stateVotesRes.error,
        proofsRes.error
      ].filter(Boolean);
      if (candidatesRes.error || combosRes.error) {
        debugError("loadSupabaseData", "Critical load error.", [candidatesRes.error, combosRes.error].filter(Boolean));
        throw new Error([candidatesRes.error, combosRes.error].filter(Boolean).map((item) => item.message).join(" | "));
      }
      if (errors.length) {
        debugError("loadSupabaseData", "Non-fatal load issues.", errors.map((item) => item.message));
      }

      candidates = [];
      candidateImages = {};
      candidateDetails = {};
      candidateLikes = {};
      resetCandidateRoleVotes();
      votesData = {};
      comboShares = {};
      loyalists = {};
      comboDefinitions = [];
      comboComments = {};
      socialProofMessages = ((proofsRes.error ? [] : proofsRes.data) || []).map((row) => row.message).filter(Boolean);

      const stateVoteRows = stateVotesRes.error ? [] : (stateVotesRes.data || []);
      const voteCounts = Object.fromEntries(((combosRes.error ? [] : combosRes.data) || []).map((row) => [row.combo_key, row.total_votes || 0]));
      const comboInfluencerCounts = groupCounts(loyalistsRes.error ? [] : (loyalistsRes.data || []), (row) => row.combo_key);
      mapStatesData = stateVoteRows.map((row) => ({
        state: normalizeStateName(row.state),
        combo_key: row.combo_key,
        votes: row.votes || 0
      }));

      (candidatesRes.data || []).forEach((row) => {
        candidates.push(row.name);
        candidateImages[row.name] = row.image_url || 'https://placehold.co/80x80/cccccc/ffffff?text=N/A';
        candidateDetails[row.name] = { age: row.age ?? '?', zone: row.zone ?? '?' };
        candidateLikes[row.name] = row.likes || 0;
        if (row.wiki_url) {
          wikiLinks[row.name] = row.wiki_url;
        }
      });

      (combosRes.data || []).forEach((row) => {
        comboDefinitions.push(row.combo_key);
        votesData[row.combo_key] = row.total_votes || 0;
        comboShares[row.combo_key] = row.share_count || 0;
      });
      buildCandidateRoleVotes(combosRes.data || [], voteCounts);

      hydrateComments(commentsRes.error ? [] : (commentsRes.data || []));

      ((loyalistsRes.error ? [] : loyalistsRes.data) || []).forEach((row) => {
        const code = (row.referral_code || "").toUpperCase();
        loyalists[code] = {
          loyalistName: row.loyalist_name || "Anonymous",
          city: row.city || "",
          combo: row.combo_key || "",
          supporters: row.supporters || 0,
          totalInfluencers: comboInfluencerCounts[row.combo_key] || row.total_influencers || 0,
          donation: row.donation ?? 0,
          comboImg1: row.combo_img1 || 'https://placehold.co/50x50/cccccc/ffffff?text=N/A',
          comboImg2: row.combo_img2 || 'https://placehold.co/50x50/cccccc/ffffff?text=N/A'
        };
      });

      dataBackend = "supabase";
      debugLog("loadSupabaseData", "Hydrated client store.", {
        candidates: candidates.length,
        comboDefinitions: comboDefinitions.length,
        voteCombos: Object.keys(votesData).length,
        totalVotes: Object.values(votesData).reduce((sum, count) => sum + count, 0),
        mapRows: mapStatesData.length,
        loyalists: Object.keys(loyalists).length,
        socialProofMessages: socialProofMessages.length
      });
    }
    async function incrementCandidateLikeInStore(candidateName) {
      if (dataBackend !== "supabase" || !supabaseClient) return;
      debugLog("like", "Persisting candidate like.", { candidateName });
      const { error } = await supabaseClient
        .from("candidate_likes")
        .insert({ candidate_name: candidateName });
      if (error) {
        debugError("like", "Candidate like insert failed.", error);
        throw error;
      }
      debugLog("like", "Candidate like insert succeeded.", { candidateName });
    }
    async function persistShareCount(comboKey) {
      if (dataBackend !== "supabase" || !supabaseClient) return;
      debugLog("share", "Persisting combo share.", { comboKey });
      const { error } = await supabaseClient
        .from("combo_shares")
        .insert({ combo_key: comboKey });
      if (error) {
        debugError("share", "Combo share insert failed.", error);
        throw error;
      }
      debugLog("share", "Combo share insert succeeded.", { comboKey });
    }
    async function ensureComboExists(comboKey, presidentName, vicePresidentName) {
      if (dataBackend !== "supabase" || !supabaseClient) return;
      if (comboDefinitions.includes(comboKey)) {
        debugLog("combo", "Combo already known locally.", { comboKey });
        return;
      }
      debugLog("combo", "Ensuring combo exists in combo_stats.", {
        comboKey,
        president: presidentName,
        vicePresident: vicePresidentName
      });
      const { data: existingCombo, error: existingError } = await supabaseClient
        .from("combo_stats")
        .select("combo_key")
        .eq("combo_key", comboKey)
        .maybeSingle();
      if (existingError) {
        debugError("combo", "Failed checking existing combo.", existingError);
        throw existingError;
      }
      if (existingCombo?.combo_key) {
        comboDefinitions.push(comboKey);
        debugLog("combo", "Combo already exists in database.", { comboKey });
        return;
      }
      const nextDisplayOrder = comboDefinitions.length + 1;
      const { error: insertError } = await supabaseClient
        .from("combo_stats")
        .insert({
          combo_key: comboKey,
          president: presidentName,
          vice_president: vicePresidentName,
          total_votes: 0,
          share_count: 0,
          display_order: nextDisplayOrder
        });
      if (insertError) {
        debugError("combo", "Failed creating combo.", insertError);
        throw insertError;
      }
      comboDefinitions.push(comboKey);
      votesData[comboKey] = votesData[comboKey] || 0;
      comboShares[comboKey] = comboShares[comboKey] || 0;
      debugLog("combo", "Combo created successfully.", { comboKey, displayOrder: nextDisplayOrder });
    }
    async function persistVoteRecord(votePayload) {
      if (dataBackend !== "supabase" || !supabaseClient) return;
      const comboKey = votePayload.combo;
      debugLog("vote", "Persisting vote payload.", votePayload);
      const [presidentName, vicePresidentName] = comboKey.split(" & ");
      const { data, error } = await supabaseClient.rpc("submit_vote", {
        p_voter_name: votePayload.name,
        p_phone: votePayload.phone,
        p_state: normalizeStateName(votePayload.state),
        p_city: votePayload.city,
        p_gender: votePayload.gender,
        p_age: votePayload.age,
        p_president: presidentName,
        p_vice_president: vicePresidentName,
        p_referral_code_used: votePayload.referralCodeUsed || null
      });
      if (error) {
        debugError("vote", "Vote persistence failed.", error);
        throw error;
      }
      const insertedVote = data || null;
      debugLog("vote", "Vote persistence succeeded.", {
        comboKey,
        referralCodeUsed: votePayload.referralCodeUsed || null,
        insertedVote
      });
      const { data: verificationRows, error: verificationError } = await supabaseClient
        .from("votes")
        .select("id, combo_key, state, city, created_at")
        .eq("phone", votePayload.phone)
        .eq("combo_key", comboKey)
        .order("id", { ascending: false })
        .limit(3);
      if (verificationError) {
        debugError("vote", "Post-insert verification query failed.", verificationError);
      } else {
        debugLog("vote", "Post-insert verification rows.", verificationRows);
      }
      return insertedVote;
    }
    async function persistComment(commentPayload) {
      if (dataBackend !== "supabase" || !supabaseClient) return null;
      debugLog("comment", "Persisting comment.", commentPayload);
      const payload = {
        combo_key: commentPayload.comboKey,
        parent_id: commentPayload.parentID && commentPayload.parentID !== 0 ? commentPayload.parentID : null,
        author_name: commentPayload.name,
        body: commentPayload.text
      };
      const { data, error } = await supabaseClient
        .from("comments")
        .insert(payload)
        .select()
        .single();
      if (error) {
        debugError("comment", "Comment insert failed.", error);
        throw error;
      }
      debugLog("comment", "Comment insert succeeded.", data);
      return normalizeSupabaseComment(data);
    }
    async function persistContactRequest() {
      if (dataBackend !== "supabase" || !supabaseClient) return;
      const { error } = await supabaseClient.from("contact_requests").insert({
        full_name: contactFullNameEl.value.trim(),
        phone: contactPhoneEl.value.trim(),
        email: contactEmailEl.value.trim(),
        message: contactMessageEl.value.trim()
      });
      if (error) throw error;
    }
    async function refreshDataFromDatabase() {
      if (dataBackend !== "supabase" || !supabaseClient) return;
      debugLog("refresh", "Refreshing all UI state from database.");
      await loadSupabaseData();
      populateCandidateList(presidentListEl, candidates, true);
      populateCandidateList(vicePresidentListEl, candidates, false);
      if (selectedPresident) highlightSelected(presidentListEl, selectedPresident);
      if (selectedVP) highlightSelected(vicePresidentListEl, selectedVP);
      renderChart();
      renderComboGrid();
      renderComboLoyalists();
      renderMap();
      renderPieChart();
      if (currentCombo) {
        updateComboModalHeader(currentCombo);
        renderComboComments();
      }
      debugLog("refresh", "Refresh complete.", {
        totalVotes: Object.values(votesData).reduce((sum, count) => sum + count, 0),
        totalLikes: Object.values(candidateLikes).reduce((sum, count) => sum + count, 0),
        totalShares: Object.values(comboShares).reduce((sum, count) => sum + count, 0),
        loyalists: Object.keys(loyalists).length,
        mapRows: mapStatesData.length
      });
    }
    function getVoteValidationMessage() {
      if (!selectedPresident) return "Kindly select President to vote";
      if (!selectedVP) return "Kindly select Vice President to vote";
      if (selectedPresident === selectedVP) return "President and Vice President cannot be the same";
      if (!voterNameEl?.value.trim()) return "Kindly input your name to vote";
      if (!voterPhoneEl?.value.trim()) return "Kindly input your phone number to vote";
      if (voterPhoneEl.value.length !== 11 || !voterPhoneEl.value.startsWith('0')) return "Kindly input a valid phone number to vote";
      if (!voterStateEl?.value) return "Kindly select your state to vote";
      if (!voterCityEl?.value) return "Kindly select your city to vote";
      if (!voterGenderEl?.value) return "Kindly select your gender to vote";
      if (!voterAgeEl?.value.trim()) return "Kindly input your age to vote";
      if ((parseInt(voterAgeEl.value, 10) || 0) < 18) return "Kindly note that minimum voting age is 18";
      return "";
    }
    function showVoteTooltip(force = false) {
      const message = getVoteValidationMessage();
      if (!voteTooltipEl) return;
      if (!message || (!force && !voteBtn?.disabled)) {
        hideVoteTooltip();
        return;
      }
      if (voteTooltipTimer) {
        clearTimeout(voteTooltipTimer);
        voteTooltipTimer = null;
      }
      voteTooltipEl.textContent = message;
      voteTooltipEl.classList.add('visible');
      voteTooltipTimer = setTimeout(() => {
        hideVoteTooltip();
      }, 2600);
    }
    function hideVoteTooltip() {
      if (!voteTooltipEl) return;
      if (voteTooltipTimer) {
        clearTimeout(voteTooltipTimer);
        voteTooltipTimer = null;
      }
      voteTooltipEl.classList.remove('visible');
    }
    function updateProgress() {
      let steps = 8;
      let done = 0;
      if (selectedPresident) done++;
      if (selectedVP) done++;
      if (voterNameEl?.value.trim()) done++;
      if (voterPhoneEl?.value.length === 11 && voterPhoneEl.value.startsWith('0')) done++;
      if (voterStateEl?.value) done++;
      if (voterCityEl?.value) done++;
      if (voterGenderEl?.value) done++;
      if (voterAgeEl?.value.trim()) done++;
      let ratio = (steps > 0) ? (done / steps) * 100 : 0;
      if (buttonFillEl) buttonFillEl.style.width = ratio + "%";
      if (voteBtn) {
          if (done === steps) {
            voteBtn.disabled = false;
            voteBtn.classList.add('bounce');
            hideVoteTooltip();
          } else {
            voteBtn.disabled = true;
            voteBtn.classList.remove('bounce');
          }
      }
    }
    function formatNumber(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
      if (num >= 1000)    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
      return String(num);
    }
    function buildShareUrl(comboKey, referralCode = "") {
      const shareUrl = new URL('/_functions/pollShare', `${getPollBackendBase()}/`);
      shareUrl.searchParams.set('combo', comboKey);
      if (referralCode) {
        shareUrl.searchParams.set('ref', referralCode.toUpperCase());
      } else {
        shareUrl.searchParams.delete('ref');
      }
      return shareUrl.toString();
    }
    async function shareVoteLink({ comboKey, referralCode = "", sharerName = "" }) {
      const shareUrl = buildShareUrl(comboKey, referralCode);
      const referralSuffix = referralCode ? ` Use referral code ${referralCode.toUpperCase()} when you vote.` : "";
      const sharerPrefix = sharerName ? `${sharerName} is inviting you to vote for ` : `Vote for `;
      const shareText = `${sharerPrefix}${comboKey} in the 2027 Nigeria Election Poll.${referralSuffix} ${shareUrl}`;
      if (navigator.share) {
        await navigator.share({
          title: 'Nigeria Election Poll',
          text: shareText,
          url: shareUrl
        });
        return;
      }
      await navigator.clipboard.writeText(shareText);
      openNoticeModal({
        title: "Share Link Ready",
        message: "The share link has been copied to your clipboard.",
        kicker: "Success"
      });
    }
    function applySharedSelectionFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const sharedCombo = params.get('combo');
      const sharedReferral = params.get('ref');
      if (sharedCombo) {
        const [presName, vpName] = sharedCombo.split(' & ');
        if (presName && candidates.includes(presName)) {
          selectedPresident = presName;
          highlightSelected(presidentListEl, presName);
        }
        if (vpName && candidates.includes(vpName)) {
          selectedVP = vpName;
          highlightSelected(vicePresidentListEl, vpName);
        }
      }
      if (sharedReferral && voterReferralEl) {
        voterReferralEl.value = sharedReferral.toUpperCase();
      }
      updateProgress();
    }
    function countCommentsForCombo(comboKey) {
      const commentsArray = comboComments[comboKey] || [];
      let totalComments = 0;
      function countCommentsRecursive(comments) {
        comments.forEach(comment => {
          totalComments++;
          if (comment.replies && comment.replies.length > 0) {
            countCommentsRecursive(comment.replies);
          }
        });
      }
      countCommentsRecursive(commentsArray);
      return totalComments;
    }
    function getCommentAvatar(name) {
      const safeName = encodeURIComponent(name || "Anonymous");
      return `https://ui-avatars.com/api/?name=${safeName}&background=e8efe9&color=173725&bold=true&rounded=true&size=96`;
    }
    function getCommentTimeLabel(createdAt) {
      if (!createdAt) return "Just now";
      const createdTime = new Date(createdAt).getTime();
      if (Number.isNaN(createdTime)) return "Just now";
      const diffMs = Math.max(0, Date.now() - createdTime);
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      const week = 7 * day;
      if (diffMs < minute) return "Just now";
      if (diffMs < hour) return `${Math.floor(diffMs / minute)}m`;
      if (diffMs < day) return `${Math.floor(diffMs / hour)}h`;
      if (diffMs < week) return `${Math.floor(diffMs / day)}d`;
      return `${Math.floor(diffMs / week)}w`;
    }
    function updateComboModalHeader(comboKey) {
      if (!comboKey) return;
      const [presName, vpName] = comboKey.split(" & ");
      if (comboCommentTitle) comboCommentTitle.textContent = comboKey;
      if (comboModalComboName) comboModalComboName.textContent = comboKey;
      if (comboModalVotes) comboModalVotes.textContent = `♥ ${formatNumber(votesData[comboKey] || 0)}`;
      if (comboModalComments) comboModalComments.textContent = `💬 ${formatNumber(countCommentsForCombo(comboKey))}`;
      if (comboModalImage1) {
        comboModalImage1.src = candidateImages[presName] || 'https://placehold.co/520x520/cccccc/ffffff?text=P';
        comboModalImage1.alt = presName || 'First candidate';
        comboModalImage1.onerror = () => imageError(comboModalImage1);
      }
      if (comboModalImage2) {
        comboModalImage2.src = candidateImages[vpName] || 'https://placehold.co/320x320/cccccc/ffffff?text=V';
        comboModalImage2.alt = vpName || 'Second candidate';
        comboModalImage2.onerror = () => imageError(comboModalImage2);
      }
    }
    function closeComboComments() {
      currentCombo = null;
      if (comboCommentSection) comboCommentSection.classList.remove('active');
      document.body.style.overflow = '';
    }
    function openLoyalistModal(comboName, influencerList) {
      if (!loyalistModalEl || !loyalistModalList) return;
      const activeInfluencerList = (influencerList || []).filter((loy) => (loy.supporters || 0) > 0);
      if (!activeInfluencerList.length) return;
      loyalistModalTitle.textContent = comboName;
      const totalInfluencers = activeInfluencerList.length;
      loyalistModalMeta.textContent = `${formatNumber(totalInfluencers)} influencers ranked for this combo`;
      if (loyalistModalImage1) {
        loyalistModalImage1.src = activeInfluencerList[0]?.comboImg1 || 'https://placehold.co/520x520/cccccc/ffffff?text=P';
        loyalistModalImage1.onerror = () => imageError(loyalistModalImage1);
      }
      if (loyalistModalImage2) {
        loyalistModalImage2.src = activeInfluencerList[0]?.comboImg2 || 'https://placehold.co/320x320/cccccc/ffffff?text=V';
        loyalistModalImage2.onerror = () => imageError(loyalistModalImage2);
      }
      loyalistModalList.innerHTML = '';
      activeInfluencerList.forEach((loy, index) => {
        const row = document.createElement('div');
        row.className = 'loyalist-modal-row';
        row.innerHTML = `
          <div class="loyalist-modal-rank">${index + 1}</div>
          <div class="loyalist-modal-main">
            <div class="loyalist-modal-body">
              <div class="loyalist-modal-name">${loy.name}</div>
              <div class="loyalist-modal-meta">
                <span class="loyalist-modal-city">${loy.city || 'Unknown location'}</span>
                <span class="loyalist-modal-time">Active mobilizer</span>
              </div>
              <div class="loyalist-modal-note">Influenced <strong>${formatNumber(loy.supporters)}</strong> verified voters for this combo.</div>
            </div>
            <div class="loyalist-modal-actions">
              <div class="loyalist-modal-supporters">${formatNumber(loy.supporters)} voters</div>
              <button class="loyalist-modal-share" type="button">Share link</button>
            </div>
          </div>
        `;
        const shareBtn = row.querySelector('.loyalist-modal-share');
        if (shareBtn) {
          shareBtn.addEventListener('click', async (event) => {
            event.stopPropagation();
            try {
              await shareVoteLink({
                comboKey: comboName,
                referralCode: loy.code,
                sharerName: loy.name
              });
            } catch (error) {
              console.error('Error sharing influencer link:', error);
            }
          });
        }
        loyalistModalList.appendChild(row);
      });
      loyalistModalEl.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeLoyalistModal() {
      if (loyalistModalEl) loyalistModalEl.classList.remove('active');
      if (!comboCommentSection?.classList.contains('active')) {
        document.body.style.overflow = '';
      }
    }
    function interpolateMapColor(startHex, endHex, ratio) {
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      const start = {
        r: (startHex >> 16) & 255,
        g: (startHex >> 8) & 255,
        b: startHex & 255
      };
      const end = {
        r: (endHex >> 16) & 255,
        g: (endHex >> 8) & 255,
        b: endHex & 255
      };
      const r = Math.round(start.r + (end.r - start.r) * clampedRatio);
      const g = Math.round(start.g + (end.g - start.g) * clampedRatio);
      const b = Math.round(start.b + (end.b - start.b) * clampedRatio);
      return (r << 16) | (g << 8) | b;
    }
    function generateReferralCode() { // Still needed locally for display before vote confirmation
      return "REF" + Math.floor(Math.random() * 90000 + 10000);
    }
    function imageError(imgElement) {
        imgElement.onerror = null;
        imgElement.src = 'https://placehold.co/80x80/cccccc/ffffff?text=N/A';
    }
    function showHeartBlast(event) {
        const numHearts = 8;
        const duration = 1200;
        for (let i = 0; i < numHearts; i++) {
            const heart = document.createElement('span');
            heart.classList.add('heart-particle');
            heart.textContent = '♥';
            const x = event.clientX;
            const y = event.clientY;
            heart.style.left = `${x}px`;
            heart.style.top = `${y}px`;
            const randomX = (Math.random() - 0.5) * 100;
            const randomY = -60 - Math.random() * 50;
            heart.style.setProperty('--tx', `${randomX}px`);
            heart.style.setProperty('--ty', `${randomY}px`);
            document.body.appendChild(heart);
            setTimeout(() => { heart.remove(); }, duration);
        }
    }
    function loadMockData() {
      candidates = [];
      candidateImages = {};
      candidateDetails = {};
      candidateLikes = {};
      votesData = {};
      comboShares = {};
      comboComments = {};
      loyalists = {};
      mapStatesData = Array.isArray(MOCK_DATA.mapStates) ? [...MOCK_DATA.mapStates] : [];
      socialProofMessages = Array.isArray(MOCK_DATA.socialProofs) ? [...MOCK_DATA.socialProofs] : [];

      MOCK_DATA.candidates.forEach(c => {
        candidates.push(c.name);
        candidateImages[c.name] = c.imageUrl || 'https://placehold.co/80x80/cccccc/ffffff?text=N/A';
        candidateDetails[c.name] = { age: c.age ?? '?', zone: c.zone ?? '?' };
        candidateLikes[c.name] = c.likes ?? 0;
      });

      MOCK_DATA.combos.forEach(c => {
        const comboKey = `${c.president} & ${c.vicePresident}`;
        votesData[comboKey] = c.totalVotes ?? 0;
        comboShares[comboKey] = c.shareCount ?? 0;
      });
      buildCandidateRoleVotes(
        MOCK_DATA.combos.map((combo) => ({
          combo_key: `${combo.president} & ${combo.vicePresident}`,
          president: combo.president,
          vice_president: combo.vicePresident
        })),
        votesData
      );

      const allComments = [];
      let nextCommentId = 1;
      MOCK_DATA.combos.forEach(combo => {
        const comboKey = `${combo.president} & ${combo.vicePresident}`;
        const totalComments = combo.commentCount ?? 0;
        for (let index = 0; index < totalComments; index++) {
          allComments.push({
            id: `seed-comment-${nextCommentId++}`,
            comboKey,
            parentID: 0,
            name: `Voter ${index + 1}`,
            text: `Support for ${comboKey}.`,
            replies: []
          });
        }
      });
      MOCK_DATA.users.forEach(user => {
        allComments.push({
          id: user._id,
          comboKey: user.combo,
          parentID: user.parentId || 0,
          name: user.name || "Anonymous",
          text: user.comment || "",
          replies: []
        });
      });
      const commentsById = {};
      allComments.forEach(comment => commentsById[comment.id] = comment);
      allComments.forEach(comment => {
        if (comment.parentID !== 0 && commentsById[comment.parentID]) {
          commentsById[comment.parentID].replies.push(comment);
        }
      });
      allComments.forEach(comment => {
        if (comment.parentID === 0) {
          if (!comboComments[comment.comboKey]) comboComments[comment.comboKey] = [];
          comboComments[comment.comboKey].push(comment);
        }
      });

      MOCK_DATA.loyalists.forEach(l => {
        loyalists[l.referralCode.toUpperCase()] = {
          loyalistName: l.loyalistName || "Anonymous",
          city: l.city || "",
          combo: l.combo || "",
          supporters: l.supporters ?? 0,
          totalInfluencers: l.totalInfluencers ?? 0,
          donation: l.donation ?? 0,
          comboImg1: l.comboImg1 || 'https://placehold.co/50x50/cccccc/ffffff?text=N/A',
          comboImg2: l.comboImg2 || 'https://placehold.co/50x50/cccccc/ffffff?text=N/A'
        };
      });
    }
    /********************************************
     * UI RENDERING FUNCTIONS
     ********************************************/
    function populateCandidateList(listEl, candidatesArray, isPresidentList) {
      if (!listEl) return;
      listEl.innerHTML = '';
      candidatesArray.forEach(candidateName => {
        const li = document.createElement('li');
        li.className = 'candidate-item';
        li.dataset.candidateName = candidateName;
        const img = document.createElement('img');
        img.className = 'candidate-photo';
        img.src = candidateImages[candidateName] || 'https://placehold.co/80x80/cccccc/ffffff?text=N/A';
        img.alt = candidateName;
        img.onerror = () => imageError(img);
        const nameDiv = document.createElement('div');
        nameDiv.className = 'candidate-name';
        nameDiv.textContent = candidateName;
        const details = candidateDetails[candidateName] || { age: '?', zone: '?' };
        const infoDiv = document.createElement('div');
        infoDiv.className = 'candidate-details';
        infoDiv.textContent = `${details.age} - ${details.zone}`;
        const roleCountDiv = document.createElement('div');
        roleCountDiv.className = 'candidate-role-count';
        roleCountDiv.dataset.role = isPresidentList ? 'president' : 'vice-president';
        roleCountDiv.textContent = `${formatNumber(getCandidateRoleVoteCount(candidateName, isPresidentList))} ${isPresidentList ? 'Pres votes' : 'VP votes'}`;
        const likeDiv = document.createElement('div');
        likeDiv.className = 'like-container';
        const likeBtn = document.createElement('button');
        likeBtn.className = 'like-btn';
        likeBtn.innerHTML = '♥';
        const likeCountSpan = document.createElement('span');
        likeCountSpan.className = 'like-count';
        likeCountSpan.textContent = formatNumber(candidateLikes[candidateName] || 0);
        likeBtn.addEventListener('click', async (event) => {
          event.stopPropagation();
          likeBtn.disabled = true;
          try {
            await incrementCandidateLikeInStore(candidateName);
            candidateLikes[candidateName] = (candidateLikes[candidateName] || 0) + 1;
            updateCandidateLikesUI(candidateName);
            showHeartBlast(event);
          } catch (error) {
            console.error("Like sync error:", error);
            openNoticeModal({ title: "Like Failed", message: "Unable to save your like to the database.", kicker: "Database" });
          } finally {
            setTimeout(() => { likeBtn.disabled = false; }, 500);
          }
        });
        likeDiv.appendChild(likeBtn);
        likeDiv.appendChild(likeCountSpan);
        li.addEventListener('click', () => {
          if (isPresidentList) {
            if (selectedPresident !== candidateName) {
                selectedPresident = candidateName;
                highlightSelected(presidentListEl, candidateName);
                showWikiLightbox(candidateName);
            }
          } else {
             if (selectedVP !== candidateName) {
                selectedVP = candidateName;
                highlightSelected(vicePresidentListEl, candidateName);
                showWikiLightbox(candidateName);
             }
          }
          updateProgress();
        });
        li.appendChild(img);
        li.appendChild(nameDiv);
        li.appendChild(infoDiv);
        li.appendChild(roleCountDiv);
        li.appendChild(likeDiv);
        listEl.appendChild(li);
      });
    }
    function highlightSelected(listEl, selectedName) {
        if (!listEl) return;
        const items = listEl.querySelectorAll('.candidate-item');
        items.forEach(item => {
            if (item.dataset.candidateName === selectedName) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    function updateCandidateLikesUI(candidateName) {
        const currentLikes = candidateLikes[candidateName] || 0;
        const formattedLikes = formatNumber(currentLikes);
        const likeElements = document.querySelectorAll(`.candidate-item[data-candidate-name="${candidateName}"] .like-count`);
        likeElements.forEach(span => {
            span.textContent = formattedLikes;
        });
    }
    function updateStateVoteRow(stateName, comboKey, incrementBy = 1) {
      const normalizedState = normalizeStateName(stateName);
      if (!normalizedState || !comboKey) return;
      const existingRow = mapStatesData.find((row) => (
        normalizeStateName(row.state) === normalizedState && row.combo_key === comboKey
      ));
      if (existingRow) {
        existingRow.votes = (existingRow.votes || 0) + incrementBy;
        return;
      }
      mapStatesData.push({ state: normalizedState, combo_key: comboKey, votes: incrementBy });
    }
    function appendCommentToLocalState(comment) {
      if (!comment?.comboKey || !comment.id) return;
      if (!comboComments[comment.comboKey]) comboComments[comment.comboKey] = [];
      if (comment.parentID && comment.parentID !== 0) {
        const attachReply = (items) => {
          for (const item of items) {
            if (item.id === comment.parentID) {
              item.replies = item.replies || [];
              item.replies.push(comment);
              return true;
            }
            if (item.replies?.length && attachReply(item.replies)) return true;
          }
          return false;
        };
        if (!attachReply(comboComments[comment.comboKey])) {
          comboComments[comment.comboKey].push(comment);
        }
        return;
      }
      comboComments[comment.comboKey].push(comment);
    }
    function upsertLoyalistFromVote(votePayload) {
      const referralCode = votePayload.referralCodeUsed?.toUpperCase();
      if (!referralCode) return;
      const [presName, vpName] = votePayload.combo.split(" & ");
      if (!loyalists[referralCode]) {
        loyalists[referralCode] = {
          loyalistName: "Referral User",
          city: votePayload.city,
          combo: votePayload.combo,
          supporters: 0,
          totalInfluencers: 0,
          donation: 0,
          comboImg1: candidateImages[presName] || 'https://placehold.co/50x50/cccccc/ffffff?text=N/A',
          comboImg2: candidateImages[vpName] || 'https://placehold.co/50x50/cccccc/ffffff?text=N/A'
        };
      }
      loyalists[referralCode].supporters = (loyalists[referralCode].supporters || 0) + 1;
      const comboInfluencerCount = Object.values(loyalists).filter((entry) => entry.combo === votePayload.combo).length;
      Object.values(loyalists).forEach((entry) => {
        if (entry.combo === votePayload.combo) {
          entry.totalInfluencers = comboInfluencerCount;
        }
      });
    }
    function applyVoteToLocalState(votePayload) {
      const comboKey = votePayload.combo;
      const [presidentName, vicePresidentName] = comboKey.split(" & ");
      if (!comboDefinitions.includes(comboKey)) comboDefinitions.push(comboKey);
      votesData[comboKey] = (votesData[comboKey] || 0) + 1;
      comboShares[comboKey] = comboShares[comboKey] || 0;
      candidateRoleVotes.president[presidentName] = (candidateRoleVotes.president[presidentName] || 0) + 1;
      candidateRoleVotes.vicePresident[vicePresidentName] = (candidateRoleVotes.vicePresident[vicePresidentName] || 0) + 1;
      updateStateVoteRow(votePayload.state, comboKey, 1);
      upsertLoyalistFromVote(votePayload);
      updateCandidateRoleVotesUI(presidentName, true);
      updateCandidateRoleVotesUI(vicePresidentName, false);
      renderChart();
      renderComboGrid();
      renderComboLoyalists();
      renderMap();
      renderPieChart();
      if (currentCombo === comboKey) updateComboModalHeader(comboKey);
    }
    /********************************************
     * VOTING LOGIC
     ********************************************/
    async function submitVote({ skipReferralPrompt = false } = {}) {
      if (voteBtn?.disabled) { return; }
      const name = voterNameEl?.value.trim();
      const phone = voterPhoneEl?.value.trim();
      const state = voterStateEl?.value;
      const city = voterCityEl?.value;
      const gender = voterGenderEl?.value;
      const age = voterAgeEl?.value.trim();
      const voteValidationMessage = getVoteValidationMessage();
      if (voteValidationMessage) {
        openNoticeModal({ title: "Unable to Vote", message: voteValidationMessage, kicker: "Validation" });
        return;
      }
      const typedReferral = voterReferralEl?.value.trim().toUpperCase() || null;
      if (!typedReferral && !skipReferralPrompt) {
        openReferralPromptModal();
        return;
      }
      closeReferralPromptModal();
      voteBtn.disabled = true;
      const originalButtonText = voteBtn.querySelector('.vote-text').textContent;
      voteBtn.querySelector('.vote-text').textContent = 'Voting...';
      voteBtn.classList.remove('bounce');
      const comboKey = `${selectedPresident} & ${selectedVP}`;
      const votePayload = {
          name: name, phone: phone, state: state, city: city, gender: gender,
          age: parseInt(age) || 0, combo: comboKey, referralCodeUsed: typedReferral
      };
      debugLog("submitVote", "Submitting vote from UI.", {
        comboKey,
        selectedPresident,
        selectedVP,
        state,
        city,
        referralCodeUsed: typedReferral
      });
      try {
        const insertedVote = await persistVoteRecord(votePayload);
        applyVoteToLocalState(votePayload);
        debugLog("submitVote", "Post-write local verification.", {
          insertedVoteId: insertedVote?.id || null,
          comboKey,
          comboVotesAfterWrite: votesData[comboKey] || 0,
          stateRowsAfterWrite: mapStatesData.filter((row) => normalizeStateName(row.state) === normalizeStateName(state)),
          totalVotesAfterWrite: Object.values(votesData).reduce((sum, count) => sum + count, 0)
        });
        openNoticeModal({
          title: "Vote Submitted",
          message: `Your vote for ${comboKey} has been recorded successfully.`,
          kicker: "Success"
        });
      } catch (error) {
        debugError("submitVote", "Vote persistence error.", error);
        const message = /already voted/i.test(error?.message || "")
          ? "This phone number has already been used to vote."
          : "Your vote could not be saved to the database. No local counts were changed.";
        openNoticeModal({
          title: "Vote Failed",
          message,
          kicker: "Database"
        });
      }
      if (voterReferralEl) voterReferralEl.value = '';
      if (referralPromptInput) referralPromptInput.value = '';
      setTimeout(() => {
          voteBtn.disabled = false;
          voteBtn.querySelector('.vote-text').textContent = originalButtonText;
          updateProgress();
      }, 2000);
    }
    if (voteBtn) {
        voteBtn.addEventListener('click', async () => {
          await submitVote();
        });
    }
    if (voteActionEl) {
      voteActionEl.addEventListener('mouseenter', () => {
        if (voteBtn?.disabled) {
          showVoteTooltip();
        }
      });
      voteActionEl.addEventListener('mouseleave', hideVoteTooltip);
      voteActionEl.addEventListener('click', (event) => {
        if (voteBtn?.disabled) {
          event.preventDefault();
          showVoteTooltip(true);
        }
      });
    }
    /********************************************
     * BAR CHART RENDER (Using DIVs)
     ********************************************/
    function renderChart() {
        if (!chartBarsEl) return;
        chartBarsEl.innerHTML = '';
        const sortedVotes = Object.entries(votesData)
          .filter(([, count]) => count > 0)
          .sort(([,a],[,b]) => b - a);
        debugLog("renderChart", "Rendering chart.", {
          combosWithVotes: sortedVotes.length,
          topCombo: sortedVotes[0]?.[0] || null,
          topVotes: sortedVotes[0]?.[1] || 0
        });
        if (!sortedVotes.length) {
            chartBarsEl.innerHTML = "<p>No votes recorded yet.</p>";
            return;
        }
        const maxVotes = sortedVotes.length > 0 ? sortedVotes[0][1] : 0;
        sortedVotes.forEach(([combo, count]) => {
            const row = document.createElement('div');
            row.className = 'chart-bar';
            const labelDiv = document.createElement('div');
            labelDiv.className = 'bar-label';
            labelDiv.textContent = combo;
            labelDiv.title = `${combo} (${formatNumber(count)} votes)`;
            const countSpan = document.createElement('span');
            countSpan.className = 'vote-count-label';
            countSpan.textContent = ` (${formatNumber(count)})`;
            labelDiv.appendChild(countSpan);
            const barContainer = document.createElement('div');
            barContainer.className = 'bar-container';
            const barFill = document.createElement('div');
            barFill.className = 'bar-fill';
            const percentage = (maxVotes > 0) ? (count / maxVotes) * 100 : 0;
            barFill.style.width = `${percentage.toFixed(1)}%`;
            barContainer.appendChild(barFill);
            row.appendChild(labelDiv);
            row.appendChild(barContainer);
            chartBarsEl.appendChild(row);
        });
    }
    /********************************************
     * COMBO GRID RENDER
     ********************************************/
    function renderComboGrid() {
        if (!comboGridEl) return;
        comboGridEl.innerHTML = '';
        const sortedVotes = Object.entries(votesData)
          .filter(([, count]) => count > 0)
          .sort(([,a],[,b]) => b - a);
        debugLog("renderComboGrid", "Rendering combo grid.", { combosWithVotes: sortedVotes.length });
        if (!sortedVotes.length) {
            comboGridEl.innerHTML = "<p>No combinations voted for yet.</p>";
            return;
        }
        sortedVotes.forEach(([combo, count]) => {
            const card = document.createElement('div');
            card.className = 'combo-card';
            card.dataset.comboKey = combo;
            const shareBtn = document.createElement('button');
            shareBtn.className = 'share-btn';
            shareBtn.innerHTML = '⤴';
            shareBtn.title = `Share ${combo}`;
            shareBtn.addEventListener('click', async (event) => {
                event.stopPropagation();
                try {
                  await shareVoteLink({ comboKey: combo });
                  await persistShareCount(combo);
                  comboShares[combo] = (comboShares[combo] || 0) + 1;
                  renderComboGrid();
                  if (currentCombo === combo) updateComboModalHeader(combo);
                } catch (error) {
                  console.error('Error sharing combo link:', error);
                  openNoticeModal({ title: "Share Failed", message: "Unable to save this share to the database.", kicker: "Database" });
                }
            });
            const topDiv = document.createElement('div');
            topDiv.className = 'combo-top';
            const [presName, vpName] = combo.split(" & ");
            const imgPres = document.createElement('img');
            imgPres.className = 'combo-img';
            imgPres.src = candidateImages[presName] || 'https://placehold.co/55x55/cccccc/ffffff?text=N/A';
            imgPres.alt = presName;
            imgPres.onerror = () => imageError(imgPres);
            const imgVP = document.createElement('img');
            imgVP.className = 'combo-img';
            imgVP.src = candidateImages[vpName] || 'https://placehold.co/55x55/cccccc/ffffff?text=N/A';
            imgVP.alt = vpName;
            imgVP.onerror = () => imageError(imgVP);
            topDiv.appendChild(imgPres);
            topDiv.appendChild(imgVP);
            card.appendChild(topDiv);
            const titleDiv = document.createElement('div');
            titleDiv.className = 'combo-title';
            titleDiv.textContent = combo;
            card.appendChild(titleDiv);
            const statsDiv = document.createElement('div');
            statsDiv.className = 'combo-stats';
            const voteSpan = document.createElement('span');
            voteSpan.className = 'vote-heart';
            voteSpan.innerHTML = `♥ ${formatNumber(count)}`;
            statsDiv.appendChild(voteSpan);
            const commentSpan = document.createElement('span');
            commentSpan.className = 'comment-icon';
            commentSpan.innerHTML = `💬 ${formatNumber(countCommentsForCombo(combo))}`;
            statsDiv.appendChild(commentSpan);
            const shareSpan = document.createElement('span');
            shareSpan.className = 'share-count';
            shareSpan.textContent = formatNumber(comboShares[combo] || 0);
            statsDiv.appendChild(shareBtn);
            statsDiv.appendChild(shareSpan);
            card.appendChild(statsDiv);
            card.addEventListener('click', () => { openComboComments(combo); });
            comboGridEl.appendChild(card);
        });
    }
    /********************************************
     * LOYALISTS RENDER (Top Combo Peddlers)
     ********************************************/
function renderComboLoyalists() {
  if (!loyalistCombosEl) return; // Ensure the container element exists
  loyalistCombosEl.innerHTML = '';
  const activeLoyalistEntries = Object.entries(loyalists).filter(([, loyData]) => (loyData.supporters || 0) > 0);
  const totalInfluencers = activeLoyalistEntries.length;
  debugLog("renderComboLoyalists", "Rendering loyalists.", {
    storedLoyalists: Object.keys(loyalists).length,
    activeInfluencers: totalInfluencers
  });
  if (loyalistMetaEl) {
    loyalistMetaEl.textContent = `Total ${formatNumber(totalInfluencers)} Influencers`;
  }

  // 1) Group loyalists by combo
  const comboMap = {};
  activeLoyalistEntries.forEach(([refCode, loyData]) => {
    const comboName = loyData.combo;
    if (!comboName) return;
    if (!comboMap[comboName]) {
      comboMap[comboName] = [];
    }
    comboMap[comboName].push({
      code: refCode,
      name: loyData.loyalistName || "Anonymous",
      city: loyData.city || "Unknown",
      supporters: loyData.supporters || 0,
      totalInfluencers: loyData.totalInfluencers || 0,
      comboImg1: loyData.comboImg1 || "",
      comboImg2: loyData.comboImg2 || ""
    });
  });

    const medalIcons = ["🥇", "🥈", "🥉"]; // for top 3 places
  let foundAny = false;

  // 2) Render each combo that has loyalists
  Object.keys(comboMap).forEach((comboName) => {
    const arr = comboMap[comboName];
    if (!arr || arr.length === 0) return;

    foundAny = true;

    // Sort the loyalists for this combo by descending supporters
    arr.sort((a, b) => b.supporters - a.supporters);

    // We'll use the first loyalist's record to get the combo images
    const { comboImg1, comboImg2 } = arr[0];

    // Create outer wrapper for this combo block
    const comboWrapper = document.createElement('div');
    comboWrapper.className = 'loyalist-combo-wrap';
    comboWrapper.tabIndex = 0;

    // Add a title for the combo
    const comboTitle = document.createElement('h4');
    comboTitle.className = 'loyalist-combo-title';
    comboTitle.textContent = comboName;
    comboWrapper.appendChild(comboTitle);

    // Create the flex container that holds images on the left, influencers on the right
    const flexContainer = document.createElement('div');
    flexContainer.className = 'loyalist-flex';

    // Left column: images
    const imagesCol = document.createElement('div');
    imagesCol.className = 'loyalist-images-col';

    const img1 = document.createElement('img');
    img1.className = 'loyalist-square-img';
    img1.src = comboImg1 || 'https://placehold.co/50x50';
    img1.onerror = () => { img1.src = 'https://placehold.co/50x50'; };

    const img2 = document.createElement('img');
    img2.className = 'loyalist-square-img';
    img2.src = comboImg2 || 'https://placehold.co/50x50';
    img2.onerror = () => { img2.src = 'https://placehold.co/50x50'; };

    imagesCol.appendChild(img1);
    imagesCol.appendChild(img2);

    // Right column: influencer rows
    const influencersCol = document.createElement('div');
    influencersCol.className = 'loyalist-influencers-col';

    arr.forEach((loy, index) => {
      // Decide medal or star
      let icon = medalIcons[index] || '⭐';

      const row = document.createElement('div');
      row.className = 'loyalist-row';

      // Build the influencer text
      const textLine = document.createElement('div');
      textLine.className = 'loyalist-info';
      textLine.innerHTML = `
        ${icon} <strong>${loy.name}</strong>${loy.city ? ` from <em>${loy.city}</em>` : ""}
        influenced <strong>${formatNumber(loy.supporters)}</strong> voters.
      `;

      row.appendChild(textLine);
      influencersCol.appendChild(row);
    });

    const totalInfluencersLine = document.createElement('button');
    totalInfluencersLine.className = 'loyalist-total-link';
    totalInfluencersLine.type = 'button';
    totalInfluencersLine.textContent = `${formatNumber(arr.length)} Influencers (Click to view all)`;
    totalInfluencersLine.addEventListener('click', (event) => {
      event.stopPropagation();
      openLoyalistModal(comboName, arr);
    });
    influencersCol.appendChild(totalInfluencersLine);

    comboWrapper.addEventListener('click', () => openLoyalistModal(comboName, arr));
    comboWrapper.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLoyalistModal(comboName, arr);
      }
    });

    // Assemble the flex container
    flexContainer.appendChild(imagesCol);
    flexContainer.appendChild(influencersCol);

    // Add the flex container into the combo wrapper
    comboWrapper.appendChild(flexContainer);

    // Finally, attach this combo wrapper to the main container
    loyalistCombosEl.appendChild(comboWrapper);
  });

  // 3) If no combos had loyalists, show a placeholder
  if (!foundAny) {
    loyalistCombosEl.innerHTML = "<p>No influencers have referred any voters yet.</p>";
  }
}




    /********************************************
     * COMMENTS RENDER & INTERACTION
     ********************************************/
     function renderComboComments() {
        if (!comboCommentListEl || !currentCombo) return;
        comboCommentListEl.innerHTML = '';
        const commentsForCombo = comboComments[currentCombo] || [];
        if (commentsForCombo.length === 0) {
            comboCommentListEl.innerHTML = '<p>Be the first to comment on this combo!</p>';
            return;
        }
        commentsForCombo.forEach(comment => {
            if (!comment.parentID || comment.parentID === 0) {
                 comboCommentListEl.appendChild(createCommentElement(comment));
            }
        });
    }
     function createCommentElement(commentData) {
        const wrap = document.createElement('div');
        wrap.className = 'combo-comment-item';
        wrap.dataset.commentId = commentData.id;
        const avatarImg = document.createElement('img');
        avatarImg.className = 'comment-avatar';
        avatarImg.src = getCommentAvatar(commentData.name);
        avatarImg.alt = commentData.name || "Anonymous";
        const authorDiv = document.createElement('div');
        authorDiv.className = 'comment-author';
        authorDiv.textContent = commentData.name || "Anonymous";
        const timeDiv = document.createElement('span');
        timeDiv.className = 'comment-time';
        timeDiv.textContent = getCommentTimeLabel(commentData.createdAt);
        const metaDiv = document.createElement('div');
        metaDiv.className = 'comment-meta';
        metaDiv.appendChild(authorDiv);
        metaDiv.appendChild(timeDiv);
        const textDiv = document.createElement('div');
        textDiv.className = 'comment-text';
        textDiv.textContent = commentData.text || "(No comment)";
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'comment-actions';
        actionsDiv.textContent = 'Reply';
        actionsDiv.style.cursor = 'pointer';
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'comment-body';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'comment-content';
        const replyFormDiv = document.createElement('div');
        replyFormDiv.className = 'reply-form';
        const replyNameInput = document.createElement('input');
        replyNameInput.className = 'reply-input';
        replyNameInput.type = 'text';
        replyNameInput.placeholder = 'Your Name';
        const replyTextInput = document.createElement('textarea');
        replyTextInput.className = 'reply-textarea';
        replyTextInput.rows = 2;
        replyTextInput.placeholder = 'Your reply...';
        const replyBtn = document.createElement('button');
        replyBtn.className = 'reply-btn';
        replyBtn.textContent = 'Post Reply';
        actionsDiv.addEventListener('click', () => {
            const isVisible = replyFormDiv.style.display === 'flex';
            replyFormDiv.style.display = isVisible ? 'none' : 'flex';
        });
        // Local reply interaction
        replyBtn.addEventListener('click', async () => {
            const replyName = replyNameInput.value.trim();
            const replyText = replyTextInput.value.trim();
            if (!replyName || !replyText) {
              openNoticeModal({ title: "Reply Error", message: "Please enter name and reply.", kicker: "Validation" });
              return;
            }
            replyBtn.disabled = true;
            const originalButtonText = replyBtn.textContent;
            replyBtn.textContent = 'Posting...';
            const replyPayload = {
                parentID: commentData.id,
                name: replyName,
                text: replyText,
                comboKey: commentData.comboKey
            };
            try {
              const savedReply = await persistComment(replyPayload);
              appendCommentToLocalState(savedReply);
            } catch (error) {
              console.error("Reply persistence error:", error);
              openNoticeModal({ title: "Reply Failed", message: "Unable to save your reply to the database.", kicker: "Database" });
              replyBtn.disabled = false;
              replyBtn.textContent = originalButtonText;
              return;
            }
            replyNameInput.value = '';
            replyTextInput.value = '';
            replyFormDiv.style.display = 'none';
            updateComboModalHeader(currentCombo);
            renderComboComments();
            renderComboGrid();
             setTimeout(() => {
                replyBtn.disabled = false;
                replyBtn.textContent = originalButtonText;
             }, 1500);
        });
        // --- End Reply button ---
        replyFormDiv.appendChild(replyNameInput);
        replyFormDiv.appendChild(replyTextInput);
        replyFormDiv.appendChild(replyBtn);
        contentDiv.appendChild(metaDiv);
        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(actionsDiv);
        contentDiv.appendChild(replyFormDiv);
        if (commentData.replies && commentData.replies.length > 0) {
            const repliesContainer = document.createElement('div');
            repliesContainer.className = 'comment-replies';
            commentData.replies.forEach(reply => {
                repliesContainer.appendChild(createCommentElement(reply));
            });
            contentDiv.appendChild(repliesContainer);
        }
        bodyDiv.appendChild(contentDiv);
        wrap.appendChild(avatarImg);
        wrap.appendChild(bodyDiv);
        return wrap;
    }
     // Local comment post interaction
    if (comboCommentPostBtn) {
        comboCommentPostBtn.addEventListener('click', async () => {
          if (!currentCombo) {
            openNoticeModal({ title: "Comment Error", message: "No combo selected.", kicker: "Validation" });
            return;
          }
          const name = comboCommentName?.value.trim();
          const text = comboCommentText?.value.trim();
          if (!name || !text) {
            openNoticeModal({ title: "Comment Error", message: "Please enter name and comment.", kicker: "Validation" });
            return;
          }
          comboCommentPostBtn.disabled = true;
          const originalButtonText = comboCommentPostBtn.textContent;
          comboCommentPostBtn.textContent = 'Posting...';
          const commentPayload = {
            parentID: 0, name: name, text: text, comboKey: currentCombo
          };
          try {
            const savedComment = await persistComment(commentPayload);
            appendCommentToLocalState(savedComment);
          } catch (error) {
            console.error("Comment persistence error:", error);
            openNoticeModal({ title: "Comment Failed", message: "Unable to save your comment to the database.", kicker: "Database" });
            comboCommentPostBtn.disabled = false;
            comboCommentPostBtn.textContent = originalButtonText;
            return;
          }
          // Clear form and re-render
          if (comboCommentName) comboCommentName.value = '';
          if (comboCommentText) comboCommentText.value = '';
          updateComboModalHeader(currentCombo);
          renderComboComments();
          renderComboGrid();
          // Re-enable button after delay
          setTimeout(() => {
              comboCommentPostBtn.disabled = false;
              comboCommentPostBtn.textContent = originalButtonText;
          }, 1500);
        });
    }
    // --- End Comment Post button ---
     function openComboComments(comboKey) {
        currentCombo = comboKey;
        if (!comboCommentSection) {
            console.error("Comment section element with ID 'commentsSection' not found.");
            return;
        }
        comboCommentSection.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateComboModalHeader(comboKey);
        renderComboComments();
    }
    if (comboCommentClose) {
      comboCommentClose.addEventListener('click', closeComboComments);
    }
    if (comboCommentSection) {
      comboCommentSection.addEventListener('click', (event) => {
        if (event.target === comboCommentSection) {
          closeComboComments();
        }
      });
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && comboCommentSection?.classList.contains('active')) {
        closeComboComments();
      }
    });
    if (loyalistModalClose) {
      loyalistModalClose.addEventListener('click', closeLoyalistModal);
    }
    if (loyalistModalEl) {
      loyalistModalEl.addEventListener('click', (event) => {
        if (event.target === loyalistModalEl) {
          closeLoyalistModal();
        }
      });
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && loyalistModalEl?.classList.contains('active')) {
        closeLoyalistModal();
      }
    });
    if (noticeModalClose) {
      noticeModalClose.addEventListener('click', closeNoticeModal);
    }
    if (noticeModalBtn) {
      noticeModalBtn.addEventListener('click', closeNoticeModal);
    }
    if (noticeModalEl) {
      noticeModalEl.addEventListener('click', (event) => {
        if (event.target === noticeModalEl) {
          closeNoticeModal();
        }
      });
    }
    if (referralPromptClose) {
      referralPromptClose.addEventListener('click', closeReferralPromptModal);
    }
    if (referralPromptContinue) {
      referralPromptContinue.addEventListener('click', () => {
        if (voterReferralEl && referralPromptInput) {
          voterReferralEl.value = referralPromptInput.value.trim().toUpperCase();
        }
        submitVote({ skipReferralPrompt: true });
      });
    }
    if (referralPromptSkip) {
      referralPromptSkip.addEventListener('click', () => {
        if (voterReferralEl) voterReferralEl.value = '';
        if (referralPromptInput) referralPromptInput.value = '';
        submitVote({ skipReferralPrompt: true });
      });
    }
    if (referralPromptModal) {
      referralPromptModal.addEventListener('click', (event) => {
        if (event.target === referralPromptModal) {
          closeReferralPromptModal();
        }
      });
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && noticeModalEl?.classList.contains('active')) {
        closeNoticeModal();
      }
      if (event.key === 'Escape' && referralPromptModal?.classList.contains('active')) {
        closeReferralPromptModal();
      }
    });
    /********************************************
     * amCharts MAP RENDER
     ********************************************/
    function initMap() {
      am5.ready(function() {
          try {
            let root = am5.Root.new("nigeriaMap");
            root.setThemes([am5themes_Animated.new(root)]);
            mapChart = root.container.children.push(
              am5map.MapChart.new(root, {
                panX: "rotateX", panY: "none", wheelX: "zoom", wheelY: "none",
                projection: am5map.geoMercator(), maxZoomLevel: 4, minZoomLevel: 0.8
              })
            );
            polygonSeries = mapChart.series.push(
              am5map.MapPolygonSeries.new(root, {
                geoJSON: am5geodata_nigeriaLow, valueField: "value", calculateAggregates: true
              })
            );
            polygonSeries.mapPolygons.template.setAll({
              interactive: true,
              tooltipHTML: `<div style="min-width:150px; font-family: 'Manrope', sans-serif;">{tooltipHTML}</div>`,
              templateField: "polygonSettings",
              stroke: am5.color(0xffffff),
              strokeWidth: 1.2
            });
             polygonSeries.mapPolygons.template.states.create("hover", { fill: am5.color(0xffa500) });
            mapChart.set("zoomControl", am5map.ZoomControl.new(root, {}));
            renderMap(); // Render initially (might use empty data if mapStatesData isn't ready)
          } catch (e) {
              console.error("Error initializing amCharts map:", e);
              const mapDiv = document.getElementById("nigeriaMap");
              if (mapDiv) mapDiv.innerHTML = "<p style='color:red; text-align:center; padding: 20px;'>Error loading map. Please refresh.</p>";
          }
      });
    }
    function computeStateTopCombosFromCMS() {
        let stateResults = {};
        if (!Array.isArray(mapStatesData) || mapStatesData.length === 0) {
            // console.warn("computeStateTopCombosFromCMS: mapStatesData is empty or not an array."); // Less verbose
            return stateResults;
        }
        const isLongFormat = mapStatesData.every(item => item && item.state && item.combo_key && typeof item.votes === 'number');
        if (isLongFormat) {
          mapStatesData.forEach((row) => {
            const stateName = normalizeStateName(row.state);
            if (!stateName) return;
            const current = stateResults[stateName];
            if (!current || row.votes > current.count) {
              stateResults[stateName] = { combo: row.combo_key, count: row.votes };
            }
          });
          return stateResults;
        }
        const keyToComboNameMap = {
            "Bola Tinubu & Kashim Shettima": "Bola Tinubu & Kashim Shettima", "tinubuKashim": "Bola Tinubu & Kashim Shettima",
            "Atiku Abubakar & Nyesom Wike": "Atiku Abubakar & Nyesom Wike", "atikuWike": "Atiku Abubakar & Nyesom Wike",
            "Peter Obi & Yemi Osinbajo": "Peter Obi & Yemi Osinbajo", "peterObiYemiOsinbajo": "Peter Obi & Yemi Osinbajo", "peterYemi": "Peter Obi & Yemi Osinbajo",
            "Goodluck Jonathan & Nasir El-Rufai": "Goodluck Jonathan & Nasir El-Rufai", "goodluckElRufai": "Goodluck Jonathan & Nasir El-Rufai",
            "Rabiu Kwankwaso & Rotimi Amaechi": "Rabiu Kwankwaso & Rotimi Amaechi", "rabiuAmaechi": "Rabiu Kwankwaso & Rotimi Amaechi",
            "Atiku Abubakar & Rotimi Amaechi": "Atiku Abubakar & Rotimi Amaechi", "atikuRotimiAmaechi": "Atiku Abubakar & Rotimi Amaechi",
            "Yemi Osinbajo & Bukola Saraki": "Yemi Osinbajo & Bukola Saraki", "yemiBukola": "Yemi Osinbajo & Bukola Saraki",
            "Sanusi Lamido & Yemi Osinbajo": "Sanusi Lamido & Yemi Osinbajo", "sanusiYemi": "Sanusi Lamido & Yemi Osinbajo",
            "Yemi Osinbajo & Sanusi Lamido": "Yemi Osinbajo & Sanusi Lamido", "yemiSanusi": "Yemi Osinbajo & Sanusi Lamido",
            "Peter Obi & Sanusi Lamido": "Peter Obi & Sanusi Lamido", "peterSanusi": "Peter Obi & Sanusi Lamido", "peterObiSanusiLamidu": "Peter Obi & Sanusi Lamido",
            "Rotimi Amaechi & Bukola Saraki": "Rotimi Amaechi & Bukola Saraki", "rotimiBukola": "Rotimi Amaechi & Bukola Saraki",
            "Aminu Tambuwal & Nyesom Wike": "Aminu Tambuwal & Nyesom Wike", "tambuwalWike": "Aminu Tambuwal & Nyesom Wike",
            "Goodluck Jonathan & Rabiu Kwankwaso": "Goodluck Jonathan & Rabiu Kwankwaso", "goodluckRabiu": "Goodluck Jonathan & Rabiu Kwankwaso",
            "Peter Obi & Nasir El-Rufai": "Peter Obi & Nasir El-Rufai", "peterNasir": "Peter Obi & Nasir El-Rufai",
            "Rabiu Kwankwaso & Peter Obi": "Rabiu Kwankwaso & Peter Obi", "rabiuPeter": "Rabiu Kwankwaso & Peter Obi",
            "Aminu Tambuwal & Peter Obi": "Aminu Tambuwal & Peter Obi", "tambuwalPeter": "Aminu Tambuwal & Peter Obi",
            "Atiku Abubakar & Goodluck Jonathan": "Atiku Abubakar & Goodluck Jonathan", "atikuGoodluck": "Atiku Abubakar & Goodluck Jonathan",
            "Atiku Abubakar & Peter Obi": "Atiku Abubakar & Peter Obi", "atikuPeter": "Atiku Abubakar & Peter Obi",
            "Goodluck Jonathan & Aminu Tambuwal": "Goodluck Jonathan & Aminu Tambuwal", "goodluckTambuwal": "Goodluck Jonathan & Aminu Tambuwal",
            "Nasir El-Rufai & Peter Obi": "Nasir El-Rufai & Peter Obi", "nasirElRufaiPeterObi": "Nasir El-Rufai & Peter Obi",
            "Peter Obi & Bukola Saraki": "Peter Obi & Bukola Saraki", "peterBukola": "Peter Obi & Bukola Saraki",
            "Peter Obi & Rabiu Kwankwaso": "Peter Obi & Rabiu Kwankwaso", "peterRabiu": "Peter Obi & Rabiu Kwankwaso",
            "Peter Obi & Aminu Tambuwal": "Peter Obi & Aminu Tambuwal", "peterTambuwal": "Peter Obi & Aminu Tambuwal",
            "Nyesom Wike & Aminu Tambuwal": "Nyesom Wike & Aminu Tambuwal", "wikeTambuwal": "Nyesom Wike & Aminu Tambuwal",
            "Nyesom Wike & Sanusi Lamido": "Nyesom Wike & Sanusi Lamido", "wikeSanusi": "Nyesom Wike & Sanusi Lamido",
            "Sanusi Lamido & Peter Obi": "Sanusi Lamido & Peter Obi", "sanusiPeter": "Sanusi Lamido & Peter Obi",
        };
        const unmappedKeys = new Set();
        mapStatesData.forEach(stateItem => {
            if (!stateItem || !stateItem.state || stateItem.state.toUpperCase() === "TOTAL") { return; }
            const stateName = normalizeStateName(stateItem.state);
            let topComboName = null;
            let maxVotes = -1;
            for (const key in stateItem) {
                if (key !== 'state' && key !== 'zone' && !key.startsWith('_') && typeof stateItem[key] === 'number') {
                    const currentVotes = stateItem[key];
                    if (currentVotes > maxVotes) {
                        const standardizedComboName = keyToComboNameMap[key];
                        if (standardizedComboName) {
                            maxVotes = currentVotes;
                            topComboName = standardizedComboName;
                        } else {
                            if (!unmappedKeys.has(key)) {
                                console.warn(`Map Data Warning: No combo name mapping found for key: '${key}' in state '${stateName}'. Add this key to keyToComboNameMap in computeStateTopCombosFromCMS.`);
                                unmappedKeys.add(key);
                            }
                        }
                    }
                }
            }
            stateResults[stateName] = (topComboName !== null) ? { combo: topComboName, count: maxVotes } : { combo: "N/A", count: 0 };
        });
        return stateResults;
    }
    function renderMap() {
        if (!polygonSeries) { console.log("renderMap: polygonSeries not ready yet."); return; }
        const stateIdMap = {
            "Abia": "NG-AB", "Adamawa": "NG-AD", "Akwa Ibom": "NG-AK", "Anambra": "NG-AN", "Bauchi": "NG-BA", "Bayelsa": "NG-BY", "Benue": "NG-BE", "Borno": "NG-BO",
            "Cross River": "NG-CR", "Delta": "NG-DE", "Ebonyi": "NG-EB", "Edo": "NG-ED", "Ekiti": "NG-EK", "Enugu": "NG-EN", "FCT Abuja": "NG-FC", "Gombe": "NG-GO",
            "Imo": "NG-IM", "Jigawa": "NG-JI", "Kaduna": "NG-KD", "Kano": "NG-KN", "Katsina": "NG-KT", "Kebbi": "NG-KE", "Kogi": "NG-KO", "Kwara": "NG-KW",
            "Lagos": "NG-LA", "Nasarawa": "NG-NA", "Niger": "NG-NI", "Ogun": "NG-OG", "Ondo": "NG-ON", "Osun": "NG-OS", "Oyo": "NG-OY", "Plateau": "NG-PL",
            "Rivers": "NG-RI", "Sokoto": "NG-SO", "Taraba": "NG-TA", "Yobe": "NG-YO", "Zamfara": "NG-ZA"
        };
        let topCombosByState = computeStateTopCombosFromCMS();
        debugLog("renderMap", "Rendering map.", {
          mapStatesDataRows: mapStatesData.length,
          statesWithTopCombo: Object.keys(topCombosByState).length
        });
        const stateCounts = Object.values(topCombosByState)
          .map(info => info?.count || 0)
          .filter(count => count > 0);
        const minVoteCount = stateCounts.length ? Math.min(...stateCounts) : 0;
        const maxVoteCount = stateCounts.length ? Math.max(...stateCounts) : 0;
        let mapDataForSeries = [];
        Object.entries(stateIdMap).forEach(([stateName, geoId]) => {
            let comboInfo = topCombosByState[normalizeStateName(stateName)];
            let tooltipContent = `<strong>${stateName}</strong><br>No voting data available`;
            let voteCount = 0;
            let polygonSettings = {
              fill: am5.color(0xf1f5f1),
              fillOpacity: 1
            };
            if (comboInfo && comboInfo.combo && comboInfo.combo !== "N/A" && comboInfo.count >= 0) {
                voteCount = comboInfo.count;
                const [presName, vpName] = comboInfo.combo.split(" & ");
                const imgPresSrc = candidateImages[presName] || 'https://placehold.co/35x35/cccccc/ffffff?text=P';
                const imgVPSrc = candidateImages[vpName] || 'https://placehold.co/35x35/cccccc/ffffff?text=V';
                const ratio = maxVoteCount > minVoteCount
                  ? (voteCount - minVoteCount) / (maxVoteCount - minVoteCount)
                  : (voteCount > 0 ? 1 : 0);
                polygonSettings = {
                  fill: am5.color(interpolateMapColor(0xdff8e3, 0x045b2c, ratio)),
                  fillOpacity: 1
                };
                tooltipContent = `
                    <div style="font-size:0.85rem; text-align: center;">
                        <strong>${stateName}</strong><hr style='margin: 3px 0;'>
                        Top Combo: <br><em>${comboInfo.combo}</em><br>
                        Votes: <strong>${formatNumber(voteCount)}</strong>
                        <div style="margin-top:5px; display: flex; justify-content: center; gap: 5px;">
                          <img src="${imgPresSrc}" alt="${presName}" style="width:35px; height:35px; border-radius:50%; object-fit: cover; border: 1px solid #ccc;" onerror="this.onerror=null; this.src='https://placehold.co/35x35/cccccc/ffffff?text=P';">
                          <img src="${imgVPSrc}" alt="${vpName}" style="width:35px; height:35px; border-radius:50%; object-fit: cover; border: 1px solid #ccc;" onerror="this.onerror=null; this.src='https://placehold.co/35x35/cccccc/ffffff?text=V';">
                        </div>
                    </div>`;
            }
            mapDataForSeries.push({
              id: geoId,
              name: stateName,
              value: voteCount,
              tooltipHTML: tooltipContent,
              polygonSettings
            });
        });
        polygonSeries.data.setAll(mapDataForSeries);
        debugLog("renderMap", "Map polygon data set.", {
          polygonRows: mapDataForSeries.length,
          activeStates: mapDataForSeries.filter((item) => item.value > 0).length
        });
    }
     /********************************************
     * amCharts PIE CHART RENDER
     ********************************************/
     function renderPieChart() {
        if (pieRoot) { pieRoot.dispose(); pieRoot = null; }
        const pieDiv = document.getElementById("popularityPie");
        if (!pieDiv) return;
        let chartData = Object.entries(votesData)
                                .map(([combo, votes]) => ({ combo, votes }))
                                .filter(item => item.votes > 0);
        debugLog("renderPieChart", "Rendering pie chart.", { slicesBeforeGrouping: chartData.length });
        if (!chartData.length) {
             pieDiv.innerHTML = "<p style='text-align: center; padding: 20px;'>No votes yet to display popularity.</p>";
             return;
        } else {
            pieDiv.innerHTML = "";
        }
        chartData.sort((a, b) => b.votes - a.votes);
        const topSlices = chartData.slice(0, 6);
        const remainingSlices = chartData.slice(6);
        if (remainingSlices.length) {
          topSlices.push({
            combo: "Others",
            votes: remainingSlices.reduce((sum, item) => sum + item.votes, 0)
          });
        }
        chartData = topSlices;
        am5.ready(function() {
             try {
                pieRoot = am5.Root.new("popularityPie");
                pieRoot.setThemes([am5themes_Animated.new(pieRoot)]);
                 let container = pieRoot.container.children.push(am5.Container.new(pieRoot, {
                    width: am5.percent(100), height: am5.percent(100), layout: pieRoot.verticalLayout
                }));
                pieChart = container.children.push(
                    am5percent.PieChart.new(pieRoot, { layout: pieRoot.verticalLayout })
                );
                let series = pieChart.series.push(
                    am5percent.PieSeries.new(pieRoot, {
                        valueField: "votes", categoryField: "combo", alignLabels: false, radius: am5.percent(78), innerRadius: am5.percent(42)
                    })
                );
                series.data.setAll(chartData);
                series.labels.template.setAll({
                    forceHidden: true
                });
                 series.ticks.template.setAll({
                    forceHidden: true
                 });
                series.slices.template.setAll({
                    tooltipText: "{category}: {value} votes ({valuePercentTotal.formatNumber('0.0')}%)",
                    stroke: am5.color(0xffffff), strokeWidth: 1,
                });
                 series.slices.template.states.create("hover", { scale: 1.03 });
                let legend = container.children.push(am5.Legend.new(pieRoot, {
                    centerX: am5.percent(50),
                    x: am5.percent(50),
                    marginTop: 18,
                    marginBottom: 0,
                    width: am5.percent(96),
                    layout: am5.GridLayout.new(pieRoot, {
                      maxColumns: 3,
                      fixedWidthGrid: false
                    })
                }));
                 legend.labels.template.setAll({
                    fontSize: "0.82em",
                    fontWeight: "500",
                    fill: am5.color(0x333333),
                    oversizedBehavior: "truncate",
                    maxWidth: 240
                 });
                 legend.valueLabels.template.setAll({
                    fontSize: "0.8em",
                    fill: am5.color(0x5b6460)
                 });
                 legend.itemContainers.template.setAll({
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingLeft: 10,
                    paddingRight: 10
                 });
                legend.data.setAll(series.dataItems);
                series.appear(1000, 100);
             } catch (e) {
                 console.error("Error rendering amCharts pie chart:", e);
                 if (pieDiv) pieDiv.innerHTML = "<p style='color:red; text-align:center; padding: 20px;'>Error loading popularity chart.</p>";
             }
        });
    }
    /********************************************
     * INITIALIZATION FUNCTION
     ********************************************/
    async function init(){
      debugLog("init", "Initializing application.", {
        protocol: window.location.protocol,
        href: window.location.href,
        hasSupabaseClient: !!supabaseClient
      });
      if (window.location.protocol === 'file:') {
        openNoticeModal({
          title: "Run Through a Local Server",
          message: "This app is being opened with file:// which breaks browser security rules for parts of the app. Start a local server and open it over http://localhost before testing votes, likes, comments, and shares.",
          kicker: "Environment"
        });
      }
      await loadLocationData();
      try {
        await loadSupabaseData();
      } catch (error) {
        debugError("init", "Supabase load failed, using empty state.", error);
        initializeEmptyDataStore();
      }
      populateCandidateList(presidentListEl, candidates, true);
      populateCandidateList(vicePresidentListEl, candidates, false);
      applySharedSelectionFromUrl();
      renderChart();
      renderComboGrid();
      renderComboLoyalists();
      initMap();
      renderPieChart();
      startSocialProofFeed();
      debugLog("init", "Initialization complete.", {
        candidates: candidates.length,
        combosWithVotes: Object.entries(votesData).filter(([, count]) => count > 0).length,
        mapRows: mapStatesData.length
      });
    }
    // --- Run Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
      registerServiceWorker();
      init();
    });

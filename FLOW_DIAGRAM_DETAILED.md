# Paperify - Complete Flow Diagram

## 🎯 Payment & Book Selection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER VISITS HOMEPAGE                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CLICKS "MONTHLY SPECIFIC" (PKR 900)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Logged In?   │
                  └──────┬───────┘
                         │
            ┌────────────┴────────────┐
            │                         │
           NO                        YES
            │                         │
            ▼                         ▼
    ┌───────────────┐         ┌──────────────────┐
    │  LOGIN MODAL  │         │  BOOK SELECTION  │
    │  - Email      │         │     MODAL        │
    │  - Password   │         │                  │
    │  - Google     │         │  📚 Class 9      │
    └───────┬───────┘         │  ☐ Biology       │
            │                 │  ☐ Chemistry     │
            │                 │  ☐ Physics       │
            └────────────────>│  ☐ Comp Science  │
                              │                  │
                              │  📚 Class 11-Sci │
                              │  ☐ Biology       │
                              │  ☐ Chemistry     │
                              │  ☐ Physics       │
                              │  ☐ Mathematics   │
                              │  ☐ Comp Science  │
                              │  ☐ English       │
                              │                  │
                              │  📚 Class 11-Arts│
                              │  ☐ Civics        │
                              │  ☐ Food & Nutri  │
                              │  ☐ Gen Math      │
                              │  ☐ Gen Science   │
                              │  ☐ Home Econ     │
                              │  ☐ Pak Studies   │
                              │  ☐ Phy Education │
                              │  ☐ Poultry Farm  │
                              │                  │
                              │  📚 Class 12-Sci │
                              │  (Same as 11)    │
                              │                  │
                              │  📚 Class 12-Arts│
                              │  (Same as 11)    │
                              │                  │
                              │  [Continue]      │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  PAYMENT MODAL  │
                              │                 │
                              │  Plan: Monthly  │
                              │  Amount: 900    │
                              │  Book: Selected │
                              │                 │
                              │  Pay to:        │
                              │  0344 8007154   │
                              │                 │
                              │  Transaction ID │
                              │  Screenshot     │
                              │                 │
                              │  [Submit]       │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ PAYMENT PENDING │
                              │ (24hr verify)   │
                              └─────────────────┘
```

---

## 📝 Paper Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│              USER CLICKS "GENERATE PAPER"                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SELECT BOARD                               │
│  ○ Punjab Board  ○ Sindh Board  ○ Federal Board            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SELECT CLASS                               │
│  ○ Class 9  ○ Class 11  ○ Class 12                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SELECT GROUP (if 11/12)                    │
│  ○ Science  ○ Arts                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   BOOKS PAGE                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Biology    │  │  Chemistry   │  │   Physics    │     │
│  │              │  │              │  │              │     │
│  │  [Configure] │  │  [Configure] │  │  [Configure] │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  Note: Only shows books from user's subscription           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CLICK ON A BOOK (e.g., Biology)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  CHAPTER SELECTION MODAL                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Select Chapters                              [X]  │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  ☐ Chapter 1: Cell Structure      [Topics]        │    │
│  │  ☐ Chapter 2: Cell Division       [Topics]        │    │
│  │  ☐ Chapter 3: Biodiversity         [Topics]        │    │
│  │  ☐ Chapter 4: Bioenergetics       [Topics]        │    │
│  │                                                     │    │
│  │  [Select All]                          [Done]      │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CLICK "TOPICS" BUTTON                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  TOPICS SELECTION MODAL                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Topics: Cell Structure                       [X]  │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  ☐ Nucleus (BLACK)              [ACTIVE ✓]        │    │
│  │  ☐ Mitochondria (BLACK)         [ACTIVE ✓]        │    │
│  │  ☐ Cell Membrane (BLACK)        [ACTIVE ✓]        │    │
│  │  ☐ Endoplasmic Reticulum (RED)  [NONACTIVE ✗]     │    │
│  │  ☐ Golgi Apparatus (BLACK)      [ACTIVE ✓]        │    │
│  │  ☐ Lysosomes (RED)              [NONACTIVE ✗]     │    │
│  │                                                     │    │
│  │  [Select All]                   [Save Topics]      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Legend:                                                    │
│  • BLACK text = Active topic (available)                   │
│  • RED text = Inactive topic (not available)               │
│  • Green badge = Active status                             │
│  • Red badge = Inactive status                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              USER SELECTS TOPICS                             │
│  ✓ Nucleus                                                  │
│  ✓ Mitochondria                                             │
│  ✓ Cell Membrane                                            │
│  ✓ Golgi Apparatus                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CLICK "SAVE TOPICS"                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BACK TO CHAPTER MODAL                           │
│  ✓ Chapter 1: Cell Structure      [Topics] ← 4 selected    │
│  ☐ Chapter 2: Cell Division       [Topics]                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              REPEAT FOR OTHER CHAPTERS                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CLICK "DONE"                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BACK TO BOOKS PAGE                              │
│  Biology: 3 chapters selected                               │
│  [Proceed to Questions →]                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              QUESTIONS CONFIGURATION PAGE                    │
│  • Select question types (MCQs, Short, Long)               │
│  • Set number of questions                                  │
│  • Choose language (English/Urdu)                           │
│  • Upload logo (optional)                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              GENERATE PAPER                                  │
│  Paper generated with:                                      │
│  • Selected chapters                                        │
│  • Selected topics only                                     │
│  • Specified question types                                 │
│  • Custom branding                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
User Selection
    ↓
┌─────────────────────────────────┐
│  selectedChapters = {           │
│    "Biology": [                 │
│      {                          │
│        title: "Cell Structure", │
│        topics: [                │
│          "Nucleus",             │
│          "Mitochondria",        │
│          "Cell Membrane",       │
│          "Golgi Apparatus"      │
│        ]                        │
│      },                         │
│      {                          │
│        title: "Cell Division",  │
│        topics: []               │
│      }                          │
│    ]                            │
│  }                              │
└─────────────────────────────────┘
    ↓
Sent to Questions Page
    ↓
Paper Generation Engine
    ↓
Generated Paper (PDF/Print)
```

---

## 🎨 Color Coding System

```
┌──────────────────────────────────────┐
│  TOPIC STATUS INDICATORS             │
├──────────────────────────────────────┤
│                                      │
│  ✅ ACTIVE TOPICS:                   │
│     • Text Color: BLACK (#000000)   │
│     • Badge: Green background       │
│     • Badge Text: "ACTIVE"          │
│     • Meaning: Available for paper  │
│                                      │
│  ❌ INACTIVE TOPICS:                 │
│     • Text Color: RED (#ef4444)     │
│     • Badge: Red background         │
│     • Badge Text: "NONACTIVE"       │
│     • Meaning: Not available        │
│                                      │
└──────────────────────────────────────┘
```

---

## 📊 Subscription Logic

```
┌─────────────────────────────────────────────────────────────┐
│                  SUBSCRIPTION FILTERING                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  IF user has "monthly_specific" plan:                      │
│    IF books array is empty:                                │
│      → Show ALL books                                      │
│      → Prompt to lock 1 book                               │
│    ELSE:                                                    │
│      → Show ONLY selected book                             │
│                                                             │
│  IF user has "weekly_unlimited" plan:                      │
│    → Show ALL books                                        │
│    → No restrictions                                       │
│                                                             │
│  IF user has "monthly_unlimited" plan:                     │
│    → Show ALL books                                        │
│    → No restrictions                                       │
│                                                             │
│  IF user has NO subscription:                              │
│    → Show ALL books (demo mode)                            │
│    → Limit: 2 free papers                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Created**: Today
**Version**: 2.0
**Status**: ✅ Complete

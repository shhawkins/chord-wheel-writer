# Backend Options Research

## Objective
Enable users to:
1.  **Create Accounts / Login**: Frictionless OAuth (Google, Apple, etc.).
2.  **Save Songs**: Store song data (JSON) in the cloud.
3.  **Upload Samples**: Store custom instrument audio files in the cloud.

## Constraints
*   **Cost**: Ideally $0.
*   **Maintenance**: Easy to maintain.
*   **Storage**: Samples shouldn't take up too much space.

## Comparison: Firebase vs. Supabase

The two leading "Backend-as-a-Service" platforms for React apps are Firebase (Google) and Supabase (Open Source).

### 1. Supabase (Recommended for "Strictly Free")
*   **Database**: PostgreSQL (Structured data, very powerful).
*   **Auth**: Built-in support for Google, Apple, GitHub, etc.
*   **Storage**: S3-compatible file storage.
*   **Free Tier Limits**:
    *   **Database**: 500MB (Plenty for saving songs/JSON).
    *   **Storage**: 1GB (Approx. 200-300 full length songs in MP3, or thousands of short instrument samples).
    *   **Bandwidth**: 2GB/month.
    *   **Active Users**: 50,000 monthly active users.
    *   **Requirements**: **No Credit Card required**.
*   **Pros**:
    *   Truly free start.
    *   Relational database is great for structured user data.
    *   Open source (no vendor lock-in).
*   **Cons**:
    *   Storage limit (1GB) is lower than Firebase's potential free usage.
    *   Realtime features (sockets) are available but slightly different API than Firebase.

### 2. Firebase (Google)
*   **Database**: Firestore (NoSQL Document Store).
*   **Auth**: Excellent, industry standard.
*   **Storage**: Google Cloud Storage.
*   **Pricing Changes (Critical)**:
    *   As of late 2024, **new Storage buckets require the Blaze (Pay-as-you-go) plan**.
    *   While the Blaze plan has a generous free allowance (5GB storage, 1GB/day downloads), it **requires entering a Credit Card**.
    *   If you stay within limits, you pay $0, but the card is mandatory.
*   **Pros**:
    *   Higher storage limit (5GB) if you enter a card.
    *   Deep integration with Google auth.
*   **Cons**:
    *   **Requires Credit Card**.
    *   NoSQL data modeling can sometimes be tricky for relational data (though fine for generic "song" blobs).

## Strategy for "Cloud Instruments"
Regardless of the provider, storing audio is the most reliable way to hit limits. To ensure the "Free" tier lasts:

1.  **Compression**:
    *   Do not upload WAV files directly.
    *   Convert audio to **WebM** or **MP3** client-side (in the browser) before uploading.
    *   *Example*: A 4MB WAV sample becomes ~400KB in MP3.
    
2.  **Quotas**:
    *   Limit users to a certain number of custom instruments (e.g., 3 custom kits).
    *   Limit file size per sample (e.g., max 2MB).

## Recommendation

**Go with Supabase** if:
1.  You want to avoid entering a credit card at all costs.
2.  You prefer SQL / Table-based data management.

**Go with Firebase** if:
1.  You are comfortable putting a credit card on file (with $0 spend limits/alerts).
2.  You expect to need more than 1GB of storage immediately.

### Proposed Implementation Plan (Supabase)
1.  **Setup**: Initialize Supabase project.
2.  **Auth**: Add `<AuthButton />` using Supabase Auth UI (supports Google/Apple).
3.  **Database**: Create tables: `profiles`, `songs`, `instruments`, `samples`.
4.  **Storage**: Create a `samples` bucket with Row Level Security (RLS) policies (users can only edit their own files).
5.  **Integration**: Update `InstrumentManager` to fetch/upload from Supabase Storage.

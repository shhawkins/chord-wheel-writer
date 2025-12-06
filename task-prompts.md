# Chord Wheel Writer - AI Agent Task Prompts

This document contains granular task prompts for AI agents working on fixing and improving the Chord Wheel Writer application. Each prompt is self-contained and designed to produce high-quality, focused work.

---

## Task 1: Fix the Wheel Ring Order

### Context
The current chord wheel has rings in the wrong order. Looking at the physical Chord Wheel (Jim Fleser/Hal Leonard):
- **Innermost ring** should contain the MAJOR chords (I, IV, V)
- **Middle ring** should contain the MINOR chords (ii, iii, vi)
- **Outermost notch** should contain the DIMINISHED chord (vii°)

The current implementation has this reversed, with major chords on the outside.

### Your Task
Modify `/Users/sam/chord-wheel-writer/src/components/wheel/ChordWheel.tsx` to correct the ring order:

1. The **inner ring** (closest to center) should display major chords
2. The **middle ring** should display minor chords  
3. The **outer ring/notch** should display diminished chords

### Implementation Details
- Look at the current radius values: `outerRadius = 280`, `midRadius = 220`, `innerRadius = 160`, `centerRadius = 80`
- The major chord ring should use radii between `centerRadius` and a new `majorOuterRadius`
- The minor chord ring should be the next band out
- The diminished notch should be the outermost small band

### Reference
See the physical wheel image at `/Users/sam/chord-wheel-writer/chord wheel.jpg` - notice how the major chords (C, F, G) are in the inner colored band closest to the center "KEY" indicator, while the diminished (B°) is in the small outer notch.

### Expected Outcome
When viewing the wheel, major chords appear in the inner ring, minor chords in the middle ring, and diminished chords in the outer notches.

---

## Task 2: Fix the Chord Position Mapping

### Context
Each of the 12 "pie slice" segments on the wheel represents a key center in Circle of Fifths order. The current code incorrectly calculates which chords appear in each position.

### Your Task
Modify `/Users/sam/chord-wheel-writer/src/utils/musicTheory.ts` to add correct wheel position data:

1. Create a `WHEEL_POSITIONS` constant that maps each of the 12 positions to:
   - The major chord at that position (C, G, D, A, E, B, F#, Db, Ab, Eb, Bb, F)
   - The relative minor chord (Am, Em, Bm, F#m, C#m, G#m, D#m, Bbm, Fm, Cm, Gm, Dm)
   - The diminished chord (leading tone of that major key)

2. Create a function `getWheelPositionChords(positionIndex: number)` that returns the three chords for any wheel position.

### Implementation Details
```typescript
// The relationship for each position:
// Position 0 (top): C major → Am (relative minor) → B° (diminished on 7th degree of C)
// Position 1: G major → Em → F#°
// Position 2: D major → Bm → C#°
// etc.
```

### Key Insight
The relative minor is always the vi chord of that major key (3 semitones below the major root).
The diminished is always the vii° chord (1 semitone below the major root).

### Expected Outcome
A function that accurately returns the correct 3 chords for any wheel position.

---

## Task 3: Implement the Diatonic Highlight System

### Context
When a key is selected, 7 chords should be highlighted as "diatonic" (belonging to that key). On the physical wheel, this is shown by a triangular overlay that spans multiple pie slices to highlight I, ii, iii, IV, V, vi, and vii°.

### Your Task
Create a function in `/Users/sam/chord-wheel-writer/src/utils/musicTheory.ts` that calculates which wheel segments should be highlighted for any selected key:

```typescript
interface DiatonicHighlight {
  wheelPosition: number;  // 0-11 (index in CIRCLE_OF_FIFTHS)
  ring: 'major' | 'minor' | 'diminished';
  numeral: string;  // 'I', 'ii', 'iii', etc.
}

function getDiatonicHighlights(key: string): DiatonicHighlight[]
```

### Implementation Details
For the key of C, the function should return:
- `{ wheelPosition: 0, ring: 'major', numeral: 'I' }` (C at position 0)
- `{ wheelPosition: 11, ring: 'minor', numeral: 'ii' }` (Dm at position 11, where F is)
- `{ wheelPosition: 0, ring: 'minor', numeral: 'iii' }` (Em at position 0... wait no)

Actually, you need to find where each diatonic chord APPEARS on the wheel:
- C (I) is the major chord at position 0
- Dm (ii) is the relative minor at position 11 (F's position, since Dm is relative minor of F)
- Em (iii) is the relative minor at position 1 (G's position)
- F (IV) is the major chord at position 11
- G (V) is the major chord at position 1
- Am (vi) is the relative minor at position 0 (C's position)
- B° (vii°) is the diminished at position 0 (C's position)

### Expected Outcome
A function that correctly identifies all 7 wheel segment/ring combinations to highlight for any key.

---

## Task 4: Rebuild the Triangular Overlay SVG

### Context
The current overlay is a simple arc. The physical chord wheel uses a **triangular outline** that highlights the diatonic chord positions. This triangle spans from roughly the 10 o'clock position, through 12 o'clock (the key), to the 2 o'clock position.

### Your Task
Modify `/Users/sam/chord-wheel-writer/src/components/wheel/ChordWheel.tsx` to create an SVG path that forms the proper triangular outline:

1. The overlay should be a closed path that:
   - Starts at the outer edge near the IV chord position
   - Arcs around the outside of the diminished notch
   - Goes to the V chord position
   - Connects down through the minor ring
   - Back around to complete the triangle

2. The overlay should NOT rotate with the wheel - it stays fixed at the top while the wheel rotates beneath it.

### Implementation Details
Look at the overlay SVG in `ChordWheel.tsx` lines 214-230. Replace the current arc-based path with a proper triangular outline.

The triangle needs to encompass:
- 3 segments of the outer (diminished) ring
- 3 segments of the middle (minor) ring  
- 3 segments of the inner (major) ring

### Reference
See `/Users/sam/chord-wheel-writer/chord wheel info/chord wheel info 3.jpg` which shows the triangular outline clearly - it's the bold black border that shows which chords are "in key".

### Expected Outcome
A triangular overlay that properly frames the 7 diatonic chord positions.

---

## Task 5: Add Key Signature Display to Wheel Center

### Context
The physical chord wheel shows the key signature (number of sharps or flats) in the center. The current implementation has a basic center but lacks proper key signature display.

### Your Task
Enhance the center circle in `/Users/sam/chord-wheel-writer/src/components/wheel/ChordWheel.tsx`:

1. Display "KEY" label
2. Show the current key name prominently
3. Show key signature (e.g., "2♯" for D major, "3♭" for Eb major)
4. Optionally: Add dominant (clockwise) and subdominant (counter-clockwise) direction indicators

### Implementation Details
Use the existing `getKeySignature()` function in musicTheory.ts to get sharps/flats count.

Format the display as:
```
[KEY]
  D
 2♯
```

Use Unicode characters for sharps (♯ = \u266F) and flats (♭ = \u266D).

### Expected Outcome
The wheel center clearly displays the current key and its key signature.

---

## Task 6: Fix Chord Note Calculation for Audio

### Context
When chords are clicked, they should play the correct notes. Currently, the `notes: []` array in chord objects is often empty or incorrect.

### Your Task
Ensure `/Users/sam/chord-wheel-writer/src/utils/musicTheory.ts` correctly populates chord notes:

1. Fix `getChordNotes()` to handle all chord qualities
2. Ensure notes use proper enharmonic spellings (e.g., Bb not A#) for flat keys
3. Update `ChordWheel.tsx` to properly populate the `notes` array when creating chord objects

### Implementation Details
When creating chord objects in ChordWheel.tsx:
```typescript
const majorChord: Chord = {
  root,
  quality: 'major',
  numeral: 'I',
  notes: getChordNotes(root, 'major'),  // This should return ['C', 'E', 'G'] for C
  symbol: root
};
```

### Expected Outcome
Clicking any chord plays the correct notes in proper voicing.

---

## Task 7: Add Ring Extension Labels

### Context
The physical chord wheel shows what chord extensions are commonly used for each ring:
- Major chords (I, IV): "maj7, maj9, maj11, maj13 or 6"
- Minor chords (ii, iii, vi): "m7, m9, m11, m13"
- Dominant (V): "7, 9, 11, sus4, 13"
- Diminished (vii°): "m7♭5 (ø7)"

### Your Task
Add these labels to the wheel visualization in `/Users/sam/chord-wheel-writer/src/components/wheel/ChordWheel.tsx`:

1. Add curved text along each ring showing the extension types
2. Position the text so it doesn't interfere with chord names
3. Use a smaller, muted font color

### Implementation Details
This will require adding SVG `<text>` elements with `<textPath>` to follow curved paths, or using rotated text positioned at specific angles.

Consider adding the labels only in one section (the "key" section at top) rather than repeating them for all 12 segments.

### Expected Outcome
Users can see at a glance what extensions work with each chord type.

---

## Task 8: Implement Chord Variant Selection

### Context
Currently, clicking a chord adds the basic triad. Musicians often need seventh chords and other variants.

### Your Task
Add a chord variant selection system:

1. When a chord is clicked, show a small popup with variant options
2. Options should include: basic triad, maj7, m7, 7, sus2, sus4, add9
3. Selecting a variant adds that chord to the timeline

### Implementation Details
You can use a simple dropdown/popover that appears near the clicked segment. Store the selected variant in the chord object's `quality` field.

Consider using long-press or right-click for variant selection, with regular click adding the basic triad for speed.

### Expected Outcome
Users can quickly add chord variants directly from the wheel.

---

## Task 9: Fix Roman Numeral Toggle Display

### Context
There's a `showRomanNumerals` toggle in the store, but the current implementation doesn't properly show numerals for all chord types and doesn't account for the chord's position within the key.

### Your Task
Fix the roman numeral display in `/Users/sam/chord-wheel-writer/src/components/wheel/ChordWheel.tsx`:

1. When `showRomanNumerals` is true, show "I", "ii", "iii", "IV", "V", "vi", "vii°" instead of chord names
2. Only show numerals for chords that are diatonic to the current key
3. Non-diatonic chords should still show their chord name

### Implementation Details
Use the `getDiatonicHighlights()` function from Task 3 to determine which segments should show numerals and what those numerals should be.

### Expected Outcome
Users can toggle between chord names (C, Dm, Em...) and roman numerals (I, ii, iii...) for diatonic chords.

---

## Task 10: Improve Visual Feedback for Diatonic vs Non-Diatonic

### Context
The current implementation uses opacity to differentiate diatonic (in-key) chords from non-diatonic chords. This could be enhanced.

### Your Task
Improve the visual distinction in `/Users/sam/chord-wheel-writer/src/components/wheel/WheelSegment.tsx`:

1. Diatonic chords: Full color, full opacity, slightly larger text
2. Non-diatonic chords: Desaturated color, 40% opacity, smaller text
3. Add a subtle border or glow to diatonic chords
4. Ensure text remains readable on both states

### Implementation Details
Consider using CSS filters like `saturate(0.3)` for non-diatonic chords instead of just opacity.

### Expected Outcome
It's immediately visually clear which chords belong to the current key.

---

## Task 11: Sync Wheel Rotation with Key Changes

### Context
When the wheel rotates, the key should change. When the key is selected directly (e.g., from a dropdown), the wheel should rotate to match.

### Your Task
Ensure bidirectional sync between wheel rotation and key selection:

1. Rotating the wheel clockwise should move to the next key in the Circle of Fifths (C→G→D...)
2. Selecting a key directly should rotate the wheel to put that key at 12 o'clock
3. Animation should be smooth (the current 0.5s cubic-bezier is good)

### Implementation Details
The current implementation in `handleRotate()` attempts this but may have calculation issues. Verify:
- One full rotation (360°) = 12 key changes
- Each 30° rotation = 1 key change
- Clockwise rotation goes up in fifths (C→G→D...)
- Counter-clockwise goes down in fifths (C→F→Bb...)

### Expected Outcome
Wheel position always matches the displayed key.

---

## Task 12: Add Chord Playback on Wheel Hover

### Context
Currently, chords only play when clicked. For faster exploration, users should hear chords on hover (with a slight delay).

### Your Task
Add hover-to-preview functionality:

1. When hovering over a chord segment for more than 300ms, play a preview
2. The preview should be quieter than a click
3. Add a visual indicator (subtle highlight) during preview
4. Ensure this doesn't interfere with click-to-add functionality

### Implementation Details
Use `setTimeout` with cleanup in `onMouseEnter`/`onMouseLeave` handlers. Store a ref to the timeout to cancel it if the user moves away quickly.

Modify `playChord()` in audioEngine.ts to accept a volume parameter.

### Expected Outcome
Users can hover around the wheel to hear how different chords sound.

---

## Task 13: Fix Piano Keyboard Highlighting

### Context
The `PianoKeyboard` component in the details panel highlights chord notes, but the highlighting may not work correctly for all chords, especially those with sharps/flats.

### Your Task
Review and fix `/Users/sam/chord-wheel-writer/src/components/panel/PianoKeyboard.tsx`:

1. Ensure sharps are properly detected (C#, D#, F#, G#, A#)
2. Handle enharmonic equivalents (Db should highlight the same key as C#)
3. Verify the visual highlighting spans the correct octaves
4. Root note should have a distinct marker

### Implementation Details
The current `getIsHighlighted()` function does simple string matching. It needs to handle enharmonics:
```typescript
const getIsHighlighted = (note: string) => {
  return highlightedNotes.some(n => 
    normalizeNote(n) === normalizeNote(note)
  );
};
```

### Expected Outcome
The piano keyboard correctly highlights all chord notes regardless of spelling.

---

## Task 14: Add Wheel Color Accuracy

### Context
The physical chord wheel has specific colors for each key that create a rainbow spectrum around the circle. The current colors are approximations.

### Your Task
Update `/Users/sam/chord-wheel-writer/src/utils/musicTheory.ts` `getWheelColors()` to better match the physical wheel:

1. Reference the image at `/Users/sam/chord-wheel-writer/chord wheel.jpg`
2. C should be bright yellow
3. Progress through yellow-green → green → teal → cyan → blue → violet → purple → magenta → red → orange back to yellow

### Implementation Details
Use HSL colors for easier adjustment:
```typescript
C: 'hsl(48, 95%, 55%)',   // Bright yellow
G: 'hsl(75, 70%, 50%)',   // Yellow-green
D: 'hsl(110, 60%, 45%)',  // Green
// etc.
```

### Expected Outcome
The digital wheel's colors closely match the physical Hal Leonard chord wheel.

---

## Task 15: Implement Section Lyrics/Notes

### Context
The `Section` type has an optional `lyrics` field, but there's no UI to view or edit it.

### Your Task
Add lyrics/notes functionality to timeline sections:

1. Add an expandable text area below each section for lyrics
2. Auto-save as the user types
3. Include lyrics in PDF export
4. Keep UI clean when lyrics are empty

### Implementation Details
Modify `/Users/sam/chord-wheel-writer/src/components/timeline/Section.tsx` to include a collapsible lyrics panel.

Update the export in `App.tsx` to include lyrics below chord lines.

### Expected Outcome
Users can add lyrics/notes to sections and see them in exported chord sheets.

---

## Task 16: Implement True Playback

### Context
The playback controls exist but pressing play doesn't actually play through the progression. It just toggles a state.

### Your Task
Implement actual sequential playback:

1. When play is pressed, iterate through all chords in timeline order
2. Play each chord for its designated duration based on tempo
3. Highlight the currently playing chord in the timeline
4. Respect tempo setting (BPM)
5. Stop cleanly when pause is pressed or song ends

### Implementation Details
Create a playback engine using `Tone.Transport` for timing:
```typescript
const playProgression = async () => {
  Tone.Transport.bpm.value = tempo;
  // Schedule chord events...
  Tone.Transport.start();
};
```

### Expected Outcome
Users can hear their chord progression played back in time.

---

## Task 17: Center the Middle Ring Minor Chords

### Context
The middle ring containing minor chords (ii, iii, vi) is not properly centered relative to the inner ring major chords. For instance, Em (iii) should be exactly centered above C when C is the key, but it appears slightly offset.

### Your Task
Fix the angular positioning of the middle ring segments in `/Users/sam/chord-wheel-writer/src/components/wheel/ChordWheel.tsx`:

1. The iii chord should be **exactly centered** above its corresponding I chord
2. The ii chord should be centered between the IV and I positions
3. The vi chord should be centered between the I and V positions
4. This likely requires shifting the minor ring a few degrees counter-clockwise

### Implementation Details
Currently the minor segments use:
```typescript
const iiStartAngle = majorStartAngle;
const iiiStartAngle = iiEndAngle;
```

The fix may involve adding an offset:
```typescript
const minorOffset = -7.5; // Adjust this value
const iiStartAngle = majorStartAngle + minorOffset;
```

Test by selecting C major and verifying Em appears directly above C, not shifted to one side.

### Expected Outcome
When viewing any key, the iii minor chord is perfectly centered above the I major chord.

---

## Task 18: Fix Chord Viewer Width and Add Hide Button

### Context
The ChordDetails panel on the right side changes width when different chords are selected, causing layout shifts. It should maintain a fixed width for visual stability.

### Your Task
Modify `/Users/sam/chord-wheel-writer/src/components/panel/ChordDetails.tsx`:

1. Set a fixed width (e.g., `w-72` or `288px`) that doesn't change regardless of chord content
2. Add a toggle button to show/hide the entire chord viewer panel
3. When hidden, the chord wheel should expand to fill the available space
4. Remember the hide/show state in the store or localStorage

### Implementation Details
Add a collapse button in the header:
```typescript
<button onClick={toggleChordPanel} className="p-1 hover:bg-gray-700 rounded">
  {isPanelVisible ? <ChevronRight /> : <ChevronLeft />}
</button>
```

Update the parent layout in `App.tsx` to conditionally render the panel.

### Expected Outcome
The chord viewer has consistent width and can be collapsed to maximize wheel space.

---

## Task 19: Fix Chord Variations Playback and Display

### Context
The chord variations section in the ChordDetails panel shows variant options (maj7, m7, 7, etc.) but clicking them doesn't play the variation or update the displayed notes.

### Your Task
Enhance the chord variations functionality in `/Users/sam/chord-wheel-writer/src/components/panel/ChordDetails.tsx`:

1. When a variation is clicked, **play the chord variation** using the audio engine
2. Update the **piano keyboard** to highlight the variation's notes
3. Update the **notes display** to show the variation's notes
4. Add visual feedback for which variation is currently previewing
5. Optionally: Allow adding the variation directly to the timeline

### Implementation Details
Each variation button should:
```typescript
const handleVariationClick = (variant: string) => {
  const variantNotes = getChordNotes(selectedChord.root, variant);
  playChord(variantNotes);
  setPreviewNotes(variantNotes); // Temporarily show these on the keyboard
};
```

The piano keyboard should accept either `selectedChord.notes` or `previewNotes` for highlighting.

### Expected Outcome
Clicking a chord variation plays its sound and shows its notes on the keyboard and in text.

---

## Task 20: Fix Chord Label Orientation (Upside-Down Text)

### Context
As the wheel rotates, some chord labels appear upside down when they reach the top position. Letters should always be in a readable orientation regardless of wheel position.

### Your Task
Fix the text rotation logic in `/Users/sam/chord-wheel-writer/src/components/wheel/WheelSegment.tsx`:

1. Calculate text rotation so labels are **always right-side up**
2. Account for the wheel's current rotation when calculating text angle
3. Labels in the bottom half of the wheel should flip 180° to remain readable
4. This requires knowing the wheel's current rotation angle

### Implementation Details
The text rotation should be based on the absolute screen position, not just the segment's local angle:

```typescript
// Calculate absolute angle after wheel rotation
const absoluteAngle = midAngle + wheelRotation;
const normalizedAngle = ((absoluteAngle % 360) + 360) % 360;

// Flip text if it would appear upside down
let textRotation = midAngle;
if (normalizedAngle > 90 && normalizedAngle < 270) {
  textRotation += 180;
}
```

Pass `wheelRotation` as a prop to WheelSegment.

### Expected Outcome
All chord labels are readable (right-side up) regardless of wheel position.

---

## Task 21: Add Fixed Wheel View Mode

### Context
Currently the wheel rotates and the highlighted diatonic chords always appear at the top. Some users may prefer a fixed wheel where the wheel doesn't spin, but the highlights move around to show the new key's diatonic chords.

### Your Task
Implement two view modes:

**Mode 1 - Rotating Wheel (current behavior):**
- Wheel spins when key changes
- In-key chords always appear at the top
- Triangle overlay stays fixed

**Mode 2 - Fixed Wheel:**
- Wheel stays stationary (C always at top)
- When key changes, highlighting moves to different positions
- No letter orientation issues since wheel doesn't rotate

### Implementation Details
1. Add `wheelMode: 'rotating' | 'fixed'` to the store
2. Add a toggle button in the UI to switch modes
3. In fixed mode, set `calculatedRotation = 0` and update highlighting logic to highlight the correct positions for the selected key without rotation

```typescript
// In fixed mode, find where each diatonic chord appears on the static wheel
const getDiatonicPositionsForFixedWheel = (key: string) => {
  // Return positions of I, ii, iii, IV, V, vi, vii° on the static wheel
};
```

### Expected Outcome
Users can choose between a rotating wheel (key at top) or a fixed wheel (C at top with moving highlights).

---

## Task 22: Add Keyboard Shortcut to Delete Chords

### Context
Currently there's no way to quickly delete a chord from the timeline. Users should be able to select a chord and press Delete or Backspace to remove it.

### Your Task
Add keyboard shortcut functionality for chord deletion:

1. When a chord slot is selected (clicked), it should have visual focus
2. Pressing Delete or Backspace should remove the chord from that slot
3. The selection should move to the next slot (or previous if at end)
4. Add this keyboard listener at the App level or in the Timeline component

### Implementation Details
Add a keyboard event listener:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSlotId) {
      e.preventDefault();
      removeChordFromSlot(selectedSectionId, selectedSlotId);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedSlotId, selectedSectionId]);
```

Ensure this doesn't interfere with text input fields.

### Expected Outcome
Users can select a chord slot and press Delete to clear it.

---

## Task 23: Add Song Title with PDF Display

### Context
Songs currently have no title. Users should be able to name their song, and that name should appear prominently on the exported PDF chord sheet.

### Your Task
Add song title functionality:

1. Add a `title: string` field to the `Song` type in the store
2. Add an editable title input at the top of the app (above the timeline)
3. Default to "Untitled Song" or similar
4. In PDF export, render the title in bold at the top of the document
5. Use a larger font size (e.g., 24pt) and center alignment for the title

### Implementation Details
In `App.tsx`, add a title input:
```typescript
<input
  type="text"
  value={currentSong.title}
  onChange={(e) => setSongTitle(e.target.value)}
  placeholder="Song Title"
  className="text-2xl font-bold bg-transparent border-none focus:outline-none"
/>
```

In the PDF export, add the title:
```typescript
doc.setFontSize(24);
doc.setFont('helvetica', 'bold');
doc.text(song.title, pageWidth / 2, 20, { align: 'center' });
```

### Expected Outcome
Songs have an editable title that appears on the PDF export.

---

## Task 24: Add Custom Section Names

### Context
Sections currently have fixed names like "Verse", "Chorus", "Bridge". Users should be able to customize these names (e.g., "Prechorus Short", "Verse 2", "Outro Tag").

### Your Task
Make section names editable:

1. Change the section name display to an inline-editable text field
2. Allow any custom text (reasonable max length ~30 chars)
3. Keep the dropdown for quick selection of common names
4. Save custom names with the song

### Implementation Details
In `/Users/sam/chord-wheel-writer/src/components/timeline/Section.tsx`:

```typescript
const [isEditing, setIsEditing] = useState(false);

{isEditing ? (
  <input
    type="text"
    value={section.name}
    onChange={(e) => updateSectionName(section.id, e.target.value)}
    onBlur={() => setIsEditing(false)}
    autoFocus
    maxLength={30}
  />
) : (
  <span onDoubleClick={() => setIsEditing(true)}>{section.name}</span>
)}
```

### Expected Outcome
Users can double-click a section name to edit it to any custom text.

---

## Task 25: Fix Theory Note Styling (Cutoff Text)

### Context
The "Theory Note" section at the bottom of the ChordDetails panel is getting cut off and is not fully readable. The styling needs to be fixed.

### Your Task
Fix the Theory Note display in `/Users/sam/chord-wheel-writer/src/components/panel/ChordDetails.tsx`:

1. Ensure the Theory Note section is fully visible and not clipped
2. Add proper padding and margins
3. Make the text scrollable if it exceeds available space
4. Consider using a distinct visual style (card, border, background color)
5. Ensure the font size is readable

### Implementation Details
Wrap the Theory Note in a properly styled container:
```typescript
<div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
  <h4 className="text-sm font-semibold text-indigo-400 mb-2">Theory Note</h4>
  <p className="text-sm text-gray-300 leading-relaxed">
    {theoryNote}
  </p>
</div>
```

Ensure the parent container has `overflow-y-auto` if needed.

### Expected Outcome
The Theory Note is fully visible with proper styling and readability.

---

## Task 26: Create FAQ Explaining Chord Wheel Concepts

### Context
New users may not understand how to use the chord wheel or what the various elements mean. The app needs an FAQ or help section explaining the concepts shown in the chord wheel info images.

### Your Task
Create an FAQ/Help component:

1. Add a help button (? icon) in the header that opens a modal or sidebar
2. Explain key concepts with sections:
   - What is the Circle of Fifths?
   - How to read the chord wheel
   - What are diatonic chords?
   - Understanding Roman numerals (I, ii, iii, IV, V, vi, vii°)
   - Chord extensions (7ths, 9ths, etc.)
   - Using secondary dominants (II, III)
   - Common chord progressions

### Implementation Details
Reference the chord wheel info images for content:
- `/Users/sam/chord-wheel-writer/chord wheel info/chord wheel info 1.jpg` through `6.jpg`

Create a component like:
```typescript
export const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ...
```

Use accordions or tabs to organize the content for easy navigation.

### Expected Outcome
Users can access comprehensive help explaining how to use the chord wheel.

---

## Task 27: Implement Rich Theory Notes

### Context
The Theory Note section should provide useful, context-specific music theory tips based on the selected chord and key. This requires researching and implementing a comprehensive set of theory notes.

### Your Task
Create a rich theory notes system:

1. Research common music theory tips for each chord type and function
2. Create a data structure mapping chords/contexts to theory notes
3. Notes should cover:
   - Common progressions using this chord
   - Voice leading tips
   - Substitution suggestions
   - Function in the key (tonic, subdominant, dominant)
   - Typical song sections where this chord appears
4. Show relevant notes based on the selected chord AND its function in the current key

### Implementation Details
Create a theory notes database:
```typescript
// In musicTheory.ts
export const THEORY_NOTES: Record<string, Record<string, string>> = {
  'I': {
    general: "The tonic chord - home base. Most songs begin and end here.",
    progressions: "Try I → IV → V → I (classic), I → V → vi → IV (pop)",
    voiceLeading: "Resolve the 7th down to the 3rd of the IV chord."
  },
  'ii': {
    general: "The supertonic - often precedes V in the ii-V-I progression.",
    progressions: "ii → V → I is fundamental in jazz and pop.",
  },
  // ... etc
};
```

### Expected Outcome
Each chord displays relevant, educational theory tips based on its function.

---

## Task 28: Add Suggested Scales Module

### Context
Musicians often need to know what scales to play over a chord progression. The app should analyze the chords in the timeline and suggest appropriate scales.

### Your Task
Create a Suggested Scales feature:

1. Add a new panel or section that analyzes the timeline chords
2. Suggest scales that work over the progression:
   - The parent key's major/minor scale
   - Modal options (e.g., F Lydian instead of C major over F chord)
   - Pentatonic options
3. Provide explanations for why each scale works
4. Update suggestions in real-time as chords are added/removed

### Implementation Details
Create a scale analysis function:
```typescript
interface ScaleSuggestion {
  name: string;           // "C Major"
  notes: string[];        // ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  applicability: string;  // "Works over entire progression"
  explanation: string;    // "All chords are diatonic to C major"
}

function analyzeChordProgressionScales(chords: Chord[], key: string): ScaleSuggestion[]
```

Consider chord-by-chord suggestions as well:
- "Over Dm, try D Dorian (emphasis on B natural)"
- "Over G, try G Mixolydian for dominant sound"

### Expected Outcome
Users see intelligent scale suggestions based on their chord progression.

---

## Task 29: Add Full Chord Wheel Info Display

### Context
The physical chord wheel contains additional information in the overlay that our digital version doesn't show, including:
- Roman numerals (I, ii, iii, IV, V, vi, vii°)
- Suggested chord extensions for each position
- "Relative Minor" label for vi
- Position indicators

### Your Task
Add comprehensive chord info to the wheel based on the physical wheel overlay:

1. Show Roman numerals for diatonic positions (when in numeral mode)
2. Add extension suggestions to each ring:
   - I/IV ring: "maj7, maj9, maj13 or 6"
   - V ring: "7, 9, 11, sus4, 13"
   - ii ring: "m7, m9, m11, m6" with "II(7)" below for secondary dominant option
   - iii ring: "m7" with "III(7)" below
   - vi ring: "m7, m9, m11" with "RELATIVE MINOR" label
   - vii° ring: "m7♭5 (ø7)"

### Implementation Details
Reference `/Users/sam/chord-wheel-writer/chord wheel info/chord wheel info 2.jpg` for the exact layout and labels. Add small text labels to the appropriate ring positions when displaying diatonic context.

This information should appear when the chord is in the "diatonic highlight" area, not on every segment.

### Expected Outcome
The digital wheel shows all the educational information present on the physical wheel.

---

## Task 30: Implement Song Save/Load Functionality

### Context
Users currently lose their work when they close the app. The app needs the ability to save songs and load them later.

### Your Task
Implement save/load functionality:

1. Save to localStorage for simplicity (or optionally file export)
2. Allow multiple saved songs
3. Add UI for:
   - "Save Song" button
   - "Load Song" dropdown/list showing saved songs
   - "New Song" button (with confirmation if unsaved changes)
   - "Delete" option for saved songs
4. Auto-save as users work (debounced)

### Implementation Details
Create storage utilities:
```typescript
// In a new file: src/utils/storage.ts
export const saveSong = (song: Song) => {
  const songs = getSavedSongs();
  const index = songs.findIndex(s => s.id === song.id);
  if (index >= 0) {
    songs[index] = song;
  } else {
    songs.push(song);
  }
  localStorage.setItem('chordWheelSongs', JSON.stringify(songs));
};

export const getSavedSongs = (): Song[] => {
  return JSON.parse(localStorage.getItem('chordWheelSongs') || '[]');
};
```

Add to the store:
```typescript
autoSave: () => {
  saveSong(get().currentSong);
},
loadSong: (id: string) => { ... },
```

### Expected Outcome
Users can save, load, and manage multiple songs.

---

## Task 31: Fix Playback with Playhead

### Context
The playback controls exist but actual playback doesn't work. We need a working playhead that moves through the timeline, playing each chord at the correct time.

### Your Task
Implement full playback functionality:

1. Add a visual playhead that moves across the timeline during playback
2. Play chords sequentially at the BPM-determined rate
3. Highlight the currently playing chord slot
4. Handle:
   - Play/Pause toggle
   - Stop (reset to beginning)
   - Looping option
   - Clicking timeline to set playhead position

### Implementation Details
Use Tone.js Transport for precise timing:
```typescript
const startPlayback = () => {
  Tone.Transport.bpm.value = tempo;
  
  // Schedule all chords
  chords.forEach((chord, index) => {
    Tone.Transport.schedule((time) => {
      playChord(chord.notes, time);
      setCurrentPlayheadIndex(index);
    }, index * beatDuration);
  });
  
  Tone.Transport.start();
};
```

Add a playhead component that positions based on `currentPlayheadIndex`.

### Expected Outcome
Users can play back their progression with visual feedback.

---

## Task 32: Add Time Signature Support

### Context
The app currently only supports 4/4 time. Musicians need to write in other time signatures like 3/4, 6/8, 5/4, etc.

### Your Task
Add time signature selection and support:

1. Add a time signature selector in the playback controls or song settings
2. Support common signatures: 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 12/8
3. Adjust the number of beat slots per measure based on time signature
4. Update playback timing to respect the time signature

### Implementation Details
Add to the store:
```typescript
timeSignature: { beats: 4, noteValue: 4 }, // 4/4
setTimeSignature: (beats: number, noteValue: number) => ...
```

In the Measure component, generate the correct number of beat slots:
```typescript
const beatCount = timeSignature.beats;
// For 6/8, this would be 6; for 3/4, this would be 3
```

### Expected Outcome
Users can compose in various time signatures.

---

## Task 33: Display Song Duration

### Context
It would be helpful for users to see the total duration of their song based on the BPM and time signature.

### Your Task
Calculate and display song duration:

1. Calculate total beats from all measures
2. Convert to time using BPM: `duration = totalBeats / (BPM / 60)`
3. Display in minutes:seconds format (e.g., "2:34")
4. Update in real-time as chords/measures are added/removed

### Implementation Details
Create a calculation utility:
```typescript
const calculateSongDuration = (song: Song, bpm: number): string => {
  const totalBeats = song.sections.reduce((acc, section) => 
    acc + section.measures.length * section.timeSignature.beats, 0
  );
  const totalSeconds = (totalBeats / bpm) * 60;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
```

Display near the BPM control or in the header.

### Expected Outcome
Users can see how long their song is in real time.

---

## Task 34: Add Pinch-to-Zoom on Timeline

### Context
For longer songs on mobile or tablet devices, pinch-to-zoom on the timeline would help users navigate and see details.

### Your Task
Implement pinch-to-zoom functionality on the timeline:

1. Detect pinch gestures on touch devices
2. Scale the timeline view in/out
3. Add scroll/pan to navigate the zoomed view
4. Consider adding zoom buttons (+/-) for non-touch devices
5. Remember zoom level during session

### Implementation Details
Use the `use-gesture` library or native touch events:
```typescript
import { usePinch } from '@use-gesture/react';

const bind = usePinch(({ offset: [scale] }) => {
  setTimelineScale(Math.max(0.5, Math.min(2, scale)));
});
```

Apply scale to the timeline container:
```typescript
<div style={{ transform: `scale(${timelineScale})` }} {...bind()}>
  {/* Timeline content */}
</div>
```

### Expected Outcome
Users can pinch to zoom the timeline on touch devices.

---

## Task 35: Fix Wheel Rotation Wrap-Around

### Context
When rotating the wheel from F back to C (completing the circle), the wheel currently "rewinds" - spinning backwards 330° instead of continuing forward 30°. This is jarring and unintuitive.

### Your Task
Fix the wheel rotation animation to always take the shortest path:

1. When rotating from F to C, rotate forward 30° (not backward 330°)
2. Track cumulative rotation rather than resetting at 360°
3. Animation should always take the shortest arc between positions

### Implementation Details
The issue is likely in how `calculatedRotation` is computed. Instead of using absolute positions, track cumulative rotation:

```typescript
// In the store
wheelRotation: 0, // Cumulative rotation in degrees
rotateWheel: (direction: 'cw' | 'ccw') => {
  set(state => ({
    wheelRotation: state.wheelRotation + (direction === 'cw' ? 30 : -30)
  }));
}
```

Or fix the calculation to choose the shorter path:
```typescript
const calculateShortestRotation = (from: number, to: number): number => {
  const diff = to - from;
  if (Math.abs(diff) > 180) {
    return diff > 0 ? diff - 360 : diff + 360;
  }
  return diff;
};
```

### Expected Outcome
Wheel rotation always animates in the expected direction, never "rewinding" the long way around.

---

## General Guidelines for All Tasks

### Before Starting
1. Read the existing code thoroughly
2. Understand how it integrates with other components
3. Check the planning docs in `/Users/sam/chord-wheel-writer/planning/`
4. Reference the physical wheel images for visual accuracy

### Code Standards
1. Use TypeScript strictly - no `any` types
2. Follow existing naming conventions
3. Add JSDoc comments for new functions
4. Use existing utility functions where possible

### Testing
1. Test with multiple keys (C, G, F, Bb, E, etc.)
2. Verify enharmonic equivalents (F#/Gb)
3. Check edge cases (B to C transition)
4. Test on different screen sizes

### When Complete
1. Ensure no TypeScript errors
2. Verify the app still runs
3. Test the specific feature thoroughly
4. Check that existing features still work


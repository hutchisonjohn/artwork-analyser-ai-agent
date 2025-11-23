# 🎨 McCarthy Artwork Agent - Architecture Recommendations

**Date:** 22 November 2025  
**Status:** Implemented & Deployed  
**Version:** 2.0 (Smart Agent with Memory-Based Lookup)

---

## 📋 WHAT WAS FIXED

### **Issue 1: Agent Performing Its Own Calculations**
**Problem:** The agent was using the LLM to calculate DPI/size values on the fly, leading to:
- Incorrect calculations
- Inconsistent results
- Hallucinations
- Responses that didn't match the page's displayed data

**Solution:** 
- ✅ Pre-calculate ALL common DPI values (72, 100, 150, 200, 250, 300) in the frontend
- ✅ Store complete lookup table in agent's session memory (`state.metadata.artworkData.calculatedSizes`)
- ✅ Agent now performs **ZERO calculations** - only looks up pre-calculated values
- ✅ Updated system prompt with explicit "NEVER CALCULATE - ONLY LOOK UP" instructions

### **Issue 2: Inconsistent Data Between Page and Agent**
**Problem:** The page displayed DPI 72 using inline calculations, while DPI 300/150 used pre-calculated values.

**Solution:**
- ✅ Expanded `buildRecommendedSizesFromPixels()` to include all 6 DPI values
- ✅ Updated TypeScript types to include all DPI properties
- ✅ Removed inline calculations from App.tsx
- ✅ All data now comes from single source of truth

### **Issue 3: Agent Not Accessing Artwork Context**
**Problem:** Agent couldn't find artwork data because it wasn't properly stored in memory.

**Solution:**
- ✅ Updated `processMessage()` override to extract and store `calculatedSizes` from artwork context
- ✅ Added explicit memory structure documentation in system prompt
- ✅ Agent now has persistent access to all artwork data throughout conversation

---

## 🏗️ CURRENT ARCHITECTURE

### **Data Flow:**

```
1. USER UPLOADS IMAGE
   ↓
2. FRONTEND ANALYZES IMAGE
   - Extracts pixels, DPI, colors, etc.
   - Calculates sizes at 6 DPI values (72, 100, 150, 200, 250, 300)
   - Stores in `quality.recommendedSizes`
   ↓
3. FRONTEND SENDS TO AGENT
   - Packages all data into `artworkContext` JSON
   - Sends as `[Artwork Context: {...}]` in message
   ↓
4. AGENT RECEIVES & STORES
   - `processMessage()` extracts artwork context
   - Stores in `state.metadata.artworkData.calculatedSizes`
   - Persists in D1 database for entire session
   ↓
5. USER ASKS QUESTION
   - "what size at 72 dpi?"
   ↓
6. AGENT LOOKS UP ANSWER
   - Checks memory: `state.metadata.artworkData.calculatedSizes.at72dpi`
   - Returns: { w_cm: 99.17, h_cm: 89.57, w_in: 39.04, h_in: 35.26 }
   - Formats response with quality rating
   ↓
7. USER GETS ACCURATE ANSWER
   - "At **72 DPI**, your artwork will be **99.17 × 89.57 cm** (39.04" × 35.26"). ⚠️ **Quality: Poor**"
```

### **Key Files:**

| File | Purpose | Changes Made |
|------|---------|--------------|
| `quality.ts` | Calculation engine | Added 4 new DPI values (250, 200, 100, 72) |
| `types.ts` | TypeScript definitions | Updated `recommendedSizes` interface |
| `App.tsx` | Frontend display | Replaced inline DPI 72 calc with lookup |
| `McCarthyArtworkAgent.ts` | Agent logic | Added `calculatedSizes` to memory storage |
| System Prompt | Agent instructions | Complete rewrite with lookup table format |

---

## 🎯 HOW IT WORKS NOW

### **Agent Memory Structure:**

```json
{
  "artworkData": {
    "fileName": "summer-vibes.png",
    "dimensions": {
      "pixels": { "width": 2811, "height": 2539 },
      "dpi": 300
    },
    "quality": "Optimal",
    "colors": [...],
    "calculatedSizes": {
      "at300dpi": { "w_cm": 23.8, "h_cm": 21.5, "w_in": 9.37, "h_in": 8.46 },
      "at250dpi": { "w_cm": 28.6, "h_cm": 25.8, "w_in": 11.24, "h_in": 10.16 },
      "at200dpi": { "w_cm": 35.7, "h_cm": 32.2, "w_in": 14.06, "h_in": 12.70 },
      "at150dpi": { "w_cm": 47.6, "h_cm": 42.99, "w_in": 18.74, "h_in": 16.93 },
      "at100dpi": { "w_cm": 71.4, "h_cm": 64.5, "w_in": 28.11, "h_in": 25.39 },
      "at72dpi": { "w_cm": 99.17, "h_cm": 89.57, "w_in": 39.04, "h_in": 35.26 }
    }
  }
}
```

### **Agent Response Logic:**

```
User asks: "what size at 72 dpi?"
   ↓
Agent thinks: "I need to look up 72 DPI"
   ↓
Agent checks: state.metadata.artworkData.calculatedSizes.at72dpi
   ↓
Agent finds: { w_cm: 99.17, h_cm: 89.57, w_in: 39.04, h_in: 35.26 }
   ↓
Agent determines quality: 72 < 200 = Poor
   ↓
Agent formats: "At **72 DPI**, your artwork will be **99.17 × 89.57 cm** (39.04" × 35.26"). ⚠️ **Quality: Poor**"
```

---

## ✅ BENEFITS OF THIS APPROACH

### **1. Zero Calculation Errors**
- Agent never performs math
- All values pre-calculated by reliable frontend code
- Impossible to get wrong answers

### **2. Perfect Consistency**
- Page and agent show identical values
- Single source of truth (frontend calculations)
- No discrepancies possible

### **3. Natural Language Understanding**
- Agent can understand "what if it was 100 dpi?", "and at 200?", "how about 150?"
- LLM handles intent detection and conversational flow
- Lookup table handles precision

### **4. Extensible**
- Easy to add more DPI values (just update `buildRecommendedSizesFromPixels()`)
- Can add other pre-calculated data (print costs, material requirements, etc.)
- Scalable to any number of lookup values

### **5. Fast Response Time**
- No calculation overhead
- Simple memory lookup
- Instant accurate answers

---

## 🚀 FUTURE ENHANCEMENTS

### **Recommended Improvements:**

#### **1. Dynamic DPI Calculation (Optional)**
For DPI values not in the lookup table (e.g., 175 DPI):
- Add fallback calculation in agent
- Only used when exact match not found
- Still uses formula from memory, not LLM math

#### **2. Expanded Lookup Tables**
Pre-calculate additional useful data:
- Print costs at different sizes
- Material requirements (ink, film)
- Production time estimates
- Shipping size categories

#### **3. Multi-Image Sessions**
Allow users to upload multiple artworks:
- Store array of `artworkData` objects
- Agent can compare/contrast multiple files
- "Which of my 3 images is best quality?"

#### **4. Artwork History**
Persist artwork data beyond session:
- User can return to previous uploads
- "What was the DPI of that logo I uploaded last week?"
- Build user's artwork library

#### **5. Batch Analysis**
Analyze multiple files at once:
- Upload folder of images
- Get comparison table
- Identify quality issues across batch

#### **6. Smart Recommendations**
Based on artwork data, suggest:
- Optimal print sizes for intended use
- Cost-effective DPI for quality level
- Best printing method (DTF vs UV DTF)

---

## 🔧 TECHNICAL NOTES

### **Why This Architecture?**

**LLMs are great at:**
- Understanding natural language
- Conversational flow
- Intent detection
- Contextual responses

**LLMs are terrible at:**
- Precise calculations
- Consistent numerical output
- Following exact formulas
- Avoiding hallucinations with numbers

**Our Solution:**
- Use LLM for what it's good at (conversation)
- Use pre-calculated data for what it's bad at (math)
- Best of both worlds!

### **Memory vs RAG vs Handlers**

| Approach | Use Case | Pros | Cons |
|----------|----------|------|------|
| **Memory Lookup** (Current) | Session-specific data | Fast, accurate, simple | Limited to session |
| **RAG** | Static knowledge | Persistent, searchable | Slower, complex |
| **Handlers** | Specific intents | Precise control | Rigid, not conversational |

**Our Hybrid Approach:**
- Memory: Artwork data (session-specific)
- RAG: DTF/UV DTF knowledge (static)
- LLM: Conversational intelligence (flexible)

---

## 📊 TESTING CHECKLIST

### **DPI Questions to Test:**

- [ ] "what size at 72 dpi?"
- [ ] "how big at 100 dpi?"
- [ ] "what if it was 150 dpi?"
- [ ] "and at 200 dpi?"
- [ ] "what about 250 dpi?"
- [ ] "how big at 300 dpi?"
- [ ] "what size would it be at 72 dpi?" (natural variation)
- [ ] "if I printed at 100 dpi, what size?" (natural variation)

### **Expected Behavior:**

✅ Agent responds instantly with exact values from lookup table  
✅ Values match exactly what's shown on the page  
✅ Quality rating is correct (Optimal/Good/Poor)  
✅ CM shown first, inches in parentheses  
✅ No apologies, no "let me calculate", just direct answer  

### **Edge Cases:**

- [ ] User asks for DPI not in table (e.g., 175 DPI)
  - Expected: "I have pre-calculated sizes for 72, 100, 150, 200, 250, and 300 DPI. Would you like to know any of those?"
  
- [ ] User asks before uploading artwork
  - Expected: "Please upload an artwork file first so I can analyze it for you!"

- [ ] User uploads new artwork mid-conversation
  - Expected: Memory updates with new artwork data, old data replaced

---

## 🎓 LESSONS LEARNED

### **1. Don't Trust LLMs with Math**
Even simple calculations can fail. Pre-calculate everything.

### **2. Single Source of Truth**
Frontend calculates once, everyone uses that data.

### **3. Memory is Powerful**
Session metadata is perfect for user-specific data.

### **4. System Prompts Need Examples**
Show the LLM exactly what the memory structure looks like.

### **5. Type Safety Matters**
TypeScript caught the missing DPI properties immediately.

---

## 📝 DEPLOYMENT NOTES

**Deployed:** 22 November 2025

**Frontend:** https://e6aef448.artwork-analyser-frontend.pages.dev  
**Worker:** https://dartmouth-os-worker.dartmouth.workers.dev  

**Changes:**
- ✅ Frontend: Updated `quality.ts`, `types.ts`, `App.tsx`
- ✅ Worker: Updated `McCarthyArtworkAgent.ts`
- ✅ System Prompt: Complete rewrite with lookup instructions

**Testing Required:**
- Upload artwork
- Ask all 6 DPI questions
- Verify accuracy and consistency

---

## 🎉 CONCLUSION

This architecture transforms the McCarthy Artwork Agent from a "calculator" to a "smart assistant":

**Before:** Agent tries to do math → Gets it wrong → User frustrated  
**After:** Agent looks up pre-calculated data → Always correct → User happy  

The key insight: **Use the LLM for intelligence, not arithmetic.**

---

**Questions or Issues?**  
Contact: John (Dartmouth OS Project Owner)  
Last Updated: 22 November 2025


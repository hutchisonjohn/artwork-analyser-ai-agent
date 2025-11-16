# McCarthy Improvements - Test Guide

## ✅ **Deployed Successfully!**

**Worker Version:** `3a39c1bb-9ef9-464d-8ce5-e3df4ce1310f`
**Deployed:** November 16, 2025

---

## 🧪 **Test 1: Greeting Response (NO Auto-Analysis)**

### **Test 1.1: Simple Greeting**
```
hi
```
**Expected:** Friendly greeting, NO DTF advice, NO analysis
**Example:** "Hi! I'm McCarthy, your artwork assistant. Upload an artwork and I'll help you analyze it for printing. What can I help you with?"

### **Test 1.2: Greeting with Introduction**
```
hi there, i'm John
```
**Expected:** Friendly greeting with name, NO DTF advice, NO analysis
**Example:** "Hi John! I'm McCarthy, your artwork assistant. Upload an artwork and I'll help you analyze it for printing. What can I help you with?"

### **Test 1.3: Various Greetings**
```
hello
hey
good morning
```
**Expected:** All should respond with greeting only, NO analysis

---

## 🧪 **Test 2: Tutorial Permission Flow**

### **Test 2.1: "How To" Question**
```
How do I fix transparency?
```
**Expected:** 
- Answer about transparency (2-3 sentences)
- Ends with: "Would you like tutorial videos on this?"
- **NO YouTube links yet**

### **Test 2.2: User Confirms (Yes)**
```
yes please
```
**Expected:**
- "Here are some helpful tutorial videos:"
- 3 YouTube links about transparency
- Links are clickable

### **Test 2.3: User Confirms (Alternative)**
Try these confirmations:
```
sure
okay
tutorials
show me
videos
```
**Expected:** All should provide YouTube links

### **Test 2.4: User Declines**
```
no thanks
```
**Expected:** McCarthy acknowledges and waits for next question

---

## 🧪 **Test 3: Complete Flow (All 13 Scenarios)**

### **Scenario 1: Transparency**
```
How do I fix transparency in my artwork?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
yes
```
**Expected:** 3 YouTube links about transparency

---

### **Scenario 2: DPI**
```
How can I increase the DPI of this image?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
sure
```
**Expected:** 3 YouTube links about DPI

---

### **Scenario 3: ICC Profile**
```
How do I add an ICC profile?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
please
```
**Expected:** 3 YouTube links about ICC profiles

---

### **Scenario 4: Text Size**
```
How do I make text bigger without losing quality?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
tutorials
```
**Expected:** 3 YouTube links about text sizing

---

### **Scenario 5: Line Thickness**
```
How do I make lines thicker?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
videos
```
**Expected:** 3 YouTube links about line thickness

---

### **Scenario 6: File Export**
```
How do I export this as a high-quality PNG?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
show me
```
**Expected:** 3 YouTube links about PNG export

---

### **Scenario 7: Halftones**
```
How do I create halftones?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
yes please
```
**Expected:** 3 YouTube links about halftones

---

### **Scenario 8: Artwork Prep**
```
How do I prepare my artwork for DTF printing?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
sure
```
**Expected:** 3 YouTube links about DTF prep

---

### **Scenario 9: AI Upscaling**
```
How can I upscale my artwork without pixelation?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
okay
```
**Expected:** 3 YouTube links about AI upscaling

---

### **Scenario 10: Color Correction**
```
How do I enhance colors for printing?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
yes
```
**Expected:** 3 YouTube links about color enhancement

---

### **Scenario 11: Background Removal**
```
How do I remove the background?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
please
```
**Expected:** 3 YouTube links about background removal

---

### **Scenario 12: Resizing**
```
How do I resize this without distorting it?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
tutorials
```
**Expected:** 3 YouTube links about resizing

---

### **Scenario 13: Software Basics**
```
How do I use Photoshop for printing?
```
**Expected:** Answer + "Would you like tutorial videos on this?"

```
show me
```
**Expected:** 3 YouTube links about Photoshop

---

## 🧪 **Test 4: Negative Tests**

### **Test 4.1: Non-"How To" Question (Should NOT Offer Tutorials)**
```
What is the DPI of my artwork?
```
**Expected:** 
- Answer with DPI number
- **NO** "Would you like tutorial videos?"
- **NO** YouTube links

### **Test 4.2: Saying "Yes" Without Prior "How To" Question**
```
yes
```
**Expected:** 
- McCarthy asks what you need help with
- **NO** YouTube links (no context)

---

## 🧪 **Test 5: Conversation Flow**

### **Test 5.1: Multiple Questions in Sequence**
```
1. How do I fix transparency?
2. (McCarthy asks if you want tutorials)
3. no thanks
4. How do I increase DPI?
5. (McCarthy asks if you want tutorials)
6. yes please
```
**Expected:** 
- Step 3: McCarthy acknowledges, no links
- Step 6: McCarthy provides DPI tutorials (not transparency)

### **Test 5.2: Asking Different Question Instead of Confirming**
```
1. How do I fix transparency?
2. (McCarthy asks if you want tutorials)
3. What's the minimum text size?
```
**Expected:** 
- Step 3: McCarthy answers the new question (no transparency tutorials)

---

## ✅ **Success Criteria**

### **Greeting Tests:**
- ✅ No auto-analysis for greetings
- ✅ Friendly, welcoming response
- ✅ Asks what user needs help with

### **Tutorial Permission Tests:**
- ✅ "How to" questions end with tutorial offer
- ✅ NO immediate YouTube links
- ✅ Links only appear after "yes/sure/please/tutorials"
- ✅ Correct tutorials for the question asked

### **Conversation Flow Tests:**
- ✅ Can decline tutorials and continue
- ✅ Can ask new questions without getting old tutorials
- ✅ Context is maintained correctly

---

## 📊 **Test Results Template**

```
GREETING TESTS:
✅ Test 1.1 - Simple Greeting: PASS / FAIL
✅ Test 1.2 - Greeting with Name: PASS / FAIL
✅ Test 1.3 - Various Greetings: PASS / FAIL

TUTORIAL PERMISSION TESTS:
✅ Test 2.1 - How To Question: PASS / FAIL
✅ Test 2.2 - User Confirms (Yes): PASS / FAIL
✅ Test 2.3 - User Confirms (Alternative): PASS / FAIL
✅ Test 2.4 - User Declines: PASS / FAIL

13 SCENARIO TESTS:
✅ Scenario 1 - Transparency: PASS / FAIL
✅ Scenario 2 - DPI: PASS / FAIL
✅ Scenario 3 - ICC Profile: PASS / FAIL
✅ Scenario 4 - Text Size: PASS / FAIL
✅ Scenario 5 - Line Thickness: PASS / FAIL
✅ Scenario 6 - File Export: PASS / FAIL
✅ Scenario 7 - Halftones: PASS / FAIL
✅ Scenario 8 - Artwork Prep: PASS / FAIL
✅ Scenario 9 - AI Upscaling: PASS / FAIL
✅ Scenario 10 - Color Correction: PASS / FAIL
✅ Scenario 11 - Background Removal: PASS / FAIL
✅ Scenario 12 - Resizing: PASS / FAIL
✅ Scenario 13 - Software Basics: PASS / FAIL

NEGATIVE TESTS:
✅ Test 4.1 - Non-How To: PASS / FAIL
✅ Test 4.2 - Yes Without Context: PASS / FAIL

CONVERSATION FLOW TESTS:
✅ Test 5.1 - Multiple Questions: PASS / FAIL
✅ Test 5.2 - Different Question: PASS / FAIL

Total: __/22
Success Rate: __%
```

---

## 🚀 **How to Test**

1. **Wait 2-3 minutes** for Cloudflare Pages to rebuild
2. **Hard refresh:** `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. **Upload an artwork**
4. **Open AI chat** (✨ icon)
5. **Run through tests** one by one
6. **Track results** using the template above

---

## 🎯 **Expected Improvements**

### **Before:**
```
User: "hi there, i'm John"
McCarthy: "Hi John! For DTF printing, it's important to ensure..."  ❌

User: "How do I fix transparency?"
McCarthy: "[Answer]

📺 **Helpful Tutorials:**
1. [Link]
2. [Link]
3. [Link]"  ❌
```

### **After:**
```
User: "hi there, i'm John"
McCarthy: "Hi John! I'm McCarthy, your artwork assistant. Upload an artwork and I'll help you analyze it for printing. What can I help you with?"  ✅

User: "How do I fix transparency?"
McCarthy: "[Answer]. Would you like tutorial videos on this?"  ✅

User: "yes please"
McCarthy: "Here are some helpful tutorial videos:
1. [Link]
2. [Link]
3. [Link]"  ✅
```

---

**Ready to test!** 🎉

**Last Updated:** November 16, 2025
**Worker Version:** `3a39c1bb-9ef9-464d-8ce5-e3df4ce1310f`


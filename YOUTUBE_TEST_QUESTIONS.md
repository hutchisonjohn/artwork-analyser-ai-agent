# YouTube Tutorial Integration - Test Questions

## 🧪 Complete Test Suite for All 13+ Scenarios

Use these questions to verify McCarthy provides YouTube tutorial links correctly.

---

## ✅ Testing Checklist

Before testing:
- [ ] YouTube API key configured in Settings
- [ ] Artwork uploaded and analyzed
- [ ] AI chat open and ready
- [ ] Worker logs visible (optional): `wrangler tail`

Expected result for each test:
- ✅ McCarthy answers the question (2-3 sentences)
- ✅ Followed by: "📺 **Helpful Tutorials:**"
- ✅ 3 YouTube video links with titles
- ✅ Links are clickable and work

---

## 📋 Test Questions by Scenario

### **1. Transparency Issues** 🔍

#### Test 1.1 - Basic Transparency Fix
**Question:** `How do I fix transparency?`

**Expected YouTube Search:** "how to remove transparency photoshop DTF printing"

**Expected Response:**
- Answer about flattening layers, using halftones, etc.
- 3 YouTube links about removing transparency in Photoshop

---

#### Test 1.2 - Semi-Transparent Pixels
**Question:** `How to remove semi-transparent pixels?`

**Expected YouTube Search:** "how to remove transparency photoshop DTF printing"

**Expected Response:**
- Answer about making pixels 100% opaque
- 3 YouTube links about transparency removal

---

#### Test 1.3 - Flatten Transparency
**Question:** `How do I flatten transparency in my artwork?`

**Expected YouTube Search:** "how to remove transparency photoshop DTF printing"

**Expected Response:**
- Answer about Layer > Flatten Image
- 3 YouTube links about flattening transparency

---

#### Test 1.4 - Halftone Conversion
**Question:** `How to convert transparency to halftones?`

**Expected YouTube Search:** "how to create halftone effect photoshop transparency"

**Expected Response:**
- Answer about using Color Halftone filter
- 3 YouTube links about creating halftones

---

#### Test 1.5 - GIMP Specific
**Question:** `How do I remove transparency in GIMP?`

**Expected YouTube Search:** "how to remove transparency GIMP"

**Expected Response:**
- Answer about GIMP-specific steps
- 3 YouTube links about GIMP transparency removal

---

### **2. DPI / Resolution** 📐

#### Test 2.1 - Increase DPI
**Question:** `How do I increase DPI?`

**Expected YouTube Search:** "how to increase DPI photoshop without losing quality"

**Expected Response:**
- Answer about Image > Image Size in Photoshop
- 3 YouTube links about increasing DPI

---

#### Test 2.2 - Upscale Artwork
**Question:** `How to upscale my artwork without losing quality?`

**Expected YouTube Search:** "topaz gigapixel AI upscale tutorial"

**Expected Response:**
- Answer about AI upscaling tools
- 3 YouTube links about AI upscaling (Topaz, Photoshop Neural Filters)

---

#### Test 2.3 - Improve Resolution
**Question:** `How can I improve the resolution of this image?`

**Expected YouTube Search:** "how to increase DPI photoshop without losing quality"

**Expected Response:**
- Answer about resampling and AI upscaling
- 3 YouTube links about improving resolution

---

#### Test 2.4 - Change DPI
**Question:** `How to change DPI to 300 in Photoshop?`

**Expected YouTube Search:** "how to change image resolution 300 DPI photoshop"

**Expected Response:**
- Answer about Image Size dialog
- 3 YouTube links about changing DPI

---

### **3. Color Profile / ICC** 🎨

#### Test 3.1 - Add ICC Profile
**Question:** `How do I add an ICC profile?`

**Expected YouTube Search:** "how to embed ICC color profile photoshop"

**Expected Response:**
- Answer about Edit > Assign Profile
- 3 YouTube links about embedding ICC profiles

---

#### Test 3.2 - Convert to sRGB
**Question:** `How to convert to sRGB?`

**Expected YouTube Search:** "how to convert to sRGB photoshop"

**Expected Response:**
- Answer about Edit > Convert to Profile
- 3 YouTube links about sRGB conversion

---

#### Test 3.3 - RGB to CMYK
**Question:** `How do I convert RGB to CMYK for printing?`

**Expected YouTube Search:** "how to convert RGB to CMYK photoshop printing"

**Expected Response:**
- Answer about Image > Mode > CMYK
- 3 YouTube links about RGB to CMYK conversion

---

#### Test 3.4 - Fix Color Profile
**Question:** `How to fix color profile issues?`

**Expected YouTube Search:** "how to embed ICC color profile photoshop"

**Expected Response:**
- Answer about assigning correct profile
- 3 YouTube links about color profile management

---

### **4. Text Size / Readability** 📝

#### Test 4.1 - Make Text Bigger
**Question:** `How do I make text bigger without losing quality?`

**Expected YouTube Search:** "how to resize text photoshop maintain quality"

**Expected Response:**
- Answer about using vector text, not rasterized
- 3 YouTube links about resizing text

---

#### Test 4.2 - Fix Small Text
**Question:** `My text is too small for printing. How to fix?`

**Expected YouTube Search:** "how to resize text photoshop maintain quality"

**Expected Response:**
- Answer about minimum text size (8pt/2.5mm)
- 3 YouTube links about text sizing

---

#### Test 4.3 - Readable Text
**Question:** `How to ensure text is readable when printed?`

**Expected YouTube Search:** "how to resize text photoshop maintain quality"

**Expected Response:**
- Answer about minimum sizes and vector text
- 3 YouTube links about print-ready text

---

### **5. Line Thickness / Stroke** ✏️

#### Test 5.1 - Make Lines Thicker
**Question:** `How do I make lines thicker?`

**Expected YouTube Search:** "how to make lines thicker photoshop"

**Expected Response:**
- Answer about stroke width, minimum 1mm
- 3 YouTube links about increasing line thickness

---

#### Test 5.2 - Increase Stroke Width (Illustrator)
**Question:** `How to increase stroke width in Illustrator?`

**Expected YouTube Search:** "how to increase stroke width illustrator"

**Expected Response:**
- Answer about Stroke panel in Illustrator
- 3 YouTube links about Illustrator stroke width

---

#### Test 5.3 - Fix Thin Lines
**Question:** `My lines are too thin and breaking. How to fix?`

**Expected YouTube Search:** "how to make lines thicker photoshop"

**Expected Response:**
- Answer about minimum line thickness (1mm DTF, 0.5mm UV DTF)
- 3 YouTube links about fixing thin lines

---

### **6. File Format Conversion** 💾

#### Test 6.1 - Convert to PNG
**Question:** `How do I convert this to PNG?`

**Expected YouTube Search:** "how to export PNG 300 DPI photoshop"

**Expected Response:**
- Answer about File > Export > Export As
- 3 YouTube links about PNG export

---

#### Test 6.2 - High-Quality PNG
**Question:** `How to save as high-quality PNG for printing?`

**Expected YouTube Search:** "how to export PNG 300 DPI photoshop"

**Expected Response:**
- Answer about 300 DPI, no compression
- 3 YouTube links about high-quality PNG export

---

#### Test 6.3 - Vector to Raster
**Question:** `How to convert vector to raster?`

**Expected YouTube Search:** "how to convert vector to raster 300 DPI"

**Expected Response:**
- Answer about rasterizing layers
- 3 YouTube links about vector to raster conversion

---

#### Test 6.4 - Export from Illustrator
**Question:** `How to export PNG from Illustrator at 300 DPI?`

**Expected YouTube Search:** "how to export PNG from illustrator high resolution"

**Expected Response:**
- Answer about File > Export > Export As PNG
- 3 YouTube links about Illustrator PNG export

---

### **7. Halftone Creation** ⚫⚪

#### Test 7.1 - Create Halftones
**Question:** `How do I create halftones?`

**Expected YouTube Search:** "how to create halftone effect photoshop"

**Expected Response:**
- Answer about Filter > Pixelate > Color Halftone
- 3 YouTube links about halftone creation

---

#### Test 7.2 - Gradient to Halftone
**Question:** `How to convert gradients to halftones?`

**Expected YouTube Search:** "how to convert gradient to halftone photoshop"

**Expected Response:**
- Answer about halftone filter on gradients
- 3 YouTube links about gradient halftones

---

#### Test 7.3 - Halftone Pattern
**Question:** `How to make a halftone dot pattern?`

**Expected YouTube Search:** "how to create halftone effect photoshop"

**Expected Response:**
- Answer about halftone settings (radius, angles)
- 3 YouTube links about halftone patterns

---

#### Test 7.4 - DTF Halftones
**Question:** `How to create halftones for DTF printing?`

**Expected YouTube Search:** "halftone for DTF printing tutorial"

**Expected Response:**
- Answer about 100% opacity halftone dots
- 3 YouTube links about DTF halftones

---

### **8. Artwork Preparation** 🖼️

#### Test 8.1 - Prepare for Printing
**Question:** `How do I prepare artwork for printing?`

**Expected YouTube Search:** "how to prepare artwork for DTF printing"

**Expected Response:**
- Answer about DPI, transparency, color profile
- 3 YouTube links about print preparation

---

#### Test 8.2 - Print-Ready Files
**Question:** `How to make my artwork print-ready?`

**Expected YouTube Search:** "how to prepare artwork for DTF printing"

**Expected Response:**
- Answer about checklist (300 DPI, no transparency, etc.)
- 3 YouTube links about print-ready artwork

---

#### Test 8.3 - DTF Preparation
**Question:** `What's the workflow for DTF artwork preparation?`

**Expected YouTube Search:** "how to prepare artwork for DTF printing"

**Expected Response:**
- Answer about DTF-specific requirements
- 3 YouTube links about DTF workflow

---

### **9. Upscaling / AI Enhancement** 🤖

#### Test 9.1 - Make Artwork Bigger
**Question:** `How do I make my artwork bigger without pixelation?`

**Expected YouTube Search:** "how to upscale image AI without losing quality"

**Expected Response:**
- Answer about AI upscaling tools
- 3 YouTube links about AI upscaling

---

#### Test 9.2 - AI Upscaling
**Question:** `What AI tools can upscale my image?`

**Expected YouTube Search:** "how to upscale image AI without losing quality"

**Expected Response:**
- Answer about Topaz Gigapixel, Photoshop Neural Filters
- 3 YouTube links about AI upscaling tools

---

#### Test 9.3 - Topaz Tutorial
**Question:** `How to use Topaz Gigapixel?`

**Expected YouTube Search:** "topaz gigapixel AI tutorial"

**Expected Response:**
- Answer about Topaz Gigapixel workflow
- 3 YouTube links about Topaz Gigapixel

---

#### Test 9.4 - Photoshop Super Resolution
**Question:** `How to use Photoshop super resolution?`

**Expected YouTube Search:** "how to upscale image AI without losing quality"

**Expected Response:**
- Answer about Neural Filters > Super Resolution
- 3 YouTube links about Photoshop super resolution

---

### **10. Color Correction** 🌈

#### Test 10.1 - Fix Colors
**Question:** `How do I fix the colors in my artwork?`

**Expected YouTube Search:** "how to color correct for printing photoshop"

**Expected Response:**
- Answer about adjustment layers
- 3 YouTube links about color correction

---

#### Test 10.2 - Enhance Colors
**Question:** `How to enhance colors for printing?`

**Expected YouTube Search:** "how to color correct for printing photoshop"

**Expected Response:**
- Answer about Vibrance, Hue/Saturation
- 3 YouTube links about color enhancement

---

#### Test 10.3 - Adjust Brightness
**Question:** `How to adjust brightness and contrast?`

**Expected YouTube Search:** "how to color correct for printing photoshop"

**Expected Response:**
- Answer about Curves, Levels adjustments
- 3 YouTube links about brightness adjustment

---

### **11. Background Removal** 🖌️

#### Test 11.1 - Remove Background
**Question:** `How do I remove the background?`

**Expected YouTube Search:** "how to remove background photoshop"

**Expected Response:**
- Answer about Select Subject, Magic Wand, etc.
- 3 YouTube links about background removal

---

#### Test 11.2 - Transparent Background
**Question:** `How to make the background transparent?`

**Expected YouTube Search:** "how to remove background photoshop"

**Expected Response:**
- Answer about deleting background layer
- 3 YouTube links about transparent backgrounds

---

#### Test 11.3 - Cut Out Image
**Question:** `How to cut out an image from its background?`

**Expected YouTube Search:** "how to remove background photoshop"

**Expected Response:**
- Answer about selection tools and masking
- 3 YouTube links about cutting out images

---

#### Test 11.4 - GIMP Background Removal
**Question:** `How to remove background in GIMP?`

**Expected YouTube Search:** "how to remove background GIMP"

**Expected Response:**
- Answer about GIMP-specific tools
- 3 YouTube links about GIMP background removal

---

### **12. Aspect Ratio / Resizing** 📏

#### Test 12.1 - Change Aspect Ratio
**Question:** `How do I change the aspect ratio?`

**Expected YouTube Search:** "how to resize image maintain aspect ratio photoshop"

**Expected Response:**
- Answer about Image > Canvas Size or Crop
- 3 YouTube links about aspect ratio changes

---

#### Test 12.2 - Resize Without Distortion
**Question:** `How to resize without distorting the image?`

**Expected YouTube Search:** "how to resize image maintain aspect ratio photoshop"

**Expected Response:**
- Answer about holding Shift while resizing
- 3 YouTube links about proportional resizing

---

#### Test 12.3 - Crop to Size
**Question:** `How to crop to a specific size?`

**Expected YouTube Search:** "how to resize image maintain aspect ratio photoshop"

**Expected Response:**
- Answer about Crop tool with dimensions
- 3 YouTube links about cropping to size

---

### **13. General Software Tutorials** 💻

#### Test 13.1 - Photoshop Basics
**Question:** `How do I use Photoshop for printing?`

**Expected YouTube Search:** "photoshop basics for printing tutorial"

**Expected Response:**
- Answer about key Photoshop features for print
- 3 YouTube links about Photoshop basics

---

#### Test 13.2 - GIMP Tutorial
**Question:** `I'm new to GIMP. Any tutorials?`

**Expected YouTube Search:** "GIMP complete tutorial for beginners"

**Expected Response:**
- Answer about GIMP as free alternative
- 3 YouTube links about GIMP tutorials

---

#### Test 13.3 - Illustrator Basics
**Question:** `How to use Illustrator for print design?`

**Expected YouTube Search:** "photoshop basics for printing tutorial"

**Expected Response:**
- Answer about vector vs raster
- 3 YouTube links about Illustrator for print

---

## 🧪 Advanced Test Cases

### Test A1 - Multiple Issues
**Question:** `How do I fix transparency and increase DPI at the same time?`

**Expected:** Should detect transparency as primary issue and provide transparency tutorials

---

### Test A2 - Software-Specific
**Question:** `How to flatten transparency in Illustrator?`

**Expected YouTube Search:** "illustrator remove transparency opacity 100"

---

### Test A3 - Casual Language
**Question:** `yo how do i make this bigger without it looking like crap?`

**Expected:** Should detect upscaling/DPI question and provide tutorials

---

### Test A4 - Follow-up Question
**Question 1:** `How to fix transparency?`
**Question 2:** `What about in GIMP?`

**Expected:** Second question should provide GIMP-specific tutorials

---

### Test A5 - No Tutorial Needed
**Question:** `What's the DPI of my artwork?`

**Expected:** Answer only, NO tutorial links (not a "how to" question)

---

## 📊 Test Results Template

Use this template to track your testing:

```markdown
## Test Results - [Date]

### Scenario 1: Transparency Issues
- [ ] Test 1.1 - Basic Fix: ✅ PASS / ❌ FAIL
- [ ] Test 1.2 - Semi-Transparent: ✅ PASS / ❌ FAIL
- [ ] Test 1.3 - Flatten: ✅ PASS / ❌ FAIL
- [ ] Test 1.4 - Halftone: ✅ PASS / ❌ FAIL
- [ ] Test 1.5 - GIMP: ✅ PASS / ❌ FAIL

### Scenario 2: DPI / Resolution
- [ ] Test 2.1 - Increase DPI: ✅ PASS / ❌ FAIL
- [ ] Test 2.2 - Upscale: ✅ PASS / ❌ FAIL
- [ ] Test 2.3 - Improve Resolution: ✅ PASS / ❌ FAIL
- [ ] Test 2.4 - Change DPI: ✅ PASS / ❌ FAIL

[Continue for all scenarios...]

### Summary
- Total Tests: 50+
- Passed: __
- Failed: __
- Success Rate: __%

### Issues Found
1. [Issue description]
2. [Issue description]
```

---

## 🐛 Common Issues to Watch For

### Issue 1: No Tutorial Links Appearing
**Symptoms:** McCarthy answers but no YouTube links
**Possible Causes:**
- YouTube API key not configured
- Question doesn't include "how to" keywords
- `detectTutorialNeed()` not matching pattern

**Debug:** Check worker logs for `[TUTORIAL] Detected tutorial need: "..."`

---

### Issue 2: Wrong Tutorials
**Symptoms:** Links appear but not relevant to question
**Possible Causes:**
- Search query not specific enough
- Detection pattern needs refinement

**Debug:** Check worker logs for the search query used

---

### Issue 3: API Errors
**Symptoms:** Error message instead of links
**Possible Causes:**
- Invalid API key
- Quota exceeded
- API restrictions

**Debug:** Check worker logs for YouTube API error details

---

## 🚀 Quick Test Script

Copy and paste these questions one by one to quickly test all scenarios:

```
How do I fix transparency?
How to increase DPI?
How do I add an ICC profile?
How to make text bigger?
How do I make lines thicker?
How to convert to PNG?
How do I create halftones?
How to prepare artwork for printing?
How to upscale my artwork?
How do I fix colors?
How to remove the background?
How to change aspect ratio?
How do I use Photoshop for printing?
```

---

**Expected Result for Each:**
✅ Answer (2-3 sentences)
✅ "📺 **Helpful Tutorials:**"
✅ 3 YouTube video links

---

**Last Updated:** November 15, 2025
**Total Test Cases:** 50+
**Estimated Test Time:** 30-45 minutes for complete suite


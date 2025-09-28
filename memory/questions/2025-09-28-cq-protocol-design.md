# CQ Protocol Design - 2025-09-28

## Status: IN_PROGRESS

## Design Requirements
- Always ask CQs independently
- Order questions to simplify subsequent questions
- Consider interdependencies between questions
- Focus on scope, triggers, format, response handling, integration

## User Answer: CQ1 (Scope & Triggers)
**Answer**: A - Always ask CQs independently, in an order that will simplify subsequent questions, considering order and interdependencies

## User Feedback: CQ Protocol
**Feedback**: "Too many on screen. One question at a time."

## User Answer: CQ2 (Question Ordering Logic)
**Answer**: Whichever will address your current internal CQ requirements most appropriately (dynamically and intelligently)

## User Answer: CQ3 (CQ Format Structure)
**Answer**: Current format but use "1." for questions and "a." for options, as easier to quickly reference in answer

## User Answer: CQ4 (Documentation)
**Answer**: c) and d) - Just final decisions, not questioning process + Create CQ patterns for common scenarios

## User Feedback: Option Format
**Feedback**: Options should be listed as "1. ... a. ... n." (meaning a. b. c. d. sequence)

## User Answer: CQ5 (Documentation Location)
**Question**: Where should CQ protocol be documented in CLAUDE.md?
**User Response**: "What do you suggest as most appropriate?"
**Claude Recommendation**: Option c) - Add to "Development Workflow" as a step, because CQs are part of active development process, not just principles

## User Answer: CQ6 (Integration Approach)
**Answer**: c) - Hybrid approach - brief workflow step + detailed CQ section

## User Feedback: Option Formatting Issue
**Issue**: Options not displaying on separate lines - missing line breaks after each option

## User Answer: CQ7 (Implementation Timing)
**Answer**: b) - Ask more CQs to refine specific implementation details first

## User Answer: CQ8 (Trigger Conditions)
**Answer**: Whenever required and/or when user types "Ask CQs"

## User Answer: CQ9 (CQ Pattern Implementation)
**Question**: How should Claude Code handle CQ patterns for common scenarios?
**User Response**: "Can all of the above be implemented?"
**Analysis**: Options a, b, d are implementable immediately. Option c requires session persistence which Claude Code lacks between conversations.

## User Answer: CQ10 (Implementation Scope)
**Answer**: a) - Yes, implement a, b, d now and note c as limitation
**User Challenge**: "But is c. unachievable? Is this not available through documentation and claude-dementia?"
**Revised Analysis**: Option c IS achievable through memory system - document user preferences in memory/reference/ for cross-session persistence

## User Answer: CQ11 (Final Implementation Decision)
**Answer**: a) - Implement complete CQ pattern system with memory persistence, and still document any outstanding elements of all a-d as future enhancements

## Follow-up CQs Based on "Always Ask" Principle

### CQ2: Question Ordering Logic
Since CQs should be ordered to simplify subsequent questions, what ordering principle should Claude Code follow?
- A) Most fundamental/architectural questions first, then implementation details
- B) User intent/requirements first, then technical approach questions
- C) Scope/boundaries first, then method/approach, then specific details
- D) Risk/blocker questions first, then preference questions

### CQ3: Interdependency Handling
When CQs have interdependencies, how should Claude Code structure them?
- A) Group related CQs together with dependency notes
- B) Ask prerequisite CQs first, wait for answers, then ask dependent CQs
- C) Present dependency tree visually: "CQ1 → CQ2a/CQ2b → CQ3"
- D) Ask all CQs but mark which depend on others

### CQ4: Independence vs Efficiency
Since CQs should be "independent," how should Claude Code balance this with efficiency?
- A) Always ask one CQ at a time, wait for answer, then next CQ
- B) Ask logically independent CQs in batches (no dependencies within batch)
- C) Ask all CQs upfront but clearly mark which are independent
- D) Use conditional CQs: "If A, then ask X; if B, then ask Y"

### CQ5: Question Simplification
What makes a "subsequent question" simpler after asking foundational CQs?
- A) Reduced scope/context needed to understand the question
- B) Clearer decision boundaries based on previous answers
- C) Less cognitive load due to established framework
- D) All of the above - how should Claude Code achieve this?
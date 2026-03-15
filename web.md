# React Documentation UI Blueprint

Version: 1.0

Purpose

This document describes how to implement a documentation-style UI inside an existing React project.

IMPORTANT

The existing project structure must not be modified.

Allowed:

- modify styles
- add UI hooks
- add UI components
- update layout

Disallowed:

- changing project architecture
- changing router structure
- moving folders
- modifying data layer

---

# 1 Layout Blueprint

Target layout

Header

Sidebar + Article + TOC

Footer

Layout Example

--------------------------------
Header
--------------------------------
Sidebar | Article Content | TOC
--------------------------------
Footer

---

# 2 Layout CSS Rules

Header

height: 56px

Sidebar

width: 260px

Content

max-width: 860px

TOC

width: 240px

Page container

max-width: 1400px
margin: auto

---

# 3 Sidebar Navigation Algorithm

Sidebar should support:

tree navigation
active highlight
expand/collapse

Example structure

Java
Stream
Maven
DDD

DevOps

Algorithms

Navigation Data Structure

Extraction Algorithm

Build TOC tree

---

# 9 Scroll Spy Algorithm

Highlight current section in TOC.

Implementation

Observe all headings.

When heading enters viewport

set activeHeading

Highlight TOC item.

---

# 10 TOC UI Style

Font size

13px

Default color

#71717a

Active

color: #18181b
font-weight: 500

Indentation

h2 level 0

h3 level 12px

---

# 11 Theme System

Support:

Light Mode

Dark Mode

Dark colors

background

#18181b

border

#27272a

text

#e4e4e7

Persist theme in

localStorage

---

# 12 Theme Toggle Logic

Toggle updates

localStorage

---

# 13 Color System

Primary

#2563eb

Gray scale

gray-50 #fafafa

gray-100 #f4f4f5

gray-200 #e4e4e7

gray-300 #d4d4d8

gray-400 #a1a1aa

gray-500 #71717a

gray-700 #3f3f46

gray-900 #18181b

---

# 14 Spacing System

Spacing scale

4px

8px

12px

16px

24px

32px

40px

48px

---

# 15 Animation Rules

Use minimal animation.

Hover transitions

150ms ease

Avoid heavy animation.

---

# 16 Responsive Blueprint

Desktop

Sidebar + Article + TOC

Tablet

Sidebar becomes drawer

Mobile

Header + Article only

TOC hidden

---

# 17 Image Handling

Images must be responsive.

max-width: 100%

border-radius: 8px

margin: 16px 0

---

# 18 UI Helper Hooks

Recommended hooks

useTheme

useToc

useScrollSpy

useSidebarState

These hooks must not affect project architecture.

---

# 19 Implementation Rules

Do not change:

project structure
router
data layer

Allowed:

update layout
improve styling
add helper hooks
add UI utilities

---

# END

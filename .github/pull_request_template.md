# 🚀 Pull Request: Profile Management & User Personalization

## 📚 Overview
This PR implements or updates user profile management, including display name, avatar, and email notification preferences.

---

## ✅ Checklist: Feature Requirements

- [ ] **User Entity/DTOs**
  - [ ] `displayName` (string, optional, max length 50)
  - [ ] `avatarUrl` (string, optional, valid URL)
  - [ ] `emailPreferences` (object: `{ promotional: boolean; transactional: boolean }`)
  - [ ] DTOs validate all fields appropriately

- [ ] **Profile Update Endpoint**
  - [ ] `PATCH /users/profile` endpoint exists
  - [ ] Accepts and validates payload for displayName, avatarUrl, emailPreferences
  - [ ] Uses DTOs and validation pipes

- [ ] **Avatar Upload Handling**
  - [ ] Supports avatar file upload (e.g., `POST /users/profile/avatar`)
  - [ ] Accepts only image files, enforces size/type limits
  - [ ] Stores avatars in `/uploads` or remote storage
  - [ ] Returns accessible `avatarUrl` after upload

- [ ] **Security & Data Integrity**
  - [ ] Only authenticated users can update their own profile
  - [ ] `updatedAt` field updates on profile change

- [ ] **System-Wide Reflection**
  - [ ] Profile changes are visible in user dashboard, leaderboards, notifications, etc.
  - [ ] API/UI returns updated profile data immediately

- [ ] **Email Preferences**
  - [ ] Email preference toggles are respected by the mail/notification system

- [ ] **Testing & Coverage**
  - [ ] Unit tests for update logic and validation
  - [ ] E2E tests for profile update and avatar upload
  - [ ] ≥ 90% test coverage for profile management logic

---

## 📝 Description
<!-- Describe your changes, implementation details, and any design decisions. -->

---

## 🧪 How to Test
- [ ] Update profile via `PATCH /users/profile`
- [ ] Upload avatar via `POST /users/profile/avatar`
- [ ] Check updated fields in API/UI
- [ ] Verify email preferences are respected
- [ ] Run all tests and check coverage

---

## 📸 Screenshots (if applicable)
<!-- Attach screenshots or screen recordings for UI changes. -->

---

## 🔗 Related Issues/PRs
<!-- Link to related issues, feature requests, or previous PRs. -->

---

## 🙏 Reviewer Notes
- [ ] All acceptance criteria are met
- [ ] Code is clean, documented, and follows conventions
- [ ] No sensitive data or secrets are exposed 
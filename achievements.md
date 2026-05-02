# Achievements

## Verification Strategy: Automatic

Achievements are granted automatically when a qualifying action occurs. No manual approval required. Each achievement is checked at the point of the relevant user action (rating submission, check-in, booking).

The `UserAchievement` join table stores a `status` field (`APPROVED` | `PENDING`) to support future manual review for edge cases, but all current achievements default to `APPROVED` on grant.

Total: **7 general + 120 per-library (24 libraries × 5 tiers) = 127 achievements**

---

## General Achievements (7)

| Key | Name | Description | Trigger |
|-----|------|-------------|---------|
| `first_rating` | Critic | Submit your first library rating. | On rating submit — user has exactly 1 rating |
| `ten_ratings` | Super Critic | Submit 10 library ratings. | On rating submit — user has exactly 10 ratings |
| `night_owl` | Night Owl | Check in after midnight. | On rating submit — `createdAt` hour is 0–3 |
| `early_bird` | Early Bird | Check in before 8am. | On rating submit — `createdAt` hour is before 8 |
| `library_hopper` | Library Hopper | Visit 5 different libraries. | On rating submit — user has rated 5+ distinct libraries |
| `all_libraries` | Berkeley Scholar | Visit every library on campus. | On rating submit — user has rated all libraries in the `Library` table |
| `first_booking` | First Steps | Book a room in any library for the first time. | On room booking (LibCal webhook or polling) — user has 0 prior bookings |

---

## Per-Library Achievements (24 libraries × 5 tiers)

Each library has 5 tiered visit achievements. A "visit" is counted as a rating submission for that library.

### Tiers

| Suffix | Visits | Tier Name |
|--------|--------|-----------|
| `_5`   | 5      | Regular   |
| `_10`  | 10     | Veteran   |
| `_25`  | 25     | Devotee   |
| `_50`  | 50     | Expert    |
| `_100` | 100    | Master    |

**Key pattern:** `visit_<keyPrefix>_<count>` — e.g. `visit_moffitt_10` = "Moffitt Library Veteran"

**Trigger:** On rating submit — check count of user's ratings where `libraryName` matches the library's name.

### Libraries

| Key Prefix | Library Name (exact DB match) |
|------------|-------------------------------|
| `art_history` | Art History/Classics Library |
| `bancroft` | Bancroft Library |
| `bampfa` | Berkeley Art Museum and Pacific Film Archive |
| `law` | Berkeley Law Library |
| `bioscience` | Bioscience, Natural Resources & Public Health Library |
| `business` | Business Library |
| `chemistry` | Chemistry, Astronomy & Physics Library |
| `doe` | Doe Library |
| `earth_sciences` | Earth Sciences & Map Library |
| `east_asian` | East Asian Library |
| `engineering` | Engineering & Mathematical Sciences Library |
| `environmental` | Environmental Design Library |
| `ethnic_studies` | Ethnic Studies Library |
| `graduate_services` | Graduate Services (study only) |
| `igs` | Institute of Governmental Studies Library |
| `its` | Institute of Transportation Studies Library |
| `main_stacks` | Main (Gardner) Stacks |
| `moffitt` | Moffitt Library (temporarily closed) |
| `morrison` | Morrison Library |
| `music` | Music Library |
| `newspapers` | Newspapers & Microforms Library |
| `social_research` | Social Research Library |
| `south_asia` | South/Southeast Asia Library (study only) |
| `slf_north` | Systemwide Library Facility-North |

---

## Schema Requirements

### `Achievement` model
```prisma
model Achievement {
  id          Int               @id @default(autoincrement())
  key         String            @unique
  name        String
  description String
  icon        String?
  users       UserAchievement[]
}
```

### `UserAchievement` join table
```prisma
model UserAchievement {
  id            Int         @id @default(autoincrement())
  userId        Int
  achievementId Int
  status        String      @default("APPROVED") // APPROVED | PENDING
  earnedAt      DateTime    @default(now())
  user          User        @relation(fields: [userId], references: [id])
  achievement   Achievement @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
}
```

### `User` model additions
```prisma
achievements UserAchievement[]
```

---

## Implementation Notes

- **Trigger point:** All rating-based achievements are checked inside the rating submission handler, after the new `Rating` row is written.
- **`first_booking`:** Requires a LibCal integration point (webhook or scheduled poll). This is the only achievement that cannot be triggered from the existing rating flow. Grant with `status: PENDING` until that integration exists.
- **Idempotency:** The `@@unique([userId, achievementId])` constraint prevents duplicates at the DB level. Use `upsert` in the grant helper.
- **Helper function:** A single `grantAchievement(userId, achievementKey)` utility should handle the lookup + upsert so each trigger site stays simple.
- **Per-library trigger:** On each rating submit, check all 5 tiers for that specific library. Only grant tiers the user hasn't already earned.

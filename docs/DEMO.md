# Live Demo Script – v0.1 (M1–M4)

Five minutes, in class on Monday 16 November 2026. All data is synthetic; every demo account uses the password `Demo1234!`.

## Before class

1. Pull `main`, then follow the README from "Install Backend Dependencies" to "Start the Frontend".
2. Reset the data right before the demo, so the week of 16 November has its events and tasks:
   ```bash
   cd backend
   npm run seed
   ```
3. Open four private browser windows and log in once in each, so you never log out during the demo:

   | Window | Account | Lands on |
   |---|---|---|
   | Parent | `parent@demo.test` | Çocuklarım |
   | Teacher | `teacher@demo.test` | Bağlı olduğum çocuklar |
   | Doctor | `doctor@demo.test` | Bağlı olduğum çocuklar (empty) |
   | Child | `child@demo.test` | Görevlerim |

4. Keep a GitHub tab on the Actions page and a Jira tab on the Sprint 2 board.

## Script

| # | Window | Action | What it shows |
|---|---|---|---|
| 1 | Login page | Log in with a wrong password. | FR-M1-02: the error message, no access |
| 2 | Doctor | The list is empty. Paste the child page address from the parent window. | FR-M2-03/04: the API answers 403, the page says "Erişim izniniz yok" |
| 3 | Parent | Ege Örnek → **Uzmanlar**. Add `kimse@demo.test`. | FR-M2-05: "Bu e-posta adresiyle kayıtlı bir uzman bulunamadı." |
| 4 | Parent | Add `doctor@demo.test`. | FR-M2-01: Aylin Doktor appears in the list |
| 5 | Doctor | Reload. Ege Örnek appears; open it. | Access follows the link |
| 6 | Parent | **Görevler** → assign "Top yakalama", Motor, due Wednesday 18 November. | M4: the task appears as "Bekliyor" |
| 7 | Teacher | Ege Örnek → **Haftalık takvim** → add "Okuma saati", Thursday 19 November 15:00–16:00. | M3: the event appears on Thursday |
| 8 | Child | **Görevlerim** → "Tamamladım" on "Top yakalama". Then **Haftalık takvim**. | M4: done; M3: the child sees the teacher's event, read only |
| 9 | Parent | **Görevler** → reload. | The task shows "Tamamlandı" with the date |
| 10 | Parent | **Uzmanlar** → Kaldır on Aylin Doktor → confirm. | FR-M2-02/07: confirmation before removing |
| 11 | Doctor | Reload. | Access is gone at once, with the same token |
| 12 | GitHub / Jira | Show the green CI run (backend, frontend, Playwright) and the board. | First E2E test in CI, work tracked in Jira |

## If something goes wrong

- **Backend not reachable:** the page says "Backend'e ulaşılamıyor". Start it with `npm run dev` in `backend` and press "Tekrar dene".
- **Data changed during rehearsal:** run `npm run seed` again, then log in again in every window. The seed creates the accounts anew, so old sessions end.
- **Wrong week shown:** use "Önceki hafta" / "Sonraki hafta"; the demo data is in the week of 16 November.

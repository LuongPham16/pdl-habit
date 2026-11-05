# Product research

Các pattern được chọn cho PDL Habit:

- **Habitica**: phân biệt hành vi lặp lại, daily có lịch và reward; PDL Habit giữ mô hình build/limit và cue/reward nhưng không dùng hình phạt gây áp lực.
- **Streaks**: check-in ngắn, lịch lặp tùy chỉnh, habit cần hạn chế và thống kê streak.
- **Habitify**: nhóm habit theo Morning/Afternoon/Evening để giảm tải danh sách trong ngày.
- **Loop Habit Tracker**: lịch linh hoạt, heatmap và thống kê consistency theo thời gian.
- **UI UX Pro Max**: habit tracker dùng streak amber, progress green, micro-interaction, heatmap và progress ring; implementation được điều chỉnh về flat, compact UI để hợp Obsidian.

Phạm vi v1 chủ ý local-first. Push notification, social accountability, HealthKit/Google Fit và cloud sync riêng không được thêm vì Obsidian đã đảm nhiệm local vault/sync, còn các integration đó cần native service và quyền riêng tư riêng.

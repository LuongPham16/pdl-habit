# PDL Habit v1.3

PDL Habit là habit tracker Markdown-first cho Obsidian. Mỗi habit là một note độc lập; check-in được lưu trong frontmatter `history`, vì vậy dữ liệu vẫn đọc được khi plugin không hoạt động.

## Bắt đầu

1. Bật **PDL Habit** trong Community plugins.
2. Bấm biểu tượng mầm cây ở ribbon hoặc chạy **Open habit dashboard**.
3. Chọn **New habit**, đặt lịch và mục tiêu.
4. Bấm vòng tròn cạnh habit để check-in nhanh; với mục tiêu lớn hơn 1, mở chi tiết để nhập số lượng và ghi chú.

Mặc định, note habit nằm tại `03 - Area/Habits`. Có thể đổi folder trong Settings.

## Today (thiết kế lại ở v1.3)

Màn Today đọc từ trên xuống theo một cột duy nhất:

1. **Tiêu đề ngày** — thứ/ngày, số habit đã xong, bộ lọc buổi (All / Morning / Afternoon / Evening / Anytime) và nút chuyển ngày `‹ Today ›`.
2. **Dải tuần** — 7 ô ngày kèm thanh tiến độ. Bấm một ô để nhảy sang ngày đó; hôm nay tô amber, ngày xong hết chuyển xanh.
3. **Khối tiến độ** — vòng tròn `đã xong/tổng`, câu động viên theo trạng thái, và pill **Next up** để check-in habit kế tiếp chỉ với một lần bấm. Bên phải là ba chỉ số: chuỗi ngày, số ngày hoàn hảo trong tuần, số check-in trong tuần.
4. **Kế hoạch** — các nhóm Morning / Afternoon / Evening / Anytime có icon, số `x/y` và dấu ✓ khi xong nhóm. Buổi trống tự ẩn, không còn khung rỗng.

Mỗi hàng habit gồm:

- vòng check mang màu của habit (đã xong: đặc, màu trắng; planned rest: viền nét đứt),
- tên habit + các chip: lịch (Every day / 3 / week / Mon, Wed…), chuỗi ngày (flame), tiến độ (`1/3 ly` hoặc `2/3 this week`),
- chấm tiến độ cho habit có mục tiêu số lượng,
- nút ghi chú (hiện khi hover) để mở sheet nhập số lượng / ghi chú / planned rest.

Bấm vào tên habit để mở chi tiết: streak, tỉ lệ 30 ngày, heatmap 28 ngày và lịch sử check-in.

Ngày không có habit nào sẽ hiện thẻ **A clear day** gọn với nút tạo habit mới; nếu bộ lọc buổi không có mục nào thì có link **Show the whole day**.

## Tính năng

- **Today**: dải tuần, khối tiến độ có Next up, kế hoạch theo buổi, lọc theo buổi và duyệt ngày.
- **Habits**: toàn bộ habit, current/best streak, tỷ lệ 30 ngày, check-in 7 ngày gần nhất.
- **Calendar**: mức hoàn thành từng ngày, click một ngày để xem và check-in hồi tố.
- **Insights**: tỷ lệ hoàn thành, streak tổng, habit ổn định nhất, ngày nghỉ có kế hoạch và reflection gần đây.
- **Flexible schedule**: hằng ngày, ngày tùy chọn hoặc mục tiêu theo tuần.
- **Build / Limit**: xây habit tốt hoặc theo dõi giới hạn hành vi muốn giảm.
- **Planned rest**: ngày nghỉ không làm đứt streak.
- **Archive**: habit được lưu trữ thủ công hoặc tự chuyển khỏi màn hình hoạt động khi `end_date` đã qua; restore giữ nguyên lịch sử và đưa habit trở lại Today/Habits.
- **Icon library**: chọn trong 84 Lucide icon theo 7 nhóm; icon dùng chung màu accent của habit.
- **Commands**: mở dashboard, tạo habit và check-in từ Command Palette.

## Schema note

```yaml
---
type: habit
title: "Read 20 pages"
category: Learning
period: evening
direction: build
frequency: daily
days: [1, 2, 3, 4, 5]
target: 20
unit: pages
icon: book-open
color: "#d97706"
start_date: 2026-08-17
end_date:
cue: "After dinner"
reward: "Tea and music"
archived: false
history:
  2026-08-17:
    value: 20
    note: "Easy chapter"
    updated: "2026-08-17T12:00:00.000Z"
llm_managed: true
---
```

Không đổi thủ công key ngày trong `history` sang định dạng khác `YYYY-MM-DD`.

## Nguyên tắc thiết kế

PDL Habit ưu tiên nhịp bền vững thay vì phạt chuỗi ngày: mục tiêu nhỏ, check-in nhanh, nghỉ có chủ đích, reflection ngắn và analytics để nhận ra xu hướng.

Về giao diện: amber cho streak, green cho tiến độ, mỗi khối là một card trên nền canvas, typography 10–26px với metadata tối thiểu 11–12px, icon Lucide của Obsidian, focus state chuẩn, hỗ trợ dark mode, màn hẹp 560px và `prefers-reduced-motion`.

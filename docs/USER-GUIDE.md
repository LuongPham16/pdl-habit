# PDL Habit v1.4

PDL Habit là habit tracker Markdown-first cho Obsidian. Mỗi habit là một note độc lập; check-in được lưu trong frontmatter `history`, vì vậy dữ liệu vẫn đọc được khi plugin không hoạt động.

## Bắt đầu

1. Bật **PDL Habit** trong Community plugins.
2. Bấm biểu tượng mầm cây ở ribbon hoặc chạy **Open habit dashboard**.
3. Chọn **New habit**, đặt lịch và mục tiêu.
4. Bấm vòng tròn cạnh habit để check-in nhanh; với mục tiêu lớn hơn 1, mở chi tiết để nhập số lượng và ghi chú.

Mặc định, note habit nằm tại `03 - Area/Habits`. Có thể đổi folder trong Settings.

## Bốn tab, một kiểu trình bày

Cả bốn tab dùng chung một khung: eyebrow nhỏ → tiêu đề lớn → một dòng tóm tắt → điều khiển ở bên phải. Mọi khối nội dung là card trên nền canvas, tiêu đề khối viết hoa nhỏ và số đếm ở bên phải.

### Today

1. **Tiêu đề ngày** — thứ/ngày, số habit đã xong, bộ lọc buổi (All / Morning / Afternoon / Evening / Anytime) và nút chuyển ngày `‹ Today ›`.
2. **Dải tuần** — 7 ô ngày kèm thanh tiến độ; bấm để nhảy sang ngày đó. Hôm nay tô amber, ngày xong hết chuyển xanh.
3. **Khối tiến độ** — vòng tròn `đã xong/tổng`, câu theo trạng thái, pill **Next up** để check-in habit kế tiếp một lần bấm. Bên phải: chuỗi ngày, số ngày hoàn hảo trong tuần, số check-in trong tuần.
4. **Kế hoạch** — nhóm Morning / Afternoon / Evening / Anytime có icon, `x/y` và dấu ✓ khi xong nhóm. Buổi trống tự ẩn.

Hàng habit gồm vòng check mang màu habit, tên, chip lịch/streak/tiến độ, chấm tiến độ cho habit số lượng và nút ghi chú (hiện khi hover). Bấm vào tên để mở chi tiết.

### Habits

- Danh sách toàn bộ habit: icon + tên, lịch và tỉ lệ 30 ngày, **7 ngày gần nhất** dạng ô bấm được (bấm để check-in hoặc mở sheet), streak hiện tại.
- Chuyển **Active / Archived** ngay trên tiêu đề. **Archive không còn là tab riêng** — habit hết `end_date` hoặc được archive thủ công nằm trong scope này.
- Bấm vào một hàng để mở chi tiết, nơi có đủ **Edit / Archive (Restore) / Delete**. Danh sách không còn cột nút thao tác.

### Calendar

- Lưới tháng với `x/y` và thanh tiến độ từng ngày; ngày tương lai chỉ hiện số, không hiện `0/n`.
- Dòng tóm tắt trên tiêu đề: số ngày có check-in, số ngày hoàn hảo, tỉ lệ hoàn thành tháng.
- Bấm một ngày để mở ngày đó trong Today; chân card nhắc lại thao tác này.

### Insights

- Ba thẻ số: **Completion** (30 ngày, tính theo từng habit nên habit 3 lần/tuần được tính theo tuần), **Perfect days**, **Planned rest**.
- **Per habit** — danh sách thanh tiến độ xếp từ cao xuống thấp; habit ổn định nhất luôn ở đầu nên không cần thêm thẻ riêng.
- **Recent reflections** — các ghi chú đã nhập khi check-in, mới nhất trước.

## Tính năng

- **Today**: dải tuần, khối tiến độ có Next up, kế hoạch theo buổi, lọc theo buổi, duyệt ngày.
- **Habits**: danh sách habit + check-in 7 ngày gần nhất, streak, tỉ lệ 30 ngày, scope Active/Archived.
- **Calendar**: mức hoàn thành từng ngày, tóm tắt tháng, mở ngày để check-in hồi tố.
- **Insights**: tỉ lệ hoàn thành, ngày hoàn hảo, ngày nghỉ có kế hoạch, thanh tiến độ từng habit và reflection gần đây.
- **Flexible schedule**: hằng ngày, ngày tùy chọn hoặc mục tiêu theo tuần.
- **Build / Limit**: xây habit tốt hoặc theo dõi giới hạn hành vi muốn giảm.
- **Planned rest**: ngày nghỉ không làm đứt streak.
- **Archive**: habit tự rời màn hình hoạt động khi hết `end_date` hoặc được archive thủ công; restore giữ nguyên lịch sử.
- **Icon library**: 84 Lucide icon theo 7 nhóm, dùng chung màu accent của habit.
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

Về giao diện: amber cho streak, green cho tiến độ, mỗi khối là một card trên nền canvas, typography 10–26px với metadata tối thiểu 11–12px, cùng một page header cho mọi tab, icon Lucide của Obsidian, focus state chuẩn, hỗ trợ dark mode, màn hẹp 560px và `prefers-reduced-motion`.

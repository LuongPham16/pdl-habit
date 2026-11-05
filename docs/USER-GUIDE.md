# PDL Habit v1.8

PDL Habit là habit tracker Markdown-first cho Obsidian. Mỗi habit là một note độc lập; check-in được lưu trong frontmatter `history`, vì vậy dữ liệu vẫn đọc được khi plugin không hoạt động.

## Bắt đầu

1. Bật **PDL Habit** trong Community plugins.
2. Bấm biểu tượng mầm cây ở ribbon hoặc chạy **Open habit dashboard**.
3. Bấm **New habit**, gõ tên là xong — các bước còn lại đã có mặc định hợp lý.
4. Bấm vòng tròn cạnh habit để check-in nhanh; với mục tiêu lớn hơn 1, mở chi tiết để nhập số lượng và ghi chú.

Mặc định, note habit nằm tại `03 - Area/Habits`. Có thể đổi folder trong Settings.

## Tạo habit nhanh (v1.6)

Form chỉ còn **4 quyết định**, tất cả trên một màn hình:

1. **Name** — gõ tên. Ô này tự focus khi mở form.
2. **Type** — *Did it* / *Count* / *Limit*:
   - **Did it**: một lần bấm là xong, không cần số lượng.
   - **Count**: hiện thêm `Amount per day` + đơn vị (ly, trang, phút…).
   - **Limit**: hiện `Max per day` — dùng cho habit muốn giảm (ví dụ đồ ngọt ≤ 2).
3. **When** — buổi trong ngày (Morning/Afternoon/Evening/Anytime) và lịch:
   - **Every day**, **Selected days** (hiện hàng chữ M/T/W/T/F/S/S để chọn), hoặc
   - **Times per week** — thay ô số lượng bằng `Times per week`; habit kiểu này tính theo **buổi/tuần**, không có "số lượng mỗi ngày".
4. **Look** — icon + 8 màu.

**More options** (mặc định đóng) chứa: Description, Category, Cue, Reward, Starts, Ends. Nút này ghi rõ số field đang dùng (ví dụ `More options · 2 set`) và **tự mở** khi bạn sửa một habit đã có dữ liệu trong đó.

Phím tắt: **Enter** lưu, **Esc** đóng, **⌘/Ctrl + Enter** lưu từ bất kỳ ô nào. Nút *Create habit* bị mờ cho tới khi có tên; footer luôn dính đáy nên không phải cuộn tìm nút.

Với habit "Did it", danh sách Today không còn hiện chip `0/1 time` vô nghĩa — vòng tròn check đã đủ nói. Trang chi tiết hiển thị Target là *Did it (once)*.

## Check-in một ngày (v1.8)

Mở sheet check-in bằng cách bấm nút ghi chú ở hàng habit, bấm một ngày trong lịch tháng ở trang chi tiết, hoặc mở habit có mục tiêu số lượng.

- **Count / Limit**: ô **Amount bắt đầu từ 0**, có nút **− / +** hai bên (0–99, nút − mờ khi đang 0; gõ số trực tiếp hoặc dùng phím ↑ ↓ cũng được). Dưới ô có dòng gợi ý cập nhật ngay:
  - Count: `0 of 3 ly` → khi đủ: `Goal reached (3 ly)`.
  - Limit: `Max 2 cái per day — stay under to keep the streak`; vượt hạn thì dòng này chuyển đỏ và báo `… over the limit`.
- **Did it / Times per week**: không hiện ô số lượng nữa mà là cặp **Done / Not done**. Chọn *Not done* rồi Save nghĩa là xoá check-in của ngày đó.
- **Clear** chỉ hiện khi ngày đó đã có dữ liệu; **Planned rest** vẫn luôn có.
- Ô **Note** để ghi lại điều gì giúp hoặc cản trở; **Save** xong vẫn có toast **Undo**.
- Tiêu đề sheet hiện ngày dễ đọc (`Fri, Nov 6`) thay vì `2026-11-06`.

## Bốn tab, một kiểu trình bày

Cả bốn tab dùng chung một khung: eyebrow nhỏ → tiêu đề lớn → một dòng tóm tắt → điều khiển ở bên phải. Mọi khối nội dung là card trên nền canvas, tiêu đề khối viết hoa nhỏ và số đếm ở bên phải.

### Today

1. **Tiêu đề ngày** — thứ/ngày, số habit đã xong, bộ lọc buổi (All / Morning / Afternoon / Evening / Anytime) và nút chuyển ngày `‹ Today ›`.
2. **Dải tuần** — 7 ô ngày kèm thanh tiến độ; bấm để nhảy sang ngày đó. Hôm nay tô amber, ngày xong hết chuyển xanh.
3. **Khối tiến độ** — vòng tròn `đã xong/tổng`, câu theo trạng thái, pill **Next up** để check-in habit kế tiếp một lần bấm. Bên phải: chuỗi ngày, số ngày hoàn hảo trong tuần, số check-in trong tuần.
4. **Kế hoạch** — nhóm Morning / Afternoon / Evening / Anytime có icon, `x/y` và dấu ✓ khi xong nhóm. Buổi trống tự ẩn.

Hàng habit gồm vòng check mang màu habit, tên, chip lịch/streak/tiến độ, chấm tiến độ cho habit số lượng và nút ghi chú (hiện khi hover). Bấm vào tên để mở chi tiết.

### Chi tiết habit: lịch tháng

Bấm tên habit (ở Today hoặc Habits) để mở chi tiết. Phần dưới cùng là **lịch một tháng** thay cho dải 28 ngày và danh sách "Recent check-ins" cũ:

- **Điều hướng tháng**: `‹ Today ›` ở góc phải tiêu đề; mỗi lần hiển thị đúng một tháng.
- **Dòng tóm tắt**: `x/y done · n perfect days` của tháng đang xem.
- **5 màu trạng thái**, có legend ngay dưới lịch:
  - **Done** — tô đặc bằng màu habit (đã đạt mục tiêu ngày).
  - **Partial** — nền nhạt cùng màu habit (làm một phần, ví dụ 1/3 ly).
  - **Missed** — nền đỏ rất nhạt (có lịch nhưng không làm).
  - **Rest** — nền xám + viền nét đứt (planned rest, không tính là bỏ).
  - **Today** — vòng amber quanh ô, độc lập với màu trạng thái.
- Ngày không có lịch: viền nét đứt rất mờ; ngày tương lai: mờ hơn; ngày của tháng khác: trung tính, không tô màu.
- Bấm một ngày có lịch để mở sheet check-in của đúng ngày đó (sửa số lượng, ghi chú, planned rest hoặc xoá).

### Habits

- Danh sách toàn bộ habit: icon + tên, lịch và tỉ lệ 30 ngày, **7 ngày gần nhất** dạng ô bấm được (bấm để check-in hoặc mở sheet), streak hiện tại.
- **Thanh công cụ** phía trên danh sách:
  - **Tìm kiếm** theo tên, category, mô tả hoặc đơn vị (không phân biệt hoa thường), có nút xoá nhanh.
  - **Lọc theo category** — danh sách category lấy từ chính habit của bạn; mặc định "All categories".
  - **Sắp xếp**: Title A–Z, Streak, 30-day rate hoặc **Category** (khi chọn Category, các hàng được nhóm dưới tiêu đề category).
- Dòng đếm ở đầu danh sách cho biết `3 of 12 habits` khi đang lọc; không có kết quả thì có nút **Clear filters**.
- Ô tìm kiếm chỉ vẽ lại phần danh sách nên không mất focus khi đang gõ.
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

## Hoàn tác và nhắc nhở (v1.5)

### Hoàn tác

Mọi thay đổi check-in đều hiện một toast nhỏ ở góc dưới phải trong 8 giây, kèm nút **Undo**:

- bấm vòng tròn để check-in nhanh,
- **Save** trong sheet nhập số lượng / ghi chú,
- **Planned rest** (ngày nghỉ có kế hoạch),
- **Clear** (xoá check-in).

Undo ghi lại **đúng entry frontmatter trước đó** (kể cả `note`, `status: skip` và `updated`), nên không làm mất ghi chú. Có thể đóng toast bằng nút ×; tối đa 3 toast cùng lúc.

### Nhắc nhở hằng ngày

Vào **Settings → PDL Habit → Reminders**:

- **Daily reminder** — bật/tắt.
- **Reminder time** — giờ nhắc (mặc định 20:00).
- **Preview reminder** — hiện thử ngay để xem toast trông thế nào.

Cách hoạt động: mỗi phút plugin kiểm tra một lần; nhắc sẽ hiện **đúng một lần mỗi ngày**, chỉ khi **còn habit chưa xong**, và chỉ trong **3 giờ sau giờ đã đặt** (mở Obsidian lúc 23:30 với giờ nhắc 9:00 thì sẽ không nhắc bù). Nếu hôm đó đã xong hết thì plugin ghi nhận và không làm phiền.

Toast nhắc nhở có nút **Open today** để mở thẳng tab Today đúng ngày. Lưu ý: Obsidian không có thông báo nền, nên nhắc chỉ chạy khi Obsidian đang mở; nếu app đóng, lần mở kế tiếp trong khung 3 giờ vẫn sẽ nhắc.

## Tính năng

- **Today**: dải tuần, khối tiến độ có Next up, kế hoạch theo buổi, lọc theo buổi, duyệt ngày.
- **Habits**: danh sách habit + check-in 7 ngày gần nhất, streak, tỉ lệ 30 ngày, scope Active/Archived, tìm kiếm + lọc category + sắp xếp.
- **Calendar**: mức hoàn thành từng ngày, tóm tắt tháng, mở ngày để check-in hồi tố.
- **Insights**: tỉ lệ hoàn thành, ngày hoàn hảo, ngày nghỉ có kế hoạch, thanh tiến độ từng habit và reflection gần đây.
- **Undo**: hoàn tác mọi check-in / planned rest / clear trong 8 giây.
- **Reminder**: nhắc một lần mỗi ngày khi còn habit chưa xong (chạy khi Obsidian mở).
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

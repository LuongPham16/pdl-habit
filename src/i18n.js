/**
 * Minimal translation layer. Keys are the English source strings; the Vietnamese
 * table maps them one to one. Anything missing falls back to English.
 *
 * `t(text, vars)` translates with `{placeholder}` interpolation.
 * `tp(count, one, many)` pluralises for English and drops the plural for Vietnamese.
 */

const VI = {
  // Tabs & page heads
  Today: 'Hôm nay',
  Habits: 'Thói quen',
  Calendar: 'Lịch',
  Insights: 'Phân tích',
  'All habits': 'Tất cả thói quen',
  Archive: 'Lưu trữ',
  Active: 'Đang dùng',
  Archived: 'Đã lưu trữ',
  Plan: 'Kế hoạch',
  'Per habit': 'Theo thói quen',
  'Recent reflections': 'Ghi chú gần đây',
  'More options': 'Tuỳ chọn thêm',
  Look: 'Hiển thị',
  Name: 'Tên',
  Type: 'Kiểu',
  When: 'Thời điểm',
  Amount: 'Số lượng',
  'Amount per day': 'Số lượng mỗi ngày',
  'Max per day': 'Tối đa mỗi ngày',
  Description: 'Mô tả',
  Category: 'Nhóm',
  Cue: 'Gợi ý',
  Reward: 'Phần thưởng',
  Starts: 'Bắt đầu',
  'Ends (optional)': 'Kết thúc (không bắt buộc)',
  Status: 'Trạng thái',
  'Note (optional)': 'Ghi chú (không bắt buộc)',
  Streak: 'Chuỗi',
  Habit: 'Thói quen',
  'Times per week': 'Lần mỗi tuần',
  'Times per month': 'Lần mỗi tháng',
  'Every N days': 'Mỗi N ngày',
  'Every day': 'Mỗi ngày',
  'Selected days': 'Ngày chọn',
  'Did it': 'Đã làm',
  Count: 'Số lượng',
  Limit: 'Giới hạn',
  Done: 'Đã làm',
  'Not done': 'Chưa làm',
  'All categories': 'Tất cả nhóm',
  'Search habits': 'Tìm thói quen',
  'No habits yet': 'Chưa có thói quen nào',
  'No habits match': 'Không có thói quen phù hợp',
  'Nothing archived yet': 'Chưa có gì trong lưu trữ',
  'Clear filters': 'Xoá bộ lọc',
  'New habit': 'Thói quen mới',
  'Create habit': 'Tạo thói quen',
  'Save changes': 'Lưu thay đổi',
  'Edit habit': 'Sửa thói quen',
  Cancel: 'Huỷ',
  Save: 'Lưu',
  Clear: 'Xoá',
  Undo: 'Hoàn tác',
  Dismiss: 'Đóng',
  Preview: 'Xem thử',
  Apply: 'Áp dụng',
  Duplicate: 'Nhân bản',
  Pin: 'Ghim',
  Unpin: 'Bỏ ghim',
  'Move up': 'Lên trên',
  'Move down': 'Xuống dưới',
  Select: 'Chọn',
  Selected: 'Đã chọn',

  // Periods
  Morning: 'Buổi sáng',
  Afternoon: 'Buổi chiều',
  Evening: 'Buổi tối',
  Anytime: 'Bất kỳ lúc nào',

  // Hero & plan copy
  'Start with one small win': 'Bắt đầu bằng một việc nhỏ',
  'Keep the rhythm': 'Giữ nhịp',
  'Day complete': 'Xong việc hôm nay',
  'Next up': 'Tiếp theo',
  'Check in': 'Ghi nhận',
  '{n} planned. Progress matters more than perfection.': '{n} việc hôm nay. Tiến bộ quan trọng hơn hoàn hảo.',
  'All {n} checked off. Rest is part of the plan.': `Đã xong cả {n}. Nghỉ ngơi cũng là một phần kế hoạch.`,
  '{n} left today. You are already {percent}% through.': `Còn {n} hôm nay. Bạn đã đi được {percent}%.`,
  'A clear day': 'Hôm nay trống lịch',
  'Nothing scheduled': 'Không có gì được lên lịch',
  'No habits scheduled for this day.': 'Không có thói quen nào cho ngày này.',
  'No habits are due here. Add one, or review another day while the day stays light.': 'Không có thói quen nào tới hạn. Thêm một cái, hoặc xem ngày khác khi hôm nay nhẹ nhàng.',
  'Back to today': 'Về hôm nay',
  'Show the whole day': 'Xem cả ngày',
  'No habits scheduled today — a good day to add one.': 'Hôm nay không có thói quen nào — là dịp tốt để thêm một cái.',
  'Day complete — everything is checked off.': 'Xong việc hôm nay — mọi thứ đã được ghi nhận.',
  '1 habit left today. Still time for a small win.': 'Còn 1 thói quen hôm nay. Vẫn kịp một việc nhỏ.',
  '{n} habits left today. Still time for a small win.': `Còn {n} thói quen hôm nay. Vẫn kịp một việc nhỏ.`,
  'Open today': 'Mở hôm nay',
  'Tap a day to open it in Today.': 'Bấm một ngày để mở trong tab Hôm nay.',
  'Nothing checked in yet this month.': 'Tháng này chưa ghi nhận ngày nào.',

  // Insights
  'Completion': 'Tỉ lệ hoàn thành',
  'Perfect days': 'Ngày hoàn hảo',
  'Planned rest': 'Nghỉ có kế hoạch',
  'Planned rest days': 'Ngày nghỉ có kế hoạch',
  'check-ins': 'lượt ghi nhận',
  '{done}/{total} check-ins': '{done}/{total} lượt ghi nhận',
  'Consistency, not a scorecard of worth.': 'Nhìn sự đều đặn, không phải bảng điểm giá trị bản thân.',
  'No habit data yet': 'Chưa có dữ liệu thói quen',
  'Add a habit and check in for a few days — the trend shows up here.': 'Thêm một thói quen và ghi nhận vài ngày — xu hướng sẽ hiện ở đây.',
  'Completion trend': 'Xu hướng hoàn thành',
  'By weekday': 'Theo thứ trong tuần',
  'By category': 'Theo nhóm',
  'Losing momentum': 'Đang chững lại',
  'Nothing is slipping right now.': 'Hiện không có thói quen nào đi xuống.',
  'days': 'ngày',

  // Calendar
  'days logged': 'ngày có ghi nhận',
  'perfect': 'hoàn hảo',
  'complete': 'hoàn thành',

  // Detail
  'Current streak': 'Chuỗi hiện tại',
  'Best streak': 'Chuỗi dài nhất',
  'Last 30 days': '30 ngày qua',
  Time: 'Buổi',
  Schedule: 'Lịch',
  Target: 'Mục tiêu',
  Direction: 'Hướng',
  Started: 'Bắt đầu',
  'Build habit': 'Xây thói quen',
  'Limit behavior': 'Giới hạn hành vi',
  'Did it (once)': 'Đã làm (1 lần)',
  'planned rest': 'nghỉ có kế hoạch',
  'not scheduled': 'không có lịch',
  'upcoming': 'sắp tới',
  'missed': 'bỏ lỡ',
  'partial': 'một phần',
  'outside this month': 'ngoài tháng này',
  'No scheduled days this month': 'Tháng này không có ngày nào được lên lịch',

  // Settings
  'Small actions, visible progress': 'Việc nhỏ, tiến bộ thấy được',
  'PDL Habit settings': 'Cài đặt PDL Habit',
  'Habits folder': 'Thư mục thói quen',
  'Markdown habit notes live here': 'Các note thói quen (Markdown) nằm ở đây',
  'Week starts on': 'Tuần bắt đầu vào',
  Monday: 'Thứ hai',
  Sunday: 'Chủ nhật',
  'Default view': 'Tab mặc định',
  Language: 'Ngôn ngữ',
  'Interface language': 'Ngôn ngữ giao diện',
  Auto: 'Tự động',
  Reminders: 'Nhắc nhở',
  'Daily reminder': 'Nhắc nhở hằng ngày',
  'One gentle nudge a day, only when something is still open. Obsidian has to be running.': 'Một lần nhắc mỗi ngày, chỉ khi còn việc chưa xong. Cần Obsidian đang mở.',
  'Reminder time': 'Giờ nhắc',
  'Shown once, at this time or up to three hours after.': 'Hiện một lần, đúng giờ này hoặc muộn nhất ba giờ sau.',
  'Preview reminder': 'Xem thử nhắc nhở',
  'Show the reminder now to check how it looks.': 'Hiện thử nhắc nhở để xem trông thế nào.',
  'PDL Habit settings saved.': 'Đã lưu cài đặt PDL Habit.',

  // Form
  'Name it, choose how it counts, and you are done.': 'Đặt tên, chọn cách tính, xong.',
  'Change what you repeat, or how it is measured.': 'Đổi việc bạn lặp lại, hoặc cách đo.',
  'One tap marks it done — no amount needed.': 'Một lần bấm là xong — không cần số lượng.',
  'Session-based habits are counted as check-ins, not amounts.': 'Thói quen theo buổi được tính theo lần ghi nhận, không theo số lượng.',
  'Optional. Description, category, cue, reward and dates.': 'Không bắt buộc: mô tả, nhóm, gợi ý, phần thưởng và ngày.',
  'Enter saves · Esc closes': 'Enter để lưu · Esc để đóng',
  'e.g. Read 20 pages': 'ví dụ: Đọc 20 trang',
  'Why this matters': 'Vì sao việc này quan trọng',
  'Health, Learning, Mindfulness': 'Sức khoẻ, Học tập, Chánh niệm',
  'After morning coffee': 'Sau ly cà phê sáng',
  'A favourite song': 'Một bài hát yêu thích',
  'unit — pages, ly, phút': 'đơn vị — trang, ly, phút',
  'Pick any colour': 'Chọn màu bất kỳ',
  'Choose an icon': 'Chọn biểu tượng',
  'icons organized by purpose.': 'biểu tượng, chia theo mục đích.',
  'Search icon name': 'Tìm tên biểu tượng',
  'No matching icons.': 'Không có biểu tượng phù hợp.',
  'Give the habit a name.': 'Hãy đặt tên cho thói quen.',
  'Pick at least one day.': 'Chọn ít nhất một ngày.',
  'End date must be after the start date.': 'Ngày kết thúc phải sau ngày bắt đầu.',
  'Times per week must be at least 1.': 'Số lần mỗi tuần phải ít nhất là 1.',
  'The amount must be at least 1.': 'Số lượng phải ít nhất là 1.',

  // Check-in
  'Decrease': 'Giảm',
  'Increase': 'Tăng',
  'Goal reached ({target})': 'Đã đạt mục tiêu ({target})',
  '{value} of {target}': '{value} / {target}',
  'Max {target} per day — stay under to keep the streak': 'Tối đa {target} mỗi ngày — giữ dưới mức để không đứt chuỗi',
  '{over} over the {target} limit': 'Vượt {over} so với mức {target}',
  'What helped or got in the way?': 'Điều gì giúp bạn, hoặc cản bạn?',
  'Check in a habit': 'Ghi nhận một thói quen',

  // Notices / actions
  'Check-in restored.': 'Đã khôi phục ghi nhận.',
  'Check-in cleared.': 'Đã xoá ghi nhận.',
  'Habit updated.': 'Đã cập nhật thói quen.',
  'Created {name}': 'Đã tạo {name}',
  'Habit archived.': 'Đã lưu trữ thói quen.',
  'Habit restored.': 'Đã khôi phục thói quen.',
  'Check-in cleared for {name}': 'Đã xoá ghi nhận cho {name}',
  '{name} checked in': 'Đã ghi nhận {name}',
  '{name} saved': 'Đã lưu {name}',
  'Planned rest saved for {name}': 'Đã lưu nghỉ có kế hoạch cho {name}',
  'Delete habit?': 'Xoá thói quen?',
  'Move to Trash': 'Chuyển vào thùng rác',
  'Open a habit to edit it, archive it or see its history.': 'Mở một thói quen để sửa, lưu trữ hoặc xem lịch sử.',
  'Open a habit to restore it, or delete it for good.': 'Mở một thói quen để khôi phục hoặc xoá hẳn.',
  'Start with one small action you can repeat tomorrow.': 'Bắt đầu bằng một việc nhỏ bạn có thể lặp lại ngày mai.',
  'Habits past their end date, or archived by hand, wait here. Restoring keeps their history.': 'Thói quen hết hạn hoặc được lưu trữ thủ công nằm ở đây. Khôi phục sẽ giữ nguyên lịch sử.',

  // Command palette
  'Open habit dashboard': 'Mở bảng điều khiển thói quen',
  'Undo last check-in': 'Hoàn tác ghi nhận gần nhất',
  'Open a day': 'Mở một ngày',
  'Quick add a habit': 'Thêm nhanh thói quen',
  'Add starter habits': 'Thêm bộ thói quen mẫu',
  'Pick a date': 'Chọn một ngày',
  Go: 'Đi',
  'Quick add': 'Thêm nhanh',
  'Habit name': 'Tên thói quen',
  'Daily, any time of day, one tap to check in.': 'Mỗi ngày, bất kỳ lúc nào, một lần bấm để ghi nhận.',
  'No check-in to undo.': 'Không có ghi nhận nào để hoàn tác.',
  'Added {n} starter habits.': 'Đã thêm {n} thói quen mẫu.',
  'Starter habits already exist.': 'Bộ thói quen mẫu đã có rồi.',
  'Drink water': 'Uống nước',
  'Eight glasses across the day.': 'Tám ly nước rải đều trong ngày.',
  'Walk 20 minutes': 'Đi bộ 20 phút',
  'Read 10 pages': 'Đọc 10 trang',
  'Workout 3 times a week': 'Tập thể dục 3 buổi/tuần',
  'Sleep before 23:00': 'Ngủ trước 23:00',
  glass: 'ly',
  page: 'trang',
  'Water': 'Uống nước',
  'Workout': 'Tập thể dục',
  'Tidy 10 minutes': 'Dọn dẹp 10 phút',

  // Units used by tp()
  habit: 'thói quen',
  'active habit': 'thói quen đang dùng',
  day: 'ngày',
  note: 'ghi chú',
  'check-in': 'lượt ghi nhận',

  // Fragments built at runtime
  All: 'Tất cả',
  'Filter by time of day': 'Lọc theo buổi',
  'Habit scope': 'Phạm vi thói quen',
  'Nothing scheduled in the {period} block today.': 'Hôm nay không có gì trong {period}.',
  '{schedule} · {period} · {rate}% in 30 days': '{schedule} · {period} · {rate}% trong 30 ngày',
  '{days} logged · {perfect} perfect · {rate}% complete': '{days} đã ghi nhận · {perfect} hoàn hảo · {rate}% hoàn thành',
  'in 30 days': 'trong 30 ngày',
  '{n} / week': '{n} lần/tuần',
  '{n} / month': '{n} lần/tháng',
  'Every {n} days': 'Mỗi {n} ngày',
  '{n} times per week': '{n} lần mỗi tuần',
  '{n} times per month': '{n} lần mỗi tháng',
  '{value} of {target} {unit}': '{value} / {target} {unit}',
  'Limit {target} {unit}': 'Tối đa {target} {unit}',
  '{value}/{target} this week': '{value}/{target} tuần này',
  '{value}/{target} this month': '{value}/{target} tháng này',
  'Try another word, or clear the filters to see everything again.': 'Thử từ khác, hoặc xoá bộ lọc để xem lại tất cả.',
  'Expired {date}': 'Hết hạn {date}',
  'Archived by hand': 'Lưu trữ thủ công',
  '{done} of {n} done': '{done} / {n} đã xong',
  '{n} planned rest': '{n} nghỉ có kế hoạch',
  'This week': 'Tuần này',
  'Jump to today': 'Về hôm nay',
  'day streak': 'ngày liên tiếp',
  'perfect days': 'ngày hoàn hảo',
  'this week': 'tuần này',
  done: 'xong',
  'of {n} days': 'trong {n} ngày',
  'at (optional)': 'lúc (không bắt buộc)',
  'Times per month must be at least 1.': 'Số lần mỗi tháng phải ít nhất là 1.',
  'The interval must be at least 1 day.': 'Khoảng cách phải ít nhất 1 ngày.',
  'Weekdays': 'Các ngày trong tuần',
  'streaks kept alive': 'giữ được chuỗi',
  'Previous {label}': 'Trước ({label})',
  'Next {label}': 'Sau ({label})',
  'Jump to this month': 'Về tháng này',
  'Previous month': 'Tháng trước',
  'Next month': 'Tháng sau',
  'Previous day': 'Ngày trước',
  'Next day': 'Ngày sau',
  'months': 'tháng',
  '{n} of {m}': '{n} / {m}'
};

export const LANGUAGES = [['auto', 'Auto'], ['en', 'English'], ['vi', 'Tiếng Việt']];

const WEEKDAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

let current = 'en';

/** `auto` follows the Obsidian interface language. */
export function resolveLanguage(setting = 'auto') {
  if (setting === 'vi' || setting === 'en') return setting;
  try {
    const stored = globalThis.window?.localStorage?.getItem('language');
    if (stored === 'vi' || stored === 'en') return stored;
  } catch (error) { /* ignore private-mode failures */ }
  const nav = String(globalThis.navigator?.language || 'en').toLowerCase();
  return nav.startsWith('vi') ? 'vi' : 'en';
}

export function setLanguage(value) {
  current = value === 'vi' ? 'vi' : 'en';
  return current;
}

export function currentLanguage() { return current; }

const interpolate = (text, vars) => (vars ? String(text).replace(/\{(\w+)\}/g, (match, key) => (vars[key] ?? match)) : String(text));

export function t(text, vars) {
  const table = current === 'vi' ? VI : null;
  const translated = (table && table[text]) || text;
  return interpolate(translated, vars);
}

/** True when the string has a Vietnamese translation (used by tests). */
export function hasTranslation(text) {
  return Object.prototype.hasOwnProperty.call(VI, text);
}

/** Pluralise: English adds an s, Vietnamese keeps the noun. */
export function tp(count, one, many = `${one}s`) {
  if (current === 'vi') return `${count} ${t(one)}`;
  return `${count} ${count === 1 ? one : many}`;
}

export function weekdayShort(day) {
  return current === 'vi' ? WEEKDAYS_VI[day] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
}

export function weekdayLabel(day) {
  return current === 'vi' ? ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][day] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
}

export { VI };

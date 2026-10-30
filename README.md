# Local Barcode Scanner — hướng dẫn sử dụng

Ứng dụng quét mã vạch/QR chạy hoàn toàn ngoại tuyến bằng HTML, CSS và JavaScript thuần. Không cần cài đặt, Node.js, npm, máy chủ, Internet, tài khoản hay cấp quyền USB. Thiết kế dành cho Windows 10/11 với Chrome hoặc Microsoft Edge.

## 1. Mở ứng dụng

1. Giải nén toàn bộ thư mục `local-barcode-scanner` vào máy tính. Giữ nguyên `css/` và `js/` cạnh `index.html`.
2. Nhấp đúp `index.html`. Nếu trình duyệt mặc định không phù hợp, chọn **Open with → Google Chrome / Microsoft Edge**.
3. Địa chỉ bắt đầu bằng `file:///`. Không mở trực tiếp từ bên trong ZIP.
4. Bấm **Focus Scanner** nếu ô Scan capture chưa được chọn. **Ready to Scan** chỉ có nghĩa là trang và ô nhập đang có tiêu điểm; ứng dụng không biết máy quét có được kết nối hay không.

Không có yêu cầu cài Node.js để chạy ứng dụng hoặc trang kiểm thử. Các file JS sử dụng script truyền thống với `defer`, không dùng ES modules, CDN, API mạng hay framework. Âm thanh ngắn được tổng hợp tại chỗ bằng Web Audio của trình duyệt.

## 2. Kết nối và quét

Cắm máy quét vào cổng USB. Trong tài liệu của máy quét, chọn chế độ **USB HID Keyboard / Keyboard Wedge**, không chọn serial/COM. Chọn layout bàn phím của máy quét giống layout Windows; thường có thể dùng English (US) cho mã ASCII. Có thể kiểm tra dữ liệu trước bằng Notepad.

Chọn **Enter suffix** (mặc định), bấm **Focus Scanner**, rồi quét `4549292144567`. Giá trị xuất hiện trong Latest Scan và Scan history; ô capture được xóa để nhận mã kế tiếp và giữ tiêu điểm. Giá trị luôn là chuỗi: `000123`, dấu cách đầu/cuối và mã dài không bị cắt ngắn hoặc chuyển thành số. Mã một ký tự hợp lệ; chuỗi rỗng không được ghi.

Khi tìm kiếm hoặc thay đổi cài đặt, ứng dụng không tự kéo tiêu điểm về ô capture. Sau khi thao tác xong hãy bấm **Focus Scanner**. Nếu quét trong lúc con trỏ đang ở Search hoặc ứng dụng khác, dữ liệu sẽ đi vào vị trí đó: đây là hành vi bàn phím của thiết bị.

## 3. Chọn hậu tố và thời gian chờ

- **Enter suffix:** cấu hình máy quét gửi một Enter sau dữ liệu; chọn Enter suffix trong ứng dụng.
- **Tab suffix:** cấu hình máy quét gửi một Tab; chọn Tab suffix. Tab chỉ bị chặn điều hướng trong ô capture khi chế độ này hoạt động.
- **Inactivity timeout:** dùng cho máy quét không có hậu tố. Mặc định 150 ms; cho phép 50–1000 ms. Khoảng nghỉ giữa các ký tự phải ngắn hơn timeout, còn khoảng nghỉ giữa hai mã phải dài hơn timeout. Enter/Tab trong chế độ này cũng kết thúc ngay và hủy bộ hẹn giờ để tránh ghi hai lần.

Cách lập trình hậu tố tùy hãng: tìm các mã cấu hình **Suffix / Terminator / CR / Enter / HT / Tab** trong sách hướng dẫn máy quét, quét mã cấu hình phù hợp. Tránh cấu hình nhiều hậu tố cùng lúc. Không có API trình duyệt nào được dùng để thay đổi máy quét.

Nếu thiếu hậu tố, dữ liệu được giữ nguyên trong ô. **Complete input** kết thúc thủ công. Khi trang hoặc ô mất tiêu điểm, timeout bị hủy và nội dung dở dang được giữ lại cùng thông báo. Kiểm tra nội dung trước khi tiếp tục; không thể tự suy ra ranh giới của hai mã khi thiết bị không gửi dấu phân cách. Timeout không thể bảo đảm tách mã nếu không có khoảng nghỉ, cũng có thể chia một mã khi máy quét gửi quá chậm.

Nội dung QR có Enter/Tab thật có thể trùng với hậu tố. Với nội dung nhiều dòng, dùng phần **Manual entry & multiline QR text**, dán toàn bộ chuỗi và bấm **Add record**; Enter trong ô này chỉ xuống dòng. Thiết bị keyboard wedge không thể truyền mọi byte điều khiển hoặc mọi Unicode một cách chính xác. Chọn cấu hình Unicode/layout thích hợp theo hãng. Văn bản trong textarea dùng xuống dòng LF theo quy ước trình duyệt, không phải bộ lưu dữ liệu nhị phân nguyên byte.

## 4. Lịch sử, bản sao và cài đặt

- Search chỉ lọc bảng; Export CSV vẫn xuất toàn bộ lịch sử.
- Copy sao chép đúng chuỗi gốc. Nếu Clipboard API không dùng được trên `file://`, ứng dụng thử cách sao chép tương thích. Nếu vẫn thất bại, ô có nội dung được chọn sẽ xuất hiện cuối trang để bấm Ctrl+C.
- Delete xóa một bản ghi. Clear history yêu cầu xác nhận trước khi xóa toàn bộ. Xuất CSV trước nếu cần bản sao.
- Duplicates = tổng bản ghi trừ số chuỗi khác nhau, phân biệt hoa/thường và dấu cách. Mã đầu tiên còn lại trong lịch sử là Unique; những lần sau là Duplicate. Sau khi xóa bản ghi, trạng thái được tính lại.
- Highlight duplicates chỉ bật/tắt màu tô; cột trạng thái và thống kê vẫn có.
- Remember scan history bật lưu/khôi phục localStorage. Tắt tùy chọn này sẽ cố gắng xóa lịch sử đã lưu nhưng giữ phiên đang mở. Bật lại sẽ lưu phiên hiện tại. Cài đặt vẫn được lưu riêng.
- Restore default settings khôi phục Enter, 150 ms, âm thanh bật, tô trùng bật và lưu lịch sử bật; không xóa lịch sử.
- Bảng hiển thị 100 bản ghi mỗi lần để hạn chế số phần tử trên trang; Show 100 more hiển thị thêm. Không tự xóa bản ghi cũ.

## 5. Xuất CSV và Microsoft Excel tiếng Nhật

Bấm **Export CSV** để tải `barcode_history_YYYYMMDD_HHMMSS.csv`. File có UTF-8 BOM, cột No, Barcode, Date, Time, Duplicate; dấu phẩy, dấu ngoặc kép và xuống dòng được escape. Dữ liệu tiếng Nhật được mã hóa UTF-8. Ngày/giờ xuất theo múi giờ máy đang sử dụng.

**CSV không có kiểu dữ liệu ô.** Không thể bắt Excel ở mọi phiên bản vừa mở trực tiếp CSV, vừa giữ nguyên mọi chuỗi và số 0 đầu, vừa không dùng công thức. Để chống CSV formula injection, ứng dụng thêm **một dấu nháy đơn `'` trước mọi Barcode** trong CSV. Ví dụ `000123` xuất thành `'000123`, còn `=1+1` thành `'=1+1`. Không tạo công thức kiểu `="000123"`. Chuỗi gốc trong lịch sử và chức năng Copy không thay đổi.

Một số phiên bản Excel sẽ hiển thị dấu nháy bảo vệ này. Để nhập chính xác:

1. Excel → **Data / データ → From Text/CSV / テキストまたは CSV から**.
2. Chọn mã hóa **65001: Unicode (UTF-8)** và dấu phân cách comma.
3. Chọn **Transform Data / データの変換**. Xóa bước tự động **Changed Type** nếu có và đặt cột Barcode thành **Text / テキスト**.
4. Nếu cần giá trị gốc không có dấu bảo vệ, bỏ đúng **một ký tự đầu** của cột Barcode trong Power Query khi cột vẫn là Text, rồi tải vào Excel. Không xóa mọi dấu nháy vì mã gốc có thể chứa dấu nháy.
5. Không chuyển cột thành Number, không bỏ dấu bảo vệ trong CSV rồi mở lại bằng nhấp đúp. Khi xuất CSV lần nữa từ Excel, hãy kiểm tra lại chính sách an toàn của phần mềm tiếp nhận.

Xuất CSV vẫn hoạt động khi localStorage bị chặn hoặc đầy. File dài hơn giới hạn một ô Excel có thể không hiển thị hết trong Excel; kiểm tra bằng trình đọc văn bản phù hợp. Tính tương thích Excel thực tế cần được nghiệm thu trên phiên bản đang sử dụng.

## 6. Giới hạn và xử lý lỗi

- Sự kiện bàn phím không chứng minh dữ liệu đến từ máy quét thay vì người gõ nhanh. Ứng dụng không phát hiện cắm/rút thiết bị.
- localStorage trên `file://` phụ thuộc trình duyệt, profile và chính sách. Đổi đường dẫn file, chuyển máy, dùng chế độ riêng tư, xóa dữ liệu trình duyệt có thể làm lịch sử không còn truy cập được. Không coi đây là cơ sở dữ liệu hay bản sao lưu.
- Khi lưu bị chặn/đầy, cảnh báo hiển thị rõ; dữ liệu phiên hiện tại vẫn dùng được. Xuất CSV trước khi đóng. Không có giới hạn cắt chuỗi tùy ý, nhưng bộ nhớ máy, localStorage và trình duyệt vẫn hữu hạn.
- Không đồng bộ nhiều cửa sổ. Chỉ dùng một tab cho một thư mục ứng dụng; hai tab có thể ghi đè lịch sử được lưu.
- Mất hậu tố, chọn nhầm chế độ hoặc mất focus: kiểm tra nội dung dở dang, hoàn tất thủ công rồi cấu hình lại. Không thể xác nhận một barcode “đầy đủ” chỉ từ ký tự được nhận.
- Ctrl+C, Ctrl+V và phím tắt trình duyệt không bị scanner chặn. Ctrl+V vào capture được coi là dữ liệu nhập; ở timeout mode sẽ hoàn tất sau thời gian chờ.
- Trình duyệt có thể chặn phát âm thanh trước tương tác đầu tiên; bấm Focus Scanner. Tắt âm thanh nếu không cần.
- QR URL chỉ được hiển thị như văn bản, không tự mở. Nội dung được đưa vào DOM bằng `textContent`; không dùng `innerHTML` để dựng dữ liệu quét.
- Không gửi dữ liệu ra mạng. Lịch sử localStorage không được mã hóa; người có quyền truy cập profile máy có thể đọc.
- Khi không có máy quét, gõ mã vào capture rồi dùng hậu tố hoặc dùng Manual entry. Việc này không cần thiết bị kết nối.

## 7. Kiểm thử

Mở `tests/run.html` bằng nhấp đúp để chạy 14 nhóm kiểm thử logic tổng hợp (không cần cài công cụ). Trang này dùng sự kiện giả lập, không thay lịch sử của ứng dụng. Xem `test-cases.md` để nghiệm thu đầy đủ với máy quét, Windows và Excel.

Các kiểm thử logic đã chạy thành công trong môi trường phát triển; kiểm tra giao diện qua `file://` tự động bị chính sách môi trường chặn. Chưa xác minh trực tiếp máy quét USB, Chrome/Edge trên Windows hoặc Excel tiếng Nhật. Không coi kết quả logic là thay thế kiểm thử thiết bị thật.

## Cấu trúc

```text
local-barcode-scanner/
├── index.html
├── css/style.css
├── js/scanner.js
├── js/storage.js
├── js/csv.js
├── js/app.js
├── README.md
├── test-cases.md
└── tests/
    ├── run.html
    └── test.js
```

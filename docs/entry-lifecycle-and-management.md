# Entry Lifecycle & User Control

## Mục tiêu

AgentDock phải giữ đầy đủ Memory lịch sử nhưng không được để một quyết định đã hoàn thành tiếp tục xuất hiện như **Open Item** và làm AI sau hiểu sai ưu tiên của User. User, với vai trò Owner của Project, cần có quyền quản trị rõ ràng đối với từng entry.

## Lifecycle cho quyết định

Một Open Item có `result = pending`, `partial` hoặc `failed` có thể được User xác nhận là đã xử lý, đã lỗi thời hoặc không còn cần AI tiếp tục theo đuổi. Với `type = decision`, UI hiển thị **Close decision**; với các loại `action`, `state` hoặc `finding`, UI hiển thị **Mark resolved**. Cả hai thao tác cập nhật entry sang `result = decided` và lưu `updated_at`. Entry không bị xóa, do đó timeline, provenance và nguyên nhân ban đầu vẫn còn nguyên vẹn. Digest chỉ nên tính `pending`, `partial` hoặc `failed` vào Open Items; entry `decided` không còn được coi là việc cần AI tiếp tục theo đuổi.

> Việc đóng là một xác nhận của User về trạng thái hiện tại, không phải suy luận tự động của AI từ văn bản timeline.

## Quyền quản trị

| Hành động | Owner | Editor | Viewer |
|---|---:|---:|---:|
| Đọc entry | Có | Có | Có |
| Tạo entry | Có | Có | Không |
| Chỉnh sửa entry | Có | Có | Không |
| Đóng decision đang mở | Có | Có | Không |
| Xóa vĩnh viễn entry | Có | Không | Không |

Chỉnh sửa dùng khi nội dung cần được làm rõ hoặc sửa để tránh AI tiếp theo hiểu sai. Xóa là thao tác vĩnh viễn, dành riêng cho Owner và yêu cầu xác nhận có chủ đích. Khi entry vẫn có giá trị lịch sử nhưng chỉ cần loại khỏi Open Items, User nên dùng **Close decision** thay vì xóa.

## UI behavior

Từ Evidence Inspector, Owner/Editor nhìn thấy ba thao tác tùy theo loại entry và trạng thái:

1. **Close decision** xuất hiện với decision đang `pending`, `partial` hoặc `failed`; **Mark resolved** xuất hiện với mọi Open Item còn lại ở các trạng thái này.
2. **Edit entry** mở form được điền sẵn; cập nhật qua authenticated Supabase session và buộc xác nhận trước khi ghi.
3. **Delete entry** chỉ hiện với Owner; confirmation yêu cầu nhập `DELETE`, sau đó xóa qua RLS.

Tất cả thao tác thành công phải tải lại Memory, dashboard counts, filters và inspector từ database để trạng thái UI luôn khớp source of truth.

## Database boundary

Giao diện không phải là lớp bảo mật. Supabase RLS phải độc lập cho phép `UPDATE` với Owner/Editor và `DELETE` với Owner; Viewer không có quyền thay đổi. Migration đi kèm là `supabase/migrations/20260819_entry_management.sql`.

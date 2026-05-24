<!-- CODEGRAPH_START -->
## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information grep cannot.

### When to prefer codegraph over native search

Use codegraph for **structural** questions — what calls what, what would break, where is X defined, what is X's signature. Use native grep/read only for **literal text** queries (string contents, comments, log messages) or after you already have a specific file open.

| Question | Tool |
|---|---|
| "Where is X defined?" / "Find symbol named X" | `codegraph_search` |
| "What calls function Y?" | `codegraph_callers` |
| "What does Y call?" | `codegraph_callees` |
| "What would break if I changed Z?" | `codegraph_impact` |
| "Show me Y's signature / source / docstring" | `codegraph_node` |
| "Give me focused context for a task/area" | `codegraph_context` |
| "See several related symbols' source at once" | `codegraph_explore` |
| "What files exist under path/" | `codegraph_files` |
| "Is the index healthy?" | `codegraph_status` |

### Rules of thumb

- **Answer directly — don't delegate exploration.** For "how does X work" / architecture / trace questions, answer with 2-3 codegraph calls: `codegraph_context` first, then ONE `codegraph_explore` for the source of the symbols it surfaces. Codegraph IS the pre-built index, so spawning a separate file-reading sub-task/agent — or running a grep + read loop — repeats work codegraph already did and costs more for the same answer.
- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with grep — that's slower, less accurate, and wastes context.
- **Don't grep first** when looking up a symbol by name. `codegraph_search` is faster and returns kind + location + signature in one call.
- **Don't chain `codegraph_search` + `codegraph_node`** when you just want context — `codegraph_context` is one call.
- **Don't loop `codegraph_node` over many symbols** — one `codegraph_explore` call returns several symbols' source grouped in a single capped call, while each separate node/Read call re-reads the whole context and costs far more.
- **Index lag**: the file watcher debounces ~500ms behind writes; don't re-query immediately after editing a file in the same turn.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: *"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"*
<!-- CODEGRAPH_END -->

## SearchSelect — select kèm search bắt buộc

Mọi `<Select>` được populate từ API hoặc có thể có **nhiều hơn ~10 options** phải dùng component `SearchSelect` từ `@/components/common/SearchSelect`.

```tsx
import { SearchSelect } from '@/components/common/SearchSelect'

<SearchSelect
  options={items.map((item) => ({ value: item.id, label: item.name }))}
  value={selectedId}
  onValueChange={(v) => { setSelectedId(v); setCurrentPage(1) }}
  placeholder="Chọn..."
  className="w-64"
/>
```

Các trường hợp áp dụng: `spot_id`, `business_id`, `category_id`, `user_id`, `tour_id`, `role_id` khi list > ~10 phần tử, mọi select fetch từ API.  
**Không áp dụng** cho: status enum (3–4 giá trị cố định), limit selector, boolean filter.

## Module CRUD structure

Mỗi module CRUD quản trị **bắt buộc** có đủ 3 file:

| File | Vai trò |
|---|---|
| `src/pages/<Domain>/index.tsx` | Datatable hiển thị danh sách, filter, pagination, action buttons |
| `src/pages/<Domain>/*DetailDialog.tsx` | Dialog xem chi tiết một bản ghi (read-only) |
| `src/pages/<Domain>/*FormDialog.tsx` | Dialog thêm mới hoặc chỉnh sửa bản ghi (POST / PUT) |

Quy tắc:
- Không tạo module mới nếu thiếu bất kỳ file nào trong bộ 3 trên.
- `DetailDialog` nhận `id` hoặc object qua props, gọi API `getById` hoặc hiển thị data từ props; có nút Pen (`onEdit`) → mở `FormDialog`.
- `FormDialog` xử lý cả create (null entity) lẫn edit (entity đã có); submit gọi POST hoặc PUT tương ứng.
- Ngoại lệ duy nhất: module **read-only** thuần túy (audit-log, statistics, map public) — chỉ cần `DetailDialog`, không cần `FormDialog`.

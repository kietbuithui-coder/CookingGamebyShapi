// Cho phép các bài test đọc thẳng nội dung tệp nguồn qua `?raw` / `?inline` của Vite (khỏi cần kiểu Node).
declare module '*?raw' { const s: string; export default s; }

// Vite trả nội dung tệp CSS dưới dạng chuỗi khi import với `?inline` (dùng cho test canh giao diện).
declare module '*.css?inline' { const s: string; export default s; }

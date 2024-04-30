/** @type {import('next').NextConfig} */
const nextConfig = {
    // この関数は、APIエンドポイントへのリクエストに対してレスポンスヘッダーを設定するために使用されます
    async headers() {
        return [
          {
            // "/api/"で始まるすべてのパスにマッチします
            source: "/api/(.*)",
            headers: [
              {
                // Access-Control-Allow-Originヘッダーを設定し、すべてのオリジンからのリクエストを許可します
                key: "Access-Control-Allow-Origin",
                value: "*",
              },
              {
                // Access-Control-Allow-Methodsヘッダーを設定し、許可されるHTTPメソッドを指定します
                key: "Access-Control-Allow-Methods",
                value: "GET, POST, PUT, DELETE, OPTIONS",
              },
              {
                // Access-Control-Allow-Headersヘッダーを設定し、許可されるリクエストヘッダーを指定します
                key: "Access-Control-Allow-Headers",
                value: "Content-Type, Authorization",
              },
              {
                // Content-Rangeヘッダーを設定します (この例では特に意味はありません)
                key: "Content-Range",
                value: "bytes : 0-9/*",
              },
            ],
          },
        ];
      },
};

// 設定をエクスポートします
export default nextConfig;
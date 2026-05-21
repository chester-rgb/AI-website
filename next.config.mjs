const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/test/ai_web";

/** @type {import('next').NextConfig} */
const nextConfig = {
	basePath,
	env: {
		NEXT_PUBLIC_BASE_PATH: basePath,
	},
};

export default nextConfig;

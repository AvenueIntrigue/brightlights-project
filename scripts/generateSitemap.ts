import { SitemapStream } from "sitemap";
import { createWriteStream } from "node:fs";
import { resolve } from "node:path";
// import { fetchBlogPosts } from "../src/client/api.js"; // Commented out until blogposts available
// import type { BlogPost } from "../src/shared/interfaces.js"; // Commented out

// Define static routes from App.tsx
const staticRoutes = [
  { url: "/", changefreq: "daily", priority: 1.0, lastmod: new Date() },
  { url: "/contact", changefreq: "monthly", priority: 0.6, lastmod: new Date() },
  { url: "/blog", changefreq: "weekly", priority: 0.8, lastmod: new Date() },
  { url: "/pricing", changefreq: "monthly", priority: 0.8, lastmod: new Date() },
  { url: "/about", changefreq: "monthly", priority: 0.7, lastmod: new Date() },
  { url: "/services", changefreq: "weekly", priority: 0.8, lastmod: new Date() },
  { url: "/web-development", changefreq: "weekly", priority: 0.7, lastmod: new Date() },
  { url: "/app-development", changefreq: "weekly", priority: 0.7, lastmod: new Date() },
  { url: "/graphic-design", changefreq: "weekly", priority: 0.7, lastmod: new Date() },
  { url: "/web3", changefreq: "weekly", priority: 0.7, lastmod: new Date() },
  { url: "/projects", changefreq: "weekly", priority: 0.8, lastmod: new Date() },
  { url: "/portfolio", changefreq: "weekly", priority: 0.8, lastmod: new Date() },

];

// // Fetch dynamic routes (Blog posts only) - Commented out until blogposts available
// async function fetchDynamicRoutes(): Promise<
//   { url: string; changefreq: string; priority: number; lastmod: Date }[]
// > {
//   try {
//     const blogPosts: BlogPost[] = await fetchBlogPosts();
//     if (!blogPosts || blogPosts.length === 0) {
//       console.warn("No blog posts found, using fallback routes");
//       return [
//         { url: "/blog/post-1", changefreq: "weekly", priority: 0.6, lastmod: new Date("2025-04-10") },
//         { url: "/blog/post-2", changefreq: "weekly", priority: 0.6, lastmod: new Date("2025-04-05") },
//       ];
//     }
//     const blogRoutes = blogPosts.map((post) => ({
//       url: `/blog/${post._id}`,
//       changefreq: "weekly",
//       priority: 0.6,
//       lastmod: new Date(post.createdOn || Date.now()),
//     }));
//     return blogRoutes;
//   } catch (error) {
//     console.error("Error fetching blog posts, using fallback:", error);
//     return [
//       { url: "/blog/post-1", changefreq: "weekly", priority: 0.6, lastmod: new Date("2025-04-10") },
//       { url: "/blog/post-2", changefreq: "weekly", priority: 0.6, lastmod: new Date("2025-04-05") },
//     ];
//   }
// }

async function generateSitemap(): Promise<void> {
  const sitemap = new SitemapStream({ hostname: "https://brightlightscreative.com" });
  const writeStream = createWriteStream(resolve("public/sitemap.xml"));

  // Add static routes
  staticRoutes.forEach((route) => sitemap.write(route));

  // // Add dynamic routes - Commented out until blogposts available
  // const dynamicRoutes = await fetchDynamicRoutes();
  // dynamicRoutes.forEach((route) => sitemap.write(route));

  sitemap.end();

  // Write sitemap to file
  return new Promise<void>((resolve, reject) => {
    sitemap
      .pipe(writeStream)
      .on("finish", () => {
        console.log("Sitemap generated at public/sitemap.xml");
        resolve();
      })
      .on("error", (error) => {
        console.error("Error writing sitemap:", error);
        reject(error);
      });
  });
}

generateSitemap().catch(console.error);
Refactor this blog_v2 Astro project. Here are the specific issues to fix:

1. **Extract PostCard component**: The article card template is duplicated across 5+ files (index.astro, posts/index.astro, posts/page/[page].astro, tags/[tag].astro, search.astro). Extract a reusable PostCard.astro component that takes a post object as prop. Also create a helper function for generating post URLs (replacing .md from id).

2. **Fix Giscus duplication**: In [...slug].astro, the Giscus script is written inline AND the GiscusComments component exists. Remove the inline script and use only the GiscusComments component.

3. **Fix XSS in search**: search.astro uses innerHTML to render search results with user-highlighted content. Replace with a safer approach - use textContent with DOM manipulation instead of string-based innerHTML, or properly sanitize the input.

4. **Improve search performance**: search.astro loads ALL post data via define:vars which bloats the HTML. Generate a search-index.json at build time, and fetch it from the client side instead.

5. **Add keys to list renders**: Several .map() calls lack keys (archives.astro sections, tags). Add proper key attributes.

6. **Create slug utility**: Create src/utils/slug.ts with a getPostUrl helper that does post.id.replace(".md", ""). Use it everywhere instead of inline .replace().

7. **Clean up console.logs in stats.ts**: Wrap debug console.log calls with import.meta.env.DEV checks so they dont pollute production.

8. **Add missing RSS feed**: Add an rss.xml.js endpoint in src/pages/ that generates an RSS/Atom feed from posts.

After making changes, run npm run build to verify everything still compiles correctly. Do NOT modify any markdown content files or configuration files like wrangler.toml, package.json.

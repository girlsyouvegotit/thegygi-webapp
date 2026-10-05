import { BlogPost, type IBlogPost } from "../models/blog-post.model.js";
import { AboutPage } from "../models/about-page.model.js";
import User from "../models/user.model.js";
import { badRequest, conflict, notFound } from "../middleware/error.middleware.js";
import { slugify } from "../utils/slug.util.js";
import { defaultAboutSections, seedBlogPosts } from "./content-seed.js";

async function resolveSeedAuthorId(): Promise<string> {
  const writer = await User.findOne({
    role: { $in: ["writer", "admin", "super_admin"] },
    isActive: { $ne: false },
  })
    .select("_id")
    .lean();
  if (writer?._id) return String(writer._id);

  const anyUser = await User.findOne({ isActive: { $ne: false } })
    .select("_id")
    .lean();
  if (!anyUser?._id) throw badRequest("No users available to seed content");
  return String(anyUser._id);
}

export async function ensureContentSeeded(): Promise<void> {
  const [postCount, aboutCount] = await Promise.all([
    BlogPost.countDocuments(),
    AboutPage.countDocuments(),
  ]);

  if (postCount === 0) {
    const authorId = await resolveSeedAuthorId();
    await BlogPost.insertMany(seedBlogPosts(authorId));
  }

  if (aboutCount === 0) {
    await AboutPage.create({
      status: "published",
      sections: defaultAboutSections(),
      seoTitle: "About GYGI — Girls You Got It",
      seoDescription:
        "Learn about Girls You Got It: free excellent education, mentorship, and impact across Africa.",
      publishedAt: new Date(),
    });
  } else {
    // Keep published About team in sync with current leadership copy.
    await AboutPage.updateMany(
      { "sections.team.members.name": "Kemi" },
      {
        $set: {
          "sections.team.members.$[m].name": "Teniade",
          "sections.team.members.$[m].role": "CEO",
          "sections.team.members.$[m].bio":
            "Leads GYGI’s vision for free, excellent education and steers program quality across the platform.",
        },
      },
      { arrayFilters: [{ "m.name": "Kemi" }] },
    );
  }
}

export async function listPublicPosts(query: {
  q?: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "popular";
}) {
  await ensureContentSeeded();
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(24, Math.max(1, query.limit || 9));
  const filter: Record<string, unknown> = { status: "published" };

  if (query.category) filter.category = query.category;
  if (query.tag) filter.tags = query.tag;
  if (query.q) {
    filter.$or = [
      { title: { $regex: query.q, $options: "i" } },
      { excerpt: { $regex: query.q, $options: "i" } },
      { tags: { $regex: query.q, $options: "i" } },
    ];
  }

  const sort =
    query.sort === "popular"
      ? ({ viewCount: -1, publishedAt: -1 } as const)
      : ({ publishedAt: -1 } as const);

  const [items, total, categories] = await Promise.all([
    BlogPost.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name avatar bio role")
      .lean(),
    BlogPost.countDocuments(filter),
    BlogPost.distinct("category", { status: "published" }),
  ]);

  return {
    posts: items,
    categories,
    pagination: {
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      limit,
    },
  };
}

export async function getPublicPostBySlug(slug: string) {
  await ensureContentSeeded();
  const post = await BlogPost.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { viewCount: 1 } },
    { new: true },
  )
    .populate("author", "name avatar bio role")
    .lean();

  if (!post) throw notFound("Post not found");

  const related = await BlogPost.find({
    status: "published",
    _id: { $ne: post._id },
    $or: [{ category: post.category }, { tags: { $in: post.tags || [] } }],
  })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select("title slug excerpt coverImage publishedAt category tags")
    .lean();

  return { post, related };
}

export async function getPublishedAbout() {
  await ensureContentSeeded();
  const about = await AboutPage.findOne({ status: "published" })
    .sort({ publishedAt: -1, updatedAt: -1 })
    .lean();
  if (!about) throw notFound("About page not published yet");
  return about;
}

/** Public roster of GYGI writers + published authors for the Journal sidebar. */
export async function listPublicWriters(limit = 8) {
  await ensureContentSeeded();
  const cap = Math.min(20, Math.max(1, limit));

  const [writers, postCounts] = await Promise.all([
    User.find({
      role: "writer",
      isActive: { $ne: false },
      deletedAt: null,
    })
      .select("name avatar bio role socialLinks")
      .sort({ name: 1 })
      .lean(),
    BlogPost.aggregate<{ _id: unknown; count: number }>([
      { $match: { status: "published" } },
      { $group: { _id: "$author", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const countMap = new Map(
    postCounts.map((row) => [String(row._id), row.count]),
  );

  const mapWriter = (w: {
    _id: unknown;
    name: string;
    avatar?: string | null;
    bio?: string | null;
    role: string;
    socialLinks?: {
      twitter?: string | null;
      linkedin?: string | null;
      instagram?: string | null;
      facebook?: string | null;
      website?: string | null;
    } | null;
  }) => ({
    _id: String(w._id),
    name: w.name,
    avatar: w.avatar || null,
    bio: w.bio || (w.role === "writer" ? "GYGI Writer" : "GYGI Editorial"),
    role: w.role,
    postCount: countMap.get(String(w._id)) || 0,
    socialLinks: {
      twitter: w.socialLinks?.twitter || null,
      linkedin: w.socialLinks?.linkedin || null,
      instagram: w.socialLinks?.instagram || null,
      facebook: w.socialLinks?.facebook || null,
      website: w.socialLinks?.website || null,
    },
  });

  const byId = new Map<string, ReturnType<typeof mapWriter>>();
  for (const w of writers) {
    byId.set(String(w._id), mapWriter(w));
  }

  // Include published-story authors so editorial voices appear with socials
  const authorIds = postCounts
    .map((row) => row._id)
    .filter(Boolean)
    .slice(0, cap);

  if (authorIds.length > 0) {
    const authors = await User.find({
      _id: { $in: authorIds },
      isActive: { $ne: false },
      deletedAt: null,
    })
      .select("name avatar bio role socialLinks")
      .lean();

    for (const a of authors) {
      const id = String(a._id);
      if (!byId.has(id)) byId.set(id, mapWriter(a));
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => (b.postCount || 0) - (a.postCount || 0) || a.name.localeCompare(b.name))
    .slice(0, cap);
}

export async function listWriterPosts(query: {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  await ensureContentSeeded();
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const filter: Record<string, unknown> = {};
  if (query.status && query.status !== "all") filter.status = query.status;
  if (query.q) {
    filter.$or = [
      { title: { $regex: query.q, $options: "i" } },
      { excerpt: { $regex: query.q, $options: "i" } },
    ];
  }

  const [posts, total] = await Promise.all([
    BlogPost.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name avatar")
      .lean(),
    BlogPost.countDocuments(filter),
  ]);

  return {
    posts,
    pagination: {
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      limit,
    },
  };
}

export async function getWriterDashboardStats() {
  await ensureContentSeeded();
  const [draft, published, archived, about, recent] = await Promise.all([
    BlogPost.countDocuments({ status: "draft" }),
    BlogPost.countDocuments({ status: "published" }),
    BlogPost.countDocuments({ status: "archived" }),
    AboutPage.findOne().sort({ updatedAt: -1 }).lean(),
    BlogPost.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title slug status updatedAt publishedAt")
      .lean(),
  ]);

  return {
    counts: { draft, published, archived, total: draft + published + archived },
    about: about
      ? {
          status: about.status,
          updatedAt: about.updatedAt,
          publishedAt: about.publishedAt,
        }
      : null,
    recent,
  };
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = slugify(base) || `post-${Date.now()}`;
  let i = 0;
  while (true) {
    const candidate = i === 0 ? slug : `${slug}-${i}`;
    const existing = await BlogPost.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select("_id")
      .lean();
    if (!existing) return candidate;
    i += 1;
  }
}

export async function createPost(
  authorId: string,
  input: Partial<IBlogPost> & { title: string; excerpt: string; content: string },
) {
  const slug = await uniqueSlug(input.slug || input.title);
  const status = input.status || "draft";
  const post = await BlogPost.create({
    title: input.title,
    slug,
    excerpt: input.excerpt,
    content: input.content,
    coverImage: input.coverImage || null,
    category: input.category || "Education",
    tags: input.tags || [],
    status,
    author: authorId,
    publishedAt: status === "published" ? new Date() : null,
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
  });
  return post;
}

export async function updatePost(
  id: string,
  input: Partial<IBlogPost> & { slug?: string },
) {
  const post = await BlogPost.findById(id);
  if (!post) throw notFound("Post not found");

  if (input.title !== undefined) post.title = input.title;
  if (input.excerpt !== undefined) post.excerpt = input.excerpt;
  if (input.content !== undefined) post.content = input.content;
  if (input.coverImage !== undefined) post.coverImage = input.coverImage;
  if (input.category !== undefined) post.category = input.category;
  if (input.tags !== undefined) post.tags = input.tags;
  if (input.seoTitle !== undefined) post.seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined)
    post.seoDescription = input.seoDescription;

  if (input.slug !== undefined || input.title !== undefined) {
    post.slug = await uniqueSlug(input.slug || post.title, String(post._id));
  }

  if (input.status !== undefined) {
    const prev = post.status;
    post.status = input.status;
    if (input.status === "published" && prev !== "published") {
      post.publishedAt = new Date();
    }
    if (input.status !== "published") {
      // keep publishedAt history for republish; don't clear
    }
  }

  await post.save();
  return post;
}

export async function deletePost(id: string) {
  const post = await BlogPost.findByIdAndDelete(id);
  if (!post) throw notFound("Post not found");
  return { deleted: true };
}

export async function getPostForWriter(id: string) {
  const post = await BlogPost.findById(id)
    .populate("author", "name avatar")
    .lean();
  if (!post) throw notFound("Post not found");
  return post;
}

export async function getAboutForWriter() {
  await ensureContentSeeded();
  let about = await AboutPage.findOne().sort({ updatedAt: -1 });
  if (!about) {
    about = await AboutPage.create({
      status: "draft",
      sections: defaultAboutSections(),
      seoTitle: "About GYGI — Girls You Got It",
      seoDescription:
        "Learn about Girls You Got It: free excellent education across Africa.",
    });
  }
  return about;
}

export async function updateAboutDraft(
  userId: string,
  input: {
    sections?: unknown;
    seoTitle?: string | null;
    seoDescription?: string | null;
    publish?: boolean;
  },
) {
  const about = await getAboutForWriter();
  if (input.sections !== undefined) {
    about.sections = input.sections as typeof about.sections;
  }
  if (input.seoTitle !== undefined) about.seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined)
    about.seoDescription = input.seoDescription;
  about.updatedBy = userId as unknown as typeof about.updatedBy;

  if (input.publish) {
    about.status = "published";
    about.publishedAt = new Date();
  }

  await about.save();
  return about;
}

export async function publishAbout(userId: string) {
  return updateAboutDraft(userId, { publish: true });
}

/** Guard against duplicate slug on create when client sends custom slug */
export async function assertSlugAvailable(slug: string, excludeId?: string) {
  const normalized = slugify(slug);
  if (!normalized) throw badRequest("Invalid slug");
  const existing = await BlogPost.findOne({
    slug: normalized,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })
    .select("_id")
    .lean();
  if (existing) throw conflict("Slug already in use");
  return normalized;
}

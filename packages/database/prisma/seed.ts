import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
}

function doc(...content: TiptapNode[]) {
  return { type: "doc", content };
}

function p(text: string): TiptapNode {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

function bulletList(items: string[]): TiptapNode {
  return {
    type: "bulletList",
    content: items.map((text) => ({
      type: "listItem",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    })),
  };
}

/**
 * Default CMS pages seeded per journal (PRD §10), written as a single
 * richText block so they stay compatible with the admin's page editor,
 * which only ever reads/writes one richText block per page.
 */
function defaultPages(journalName: string) {
  return [
    {
      slug: "home",
      title: "Home",
      doc: doc(
        p(
          `${journalName} is a peer-reviewed, open-access journal publishing original research and review articles. This introduction is placeholder text — edit it from the admin dashboard's Pages tab to describe the journal's aims and scope.`,
        ),
        p(
          "Replace this paragraph with a short welcome message, the journal's focus areas, and why authors should submit here.",
        ),
      ),
    },
    {
      slug: "about",
      title: "About the Journal",
      doc: doc(
        p(
          `${journalName} publishes original research, review articles, and case studies. This is placeholder content — edit it from the admin dashboard to describe the journal's aims and scope, focus areas, and indexing status.`,
        ),
        p("Aims and Scope"),
        bulletList([
          "Describe the subject areas and disciplines the journal covers.",
          "List the types of manuscripts accepted (original research, reviews, case studies, etc.).",
          "Mention indexing databases and accreditation, if any.",
        ]),
      ),
    },
    {
      slug: "editorial-board",
      title: "Editorial Board",
      doc: doc(
        p(
          "This page lists the journal's editorial team. Replace the placeholder roles below with actual names, affiliations, and ORCID/profile links from the admin dashboard.",
        ),
        bulletList([
          "Editor-in-Chief — Name, Affiliation",
          "Managing Editor — Name, Affiliation",
          "Editorial Board Member — Name, Affiliation",
          "Editorial Board Member — Name, Affiliation",
        ]),
      ),
    },
    {
      slug: "author-guidelines",
      title: "Author Guidelines",
      doc: doc(
        p(
          "This page explains how to prepare and submit a manuscript. Replace this placeholder with the journal's actual author guidelines.",
        ),
        p("Manuscript Preparation"),
        bulletList([
          "Manuscripts must be written in clear, grammatical English or Indonesian.",
          "Use the journal's manuscript template (structure, citation style, and formatting).",
          "Include a structured abstract (150–250 words) and 3–5 keywords.",
        ]),
        p("Submission Process"),
        bulletList([
          "Manuscripts are submitted through the journal's online submission system.",
          "All submissions undergo an initial editorial screening before peer review.",
          "Authors will be notified of the editorial decision by email.",
        ]),
      ),
    },
    {
      slug: "reviewer-guidelines",
      title: "Reviewer Guidelines",
      doc: doc(
        p(
          "This page explains what is expected of peer reviewers. Replace this placeholder with the journal's actual reviewer guidelines.",
        ),
        bulletList([
          "Evaluate the manuscript's originality, methodology, and contribution to the field.",
          "Provide constructive, specific feedback for the authors.",
          "Disclose any conflicts of interest before accepting a review invitation.",
          "Maintain confidentiality — manuscripts under review must not be shared or discussed publicly.",
          "Reviews are typically expected within 2–3 weeks of accepting an invitation.",
        ]),
      ),
    },
    {
      slug: "review-process",
      title: "Review Process",
      doc: doc(
        p(
          "This page describes the journal's peer review workflow. Replace this placeholder with the journal's actual review process.",
        ),
        bulletList([
          "Initial editorial screening for scope and formatting.",
          "Double-blind peer review by at least two independent reviewers.",
          "Editorial decision: accept, minor revision, major revision, or reject.",
          "Revised manuscripts are re-reviewed before final acceptance.",
        ]),
      ),
    },
  ];
}

/**
 * Best-effort "Online Submission" link built from the journal's configured
 * OJS source, since the public API doesn't otherwise expose journalSource
 * (it's build-time-only data). Falls back to the OJS root when the OAI
 * endpoint doesn't match the expected `/index.php/<path>/oai` shape.
 */
function deriveSubmissionUrl(source: { ojsUrl: string; oaiEndpoint: string } | null): string | undefined {
  if (!source) return undefined;
  const base = source.ojsUrl.replace(/\/$/, "");
  const match = source.oaiEndpoint.match(/\/index\.php\/([^/]+)\/oai/);
  return match ? `${base}/${match[1]}/about/submissions` : base;
}

async function seedJournalContent(journal: { id: string; name: string }) {
  const source = await prisma.journalSource.findUnique({ where: { journalId: journal.id } });
  const onlineSubmissionUrl = deriveSubmissionUrl(source);

  for (const page of defaultPages(journal.name)) {
    await prisma.page.upsert({
      where: { journalId_slug: { journalId: journal.id, slug: page.slug } },
      update: {},
      create: {
        journalId: journal.id,
        slug: page.slug,
        title: page.title,
        status: "PUBLISHED",
        blocks: [{ id: "content", type: "richText", props: { contentJson: page.doc } }] as Prisma.InputJsonValue,
      },
    });
  }

  const existingMenu = await prisma.menu.findFirst({ where: { journalId: journal.id, location: "primary" } });
  if (!existingMenu) {
    await prisma.menu.create({
      data: {
        journalId: journal.id,
        name: "Primary",
        location: "primary",
        items: {
          create: [
            { label: "List of Issues", url: "/issues/", order: 0 },
            ...(onlineSubmissionUrl
              ? [{ label: "Online Submission", url: onlineSubmissionUrl, order: 1 }]
              : []),
          ],
        },
      },
    });
  }
}

async function main() {
  const themes = [
    { key: "default", name: "Default", description: "Baseline journal theme" },
    { key: "modern", name: "Modern", description: "Modern editorial layout" },
    { key: "journal", name: "Journal", description: "Classic academic journal layout" },
  ];

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { key: theme.key },
      update: {},
      create: theme,
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@unej.ac.id";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-me-in-production";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Publisher Admin",
      role: "admin",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  const journals = await prisma.journal.findMany({ select: { id: true, name: true } });
  for (const journal of journals) {
    await seedJournalContent(journal);
  }

  console.log(
    `Seeded ${themes.length} themes, admin user ${adminEmail}, and default content for ${journals.length} journal(s)`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
